/**
 * File: PTSLoggingConfiguration.cs
 * Purpose: Centralized Serilog logging configuration for FMS.PTS.WindowsService.
 *          Routes logs to domain-specific files based on SourceContext (class name).
 *          All log entries use human-readable text format with SourceContext.
 *          Mirrors the pattern used by FMS.WebClient's FmsLoggingConfiguration.
 * Dependencies: Serilog, Serilog.Sinks.File, Serilog.Sinks.Console
 * Last Modified: 2026-03-02
 *
 * Key Methods:
 * - ConfigureFinalLogging(): Main entry point — configures all log sinks and routing
 *
 * Log Folder Structure (C:\Logs\FMS.PTS\):
 *   app/           - ALL logs (unified, for correlation)
 *   errors/        - Errors & Fatals only
 *   device-raw/    - Raw WebSocket messages from PTS devices
 *   commands/      - Redis commands, pump commands, command execution
 *   transactions/  - Pump transactions, tank measurements, volume changes
 *   connections/   - Device connections, disconnections, health checks
 *   startup/       - Application startup logs
 *
 * To add a new log category:
 *   1. Add a new sub-directory to SubDirectories array
 *   2. Add a new AddCategoryLogger() call in ConfigureFinalLogging()
 *   3. The filter uses SourceContext (class namespace) and/or message content
 */

using System;
using System.IO;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;

namespace FMS.PTS.WindowsService.Infrastructure.Logging;

public static class PTSLoggingConfiguration
{
    private const string LogBasePath = @"C:\Logs\FMS.PTS";
    private const int MaxFileSizeBytes = 50 * 1024 * 1024; // 50MB per file
    private const int DefaultRetainedFileCount = 31;

    // Standard human-readable template with SourceContext (class name) included
    private const string FileTemplate =
        "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}";

    private const string ConsoleTemplate =
        "[{Timestamp:HH:mm:ss} {Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}";

    private static readonly string[] SubDirectories =
        { "app", "errors", "device-raw", "commands", "transactions", "connections", "startup" };

    /// <summary>
    /// Configures Serilog with domain-specific log file routing for PTS Windows Service.
    /// All logs use human-readable text format. All files go into subdirectories (never root).
    /// </summary>
    public static void ConfigureFinalLogging(
        PTSServiceSettings ptsSettings,
        string environment)
    {
        if (ptsSettings?.Logging == null)
        {
            throw new InvalidOperationException("Logging configuration is missing in appsettings");
        }

        var retainedFiles = ptsSettings.Logging.RetainedFileCount > 0
            ? ptsSettings.Logging.RetainedFileCount
            : DefaultRetainedFileCount;

        // Always use C:\Logs\FMS.PTS — all files in subdirectories, never root
        EnsureDirectories(LogBasePath);

        var loggerConfig = new LoggerConfiguration()
            .MinimumLevel.Is(GetLogEventLevel(ptsSettings.Logging.MinimumLevel))
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Error)
            .MinimumLevel.Override("Npgsql", LogEventLevel.Error)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "FMS.PTS")
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

        // ─── GLOBAL NOISE FILTER: Suppress known high-volume messages that add no actionable value ───
        // These fire hundreds of times per hour in Production but indicate normal race conditions,
        // not real problems. Filtered globally so they never reach any sink.
        loggerConfig.Filter.ByExcluding(le =>
            le.MessageTemplate.Text == "Late response received for correlation ID: {CorrelationId}. Response arrived after timeout or command already completed." ||
            le.MessageTemplate.Text == "Duplicate response detected for correlation ID: {CorrelationId}. Ignoring.");

        // ─── CONSOLE: All logs with SourceContext ───
        loggerConfig.WriteTo.Logger(lc => lc
            .Filter.ByExcluding(le =>
                environment == "Development" &&
                le.Level < LogEventLevel.Warning &&
                le.Properties.TryGetValue("SourceContext", out var sourceContext) &&
                sourceContext is ScalarValue sv &&
                sv.Value is string contextString &&
                (contextString.StartsWith("Microsoft.EntityFrameworkCore") ||
                 contextString.StartsWith("Npgsql")))
            .WriteTo.Console(
                outputTemplate: ConsoleTemplate,
                theme: AnsiConsoleTheme.Code));

        // ─── APP LOG: Everything goes here in app/ subdirectory (unified, for correlation) ───
        loggerConfig.WriteTo.File(
            path: Path.Combine(LogBasePath, "app", "app-log-.log"),
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: retainedFiles,
            fileSizeLimitBytes: MaxFileSizeBytes,
            rollOnFileSizeLimit: true,
            shared: true,
            outputTemplate: FileTemplate);

        // ─── ERRORS: Error and Fatal only ───
        AddLevelLogger(loggerConfig, "errors", "error-.log",
            minLevel: LogEventLevel.Error,
            retainDays: 14);

        // ─── RAW DEVICE MESSAGES: WebSocket raw messages from PTS devices ───
        AddCategoryLogger(loggerConfig, "device-raw", "raw-messages-.log",
            sourceContextContains: new[] { "PTSDeviceConnection" },
            messageContains: new[] { "Raw message" },
            requireBothSourceAndMessage: true,
            retainDays: 7);

        // ─── COMMANDS: Redis commands, command execution, pump commands ───
        AddCategoryLogger(loggerConfig, "commands", "commands-.log",
            sourceContextContains: new[] { "Command", "Redis", "PumpService" },
            messageContains: Array.Empty<string>(),
            retainDays: 7);

        // ─── TRANSACTIONS: Pump transactions, tank measurements, volume changes ───
        AddCategoryLogger(loggerConfig, "transactions", "transactions-.log",
            sourceContextContains: new[]
            {
                "Transaction", "TankMeasurement", "TankVolume", "TankStock",
                "UploadStatus", "UploadTankMeasurement", "Reconciliation",
                "PumpTankTransfer"
            },
            messageContains: Array.Empty<string>(),
            retainDays: 14);

        // ─── CONNECTIONS: Device connect/disconnect, health checks ───
        AddCategoryLogger(loggerConfig, "connections", "connections-.log",
            sourceContextContains: new[]
            {
                "Connection", "WebSocketListener", "DeviceActivity",
                "OrphanedTransaction", "StaleConnection"
            },
            messageContains: Array.Empty<string>(),
            retainDays: 7);

        // ─── STARTUP: Application startup logs ───
        AddCategoryLogger(loggerConfig, "startup", "startup-.log",
            sourceContextContains: Array.Empty<string>(),
            messageContains: new[] { "Starting", "Configuring", "configured", "initialization" },
            retainDays: 7);

        if (environment == "Development")
        {
            loggerConfig.WriteTo.Debug().MinimumLevel.Debug();
        }

        Log.Logger = loggerConfig.CreateLogger();
        Log.Information("PTS logging configured: logs routed to {LogDirectory}", LogBasePath);
    }

    /// <summary>
    /// Adds a sub-logger that routes logs matching SourceContext or message content to a text file.
    /// When requireBothSourceAndMessage is true, BOTH source and message must match (AND logic).
    /// When false (default), EITHER source OR message matching triggers routing (OR logic).
    /// </summary>
    private static void AddCategoryLogger(
        LoggerConfiguration loggerConfig,
        string subFolder,
        string fileName,
        string[] sourceContextContains,
        string[] messageContains,
        int retainDays = 7,
        bool requireBothSourceAndMessage = false)
    {
        loggerConfig.WriteTo.Logger(subLogger => subLogger
            .Filter.ByIncludingOnly(le =>
                MatchesCategory(le, sourceContextContains, messageContains, requireBothSourceAndMessage))
            .WriteTo.File(
                path: Path.Combine(LogBasePath, subFolder, fileName),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: retainDays,
                fileSizeLimitBytes: MaxFileSizeBytes,
                rollOnFileSizeLimit: true,
                shared: true,
                outputTemplate: FileTemplate));
    }

    /// <summary>
    /// Adds a sub-logger that routes logs at or above a specific level to a text file.
    /// </summary>
    private static void AddLevelLogger(
        LoggerConfiguration loggerConfig,
        string subFolder,
        string fileName,
        LogEventLevel minLevel,
        int retainDays = 7)
    {
        loggerConfig.WriteTo.Logger(subLogger => subLogger
            .Filter.ByIncludingOnly(le => le.Level >= minLevel)
            .WriteTo.File(
                path: Path.Combine(LogBasePath, subFolder, fileName),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: retainDays,
                fileSizeLimitBytes: MaxFileSizeBytes,
                rollOnFileSizeLimit: true,
                shared: true,
                outputTemplate: FileTemplate));
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
