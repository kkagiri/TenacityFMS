/**
 * File: FmsLoggingConfiguration.cs
 * Purpose: Centralized Serilog logging configuration for FMS.WebClient.
 *          Routes logs to domain-specific files based on SourceContext (class name).
 *          All log entries include the originating class name.
 * Dependencies: Serilog, Serilog.Sinks.File, Serilog.Sinks.Console
 * Last Modified: 2026-03-26
 *
 * Key Methods:
 * - ConfigureLogging(): Main entry point — configures all log sinks and routing
 *
 * Log Folder Structure (C:\Logs\FMS.Webclient\):
 *   app/          - ALL logs (unified, for correlation)
 *   errors/       - Errors & Fatals only
 *   gps/          - GPS/Vehicle tracking (GPSGate, stale positions)
 *   fuel/         - Fuel & Tank operations (refills, stock, transfers)
 *   import/       - Fuel import scanning, parsing, tracker, and import-management diagnostics
 *   signalr/      - SignalR & Hub events (ptsHub, dashboardHub)
 *   issues/       - Issue tracker (OnlineChecker, auto-created issues)
 *   efcore/       - EF Core SQL commands (INSERT, SELECT, UPDATE)
 *   audit/        - HTTP request audit trail (REQ POST/GET with timing)
 *   startup/      - Application startup logs
 *
 * To add a new log category:
 *   1. Add a new sub-directory constant
 *   2. Add a new AddCategoryLogger() call in ConfigureLogging()
 *   3. The filter uses SourceContext (class namespace) and/or message content
 */

using Serilog;
using Serilog.Events;

namespace FMS.WebClient.Extensions;

public static class FmsLoggingConfiguration
{
    private const string LogBasePath = @"C:\Logs\FMS.Webclient";
    private const int MaxFileSizeBytes = 50 * 1024 * 1024; // 50MB per file

    // Standard template with SourceContext (class name) included
    private const string FileTemplate =
        "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}";

    private const string ConsoleTemplate =
        "[{Timestamp:HH:mm:ss} {Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}";

    /// <summary>
    /// Configures Serilog with domain-specific log file routing.
    /// Call from builder.Host.UseSerilog() in Program.cs.
    /// </summary>
    public static void ConfigureLogging(
        HostBuilderContext ctx,
        IServiceProvider services,
        LoggerConfiguration lc)
    {
        var env = ctx.HostingEnvironment.EnvironmentName;

        // Ensure all log directories exist
        EnsureDirectories();

        // Base configuration: minimum levels and enrichment
        lc.MinimumLevel.Information()
          .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
          .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
          .MinimumLevel.Override("Npgsql", LogEventLevel.Warning)
          .MinimumLevel.Override("System", LogEventLevel.Warning)
          .Enrich.FromLogContext()
          .Enrich.WithProperty("Application", "FMS.WebClient")
          .Enrich.WithProperty("Environment", env);

        // ─── CONSOLE: All logs with SourceContext ───
        lc.WriteTo.Console(outputTemplate: ConsoleTemplate);

        // ─── APP LOG: Everything goes here (unified, for correlation) ───
        lc.WriteTo.File(
            path: Path.Combine(LogBasePath, "app", "app-log-.log"),
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7,
            fileSizeLimitBytes: MaxFileSizeBytes,
            rollOnFileSizeLimit: true,
            shared: true,
            outputTemplate: FileTemplate);

        // ─── ERRORS: Error and Fatal only ───
        AddLevelLogger(lc, "errors", "error-.log",
            minLevel: LogEventLevel.Error,
            retainDays: 14);

        // ─── GPS: Vehicle tracking, GPSGate, stale positions ───
        AddCategoryLogger(lc, "gps", "gps-.log",
            sourceContextContains: new[] { "Vehicle", "GPS", "GPSGate", "VehicleTracking" },
            messageContains: new[] { "GPS", "GPSGate", "stale", "Vehicle" });

        // ─── FUEL: Fuel refills, tank stock, tank management, transfers ───
        AddCategoryLogger(lc, "fuel", "fuel-.log",
            sourceContextContains: new[] { "Fuel", "Tank", "Reconciliation", "Delivery" },
            messageContains: new[] { "fuel", "Fuel", "tank", "Tank", "refill", "Refill", "delivery", "Delivery" });

        // ─── SIGNALR: Hub connections, real-time events ───
        AddCategoryLogger(lc, "signalr", "signalr-.log",
            sourceContextContains: new[] { "SignalR", "Hub", "Notification" },
            messageContains: new[] { "SignalR", "ptsHub", "dashboardHub", "PTS Client", "connected", "disconnected" });

        // ─── ISSUES: Issue tracker, OnlineChecker, auto-created issues ───
        AddCategoryLogger(lc, "issues", "issues-.log",
            sourceContextContains: new[] { "Issue", "IssueTracker", "IssueTemplateWorkflow", "GPSGate" },
            messageContains: new[] { "issue", "Issue", "OnlineChecker", "checker", "Fuel+Offline Monitor", "Auto-created issue" });

        // ─── EF CORE: Database SQL commands ───
        AddCategoryLogger(lc, "efcore", "efcore-.log",
            sourceContextContains: new[] { "EntityFrameworkCore", "Npgsql" },
            messageContains: new[] { "DbCommand", "INSERT INTO", "SELECT ", "UPDATE ", "DELETE FROM" },
            retainDays: 3);

        // ─── AUDIT: HTTP request/response logging ───
        AddCategoryLogger(lc, "audit", "requests-.log",
            sourceContextContains: Array.Empty<string>(),
            messageContains: new[] { "REQ " });

        Log.Information("FMS.WebClient logging configured: logs routed to {LogBasePath}", LogBasePath);
    }

    /// <summary>
    /// Adds a sub-logger that routes logs matching SourceContext or message content to a specific file.
    /// A log entry matches if its SourceContext contains ANY of the sourceContextContains values,
    /// OR if its rendered message contains ANY of the messageContains values.
    /// </summary>
    private static void AddCategoryLogger(
        LoggerConfiguration lc,
        string subFolder,
        string fileName,
        string[] sourceContextContains,
        string[] messageContains,
        int retainDays = 7)
    {
        lc.WriteTo.Logger(subLogger => subLogger
            .Filter.ByIncludingOnly(logEvent => MatchesCategory(logEvent, sourceContextContains, messageContains))
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
    /// Adds a sub-logger that routes logs at or above a specific level to a file.
    /// </summary>
    private static void AddLevelLogger(
        LoggerConfiguration lc,
        string subFolder,
        string fileName,
        LogEventLevel minLevel,
        int retainDays = 7)
    {
        lc.WriteTo.Logger(subLogger => subLogger
            .Filter.ByIncludingOnly(logEvent => logEvent.Level >= minLevel)
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
    /// Returns true if the log event's SourceContext contains any of the specified strings,
    /// or if the rendered message contains any of the specified strings.
    /// </summary>
    private static bool MatchesCategory(
        LogEvent logEvent,
        string[] sourceContextContains,
        string[] messageContains)
    {
        // Check SourceContext (the class/namespace that wrote the log)
        if (sourceContextContains.Length > 0 &&
            logEvent.Properties.TryGetValue("SourceContext", out var scProp) &&
            scProp is ScalarValue sv &&
            sv.Value is string sourceContext)
        {
            foreach (var keyword in sourceContextContains)
            {
                if (sourceContext.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
        }

        // Check message content
        if (messageContains.Length > 0)
        {
            var renderedMessage = logEvent.RenderMessage();
            foreach (var keyword in messageContains)
            {
                if (renderedMessage.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Ensures all log sub-directories exist.
    /// </summary>
    private static void EnsureDirectories()
    {
        var subDirs = new[]
        {
            "app", "errors", "startup", "gps", "fuel", "import",
            "signalr", "issues", "efcore", "audit"
        };

        foreach (var subDir in subDirs)
        {
            var fullPath = Path.Combine(LogBasePath, subDir);
            if (!Directory.Exists(fullPath))
            {
                Directory.CreateDirectory(fullPath);
            }
        }
    }
}
