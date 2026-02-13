/**
 * File: PTSLoggingConfiguration.cs
 * Purpose: Centralized Serilog logging configuration for FMS.PTS.WindowsService.
 *          Routes logs to domain-specific files based on SourceContext (class name).
 *          All log entries include the originating class name.
 * Dependencies: Serilog, Serilog.Sinks.File, LocalTimeJsonFormatter
 * Last Modified: 2026-02-13
 *
 * Key Methods:
 * - ConfigureFinalLogging(): Main entry point — configures all log sinks and routing
 *
 * Log Folder Structure (C:\Logs\FMS.PTS\):
 *   (root)         - Main unified JSON log (all events)
 *   device-raw/    - Raw WebSocket messages from PTS devices
 *   commands/      - Redis commands, pump commands, command execution
 *   transactions/  - Pump transactions, tank measurements, volume changes
 *   errors/        - Errors & Fatals only
 *   connections/   - Device connections, disconnections, health checks
 *
 * To add a new log category:
 *   1. Add a new sub-directory to SubDirectories array
 *   2. Add a new AddCategoryLogger() call in ConfigureFinalLogging()
 *   3. The filter uses SourceContext (class namespace) and/or message content
 */

using System;
using System.IO;
using FMS.PTS.WindowsService.Infrastructure.Logging;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;

namespace FMS.PTS.WindowsService.Infrastructure.Logging;

public static class PTSLoggingConfiguration
{
    private const int DefaultMaxFileSizeMB = 10;
    private const int DefaultRetainedFileCount = 31;

    private const string ConsoleTemplate =
        "[{Timestamp:HH:mm:ss} {Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}";

    private static readonly string[] SubDirectories =
        { "device-raw", "commands", "transactions", "errors", "connections" };

    /// <summary>
    /// Configures Serilog with domain-specific log file routing for PTS Windows Service.
    /// Replaces the inline ConfigureFinalLogging in Program.cs.
    /// </summary>
    public static void ConfigureFinalLogging(
        PTSServiceSettings ptsSettings,
        string environment)
    {
        if (ptsSettings?.Logging == null)
        {
            throw new InvalidOperationException("Logging configuration is missing in appsettings");
        }

        var maxFileSize = (ptsSettings.Logging.MaxFileSizeInMB > 0
            ? ptsSettings.Logging.MaxFileSizeInMB
            : DefaultMaxFileSizeMB) * 1024 * 1024;
        var retainedFiles = ptsSettings.Logging.RetainedFileCount > 0
            ? ptsSettings.Logging.RetainedFileCount
            : DefaultRetainedFileCount;

        var loggerConfig = new LoggerConfiguration()
            .MinimumLevel.Is(GetLogEventLevel(ptsSettings.Logging.MinimumLevel))
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Error)
            .MinimumLevel.Override("Pomelo.EntityFrameworkCore.MySql", LogEventLevel.Error)
            .Enrich.FromLogContext()
            .Enrich.WithEnvironmentName()
            .Enrich.WithMachineName();

        // Production-specific overrides to reduce log volume
        if (environment == "Production")
        {
            loggerConfig.MinimumLevel.Override(
                "FMS.PTS.WindowsService.Infrastructure.Communication.WebSocket.PTSWebSocketListenerService",
                LogEventLevel.Warning);
            loggerConfig.MinimumLevel.Override(
                "FMS.Application.Communication.Tracker.DeviceConnectionTracker",
                LogEventLevel.Warning);
            loggerConfig.MinimumLevel.Override(
                "FMS.Application.Communication.Redis",
                LogEventLevel.Warning);
            loggerConfig.MinimumLevel.Override(
                "Microsoft.AspNetCore.SignalR",
                LogEventLevel.Warning);
            loggerConfig.MinimumLevel.Override(
                "System.Net.Http.HttpClient",
                LogEventLevel.Warning);
        }

        // ─── CONSOLE: All logs with SourceContext ───
        loggerConfig.WriteTo.Logger(lc => lc
            .Filter.ByExcluding(le =>
                environment == "Development" &&
                le.Level < LogEventLevel.Warning &&
                le.Properties.TryGetValue("SourceContext", out var sourceContext) &&
                sourceContext is ScalarValue sv &&
                sv.Value is string contextString &&
                (contextString.StartsWith("Microsoft.EntityFrameworkCore") ||
                 contextString.StartsWith("Pomelo.EntityFrameworkCore")))
            .WriteTo.Console(
                outputTemplate: ConsoleTemplate,
                theme: AnsiConsoleTheme.Code));

        // Resolve log directory
        var logDirectory = Path.GetDirectoryName(ptsSettings.Logging.FilePath);
        var effectiveLogDirectory = string.IsNullOrEmpty(logDirectory)
            ? @"C:\Logs\FMS.PTS"
            : logDirectory;
        EnsureDirectories(effectiveLogDirectory);

        var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        var formatter = new LocalTimeJsonFormatter();

        // ─── MAIN LOG: All logs in JSON format (unified, for correlation) ───
        loggerConfig.WriteTo.File(
            formatter: formatter,
            path: Path.Combine(effectiveLogDirectory, $"pts-service-{timestamp}.log"),
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: retainedFiles,
            fileSizeLimitBytes: maxFileSize,
            rollOnFileSizeLimit: true,
            shared: true);

        // ─── RAW DEVICE MESSAGES: WebSocket raw messages from PTS devices ───
        AddCategoryLogger(loggerConfig, effectiveLogDirectory, "device-raw",
            $"raw-messages-{timestamp}.log", formatter, maxFileSize, 7,
            sourceContextContains: new[] { "PTSDeviceConnection" },
            messageContains: new[] { "Raw message" },
            requireBothSourceAndMessage: true);

        // ─── COMMANDS: Redis commands, command execution, pump commands ───
        AddCategoryLogger(loggerConfig, effectiveLogDirectory, "commands",
            $"commands-{timestamp}.log", formatter, maxFileSize, 7,
            sourceContextContains: new[] { "Command", "Redis", "PumpService" },
            messageContains: Array.Empty<string>());

        // ─── TRANSACTIONS: Pump transactions, tank measurements, volume changes ───
        AddCategoryLogger(loggerConfig, effectiveLogDirectory, "transactions",
            $"transactions-{timestamp}.log", formatter, maxFileSize, 14,
            sourceContextContains: new[]
            {
                "Transaction", "TankMeasurement", "TankVolume", "TankStock",
                "UploadStatus", "UploadTankMeasurement", "Reconciliation",
                "PumpTankTransfer"
            },
            messageContains: Array.Empty<string>());

        // ─── ERRORS: Errors and Fatals only ───
        AddLevelLogger(loggerConfig, effectiveLogDirectory, "errors",
            $"errors-{timestamp}.log", formatter, maxFileSize, 14,
            minLevel: LogEventLevel.Error);

        // ─── CONNECTIONS: Device connect/disconnect, health checks ───
        AddCategoryLogger(loggerConfig, effectiveLogDirectory, "connections",
            $"connections-{timestamp}.log", formatter, maxFileSize, 7,
            sourceContextContains: new[]
            {
                "Connection", "WebSocketListener", "DeviceActivity",
                "OrphanedTransaction", "StaleConnection"
            },
            messageContains: Array.Empty<string>());

        if (environment == "Development")
        {
            loggerConfig.WriteTo.Debug().MinimumLevel.Debug();
        }

        Log.Logger = loggerConfig.CreateLogger();
        Log.Information("PTS logging configured: logs routed to {LogDirectory}", effectiveLogDirectory);
    }

    /// <summary>
    /// Adds a sub-logger that routes logs matching SourceContext or message content to a JSON file.
    /// When requireBothSourceAndMessage is true, BOTH source and message must match (AND logic).
    /// When false (default), EITHER source OR message matching triggers routing (OR logic).
    /// </summary>
    private static void AddCategoryLogger(
        LoggerConfiguration loggerConfig,
        string baseDir,
        string subFolder,
        string fileName,
        LocalTimeJsonFormatter formatter,
        int maxFileSize,
        int retainDays,
        string[] sourceContextContains,
        string[] messageContains,
        bool requireBothSourceAndMessage = false)
    {
        loggerConfig.WriteTo.Logger(subLogger => subLogger
            .Filter.ByIncludingOnly(le =>
                MatchesCategory(le, sourceContextContains, messageContains, requireBothSourceAndMessage))
            .WriteTo.File(
                formatter: formatter,
                path: Path.Combine(baseDir, subFolder, fileName),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: retainDays,
                fileSizeLimitBytes: maxFileSize,
                rollOnFileSizeLimit: true,
                shared: true));
    }

    /// <summary>
    /// Adds a sub-logger that routes logs at or above a specific level to a JSON file.
    /// </summary>
    private static void AddLevelLogger(
        LoggerConfiguration loggerConfig,
        string baseDir,
        string subFolder,
        string fileName,
        LocalTimeJsonFormatter formatter,
        int maxFileSize,
        int retainDays,
        LogEventLevel minLevel)
    {
        loggerConfig.WriteTo.Logger(subLogger => subLogger
            .Filter.ByIncludingOnly(le => le.Level >= minLevel)
            .WriteTo.File(
                formatter: formatter,
                path: Path.Combine(baseDir, subFolder, fileName),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: retainDays,
                fileSizeLimitBytes: maxFileSize,
                rollOnFileSizeLimit: true,
                shared: true));
    }

    /// <summary>
    /// Checks if a log event matches by SourceContext and/or message content.
    /// </summary>
    private static bool MatchesCategory(
        LogEvent logEvent,
        string[] sourceContextContains,
        string[] messageContains,
        bool requireBoth)
    {
        bool sourceMatched = false;
        bool messageMatched = false;

        // Check SourceContext
        if (sourceContextContains.Length > 0 &&
            logEvent.Properties.TryGetValue("SourceContext", out var scProp) &&
            scProp is ScalarValue sv &&
            sv.Value is string sourceContext)
        {
            foreach (var keyword in sourceContextContains)
            {
                if (sourceContext.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                {
                    sourceMatched = true;
                    break;
                }
            }
        }

        // Check message content
        if (messageContains.Length > 0)
        {
            var renderedMessage = logEvent.RenderMessage();
            foreach (var keyword in messageContains)
            {
                if (renderedMessage.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                {
                    messageMatched = true;
                    break;
                }
            }
        }

        if (requireBoth)
            return sourceMatched && messageMatched;

        // OR logic: match if either source or message matches
        return sourceMatched || messageMatched;
    }

    private static void EnsureDirectories(string baseDir)
    {
        if (!Directory.Exists(baseDir))
            Directory.CreateDirectory(baseDir);

        foreach (var subDir in SubDirectories)
        {
            var fullPath = Path.Combine(baseDir, subDir);
            if (!Directory.Exists(fullPath))
            {
                Directory.CreateDirectory(fullPath);
                Log.Information("Created PTS log directory: {Path}", fullPath);
            }
        }
    }

    private static LogEventLevel GetLogEventLevel(string level) => level?.ToLower() switch
    {
        "verbose" => LogEventLevel.Verbose,
        "debug" => LogEventLevel.Debug,
        "information" => LogEventLevel.Information,
        "warning" => LogEventLevel.Warning,
        "error" => LogEventLevel.Error,
        "fatal" => LogEventLevel.Fatal,
        _ => LogEventLevel.Information
    };
}
