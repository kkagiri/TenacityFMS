using System;
using System.IO;
using System.Net;

using FMS.Persistence.DataAccess;

using Serilog;
using Serilog.Debugging;
using Microsoft.AspNetCore.HttpOverrides;

using FMS.WebClient.Extensions; // Added for AddFms* and UseFmsPipeline extensions
//using FMS.Application.Extensions;

namespace FMS.WebClient;

public class Program
{
    public static async Task Main(string[] args)
    {
        // Ensure log directories exist FIRST (wrapped in try/catch for IIS permission safety)
        EnsureLogDirectoriesExist();

        // Enable Serilog self-diagnostics - use C:\Logs path (writable) instead of app directory (read-only under IIS)
        string? selfLogPath = null;
        try
        {
            selfLogPath = Path.Combine("C:\\Logs\\FMS.Webclient", "serilog-selflog.txt");
            SelfLog.Enable(msg =>
            {
                try
                {
                    File.AppendAllText(selfLogPath, $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - {msg}{Environment.NewLine}");
                }
                catch { /* Silently ignore - self-log is best-effort */ }
                Console.WriteLine($"[SERILOG SELFLOG] {msg}");
            });
        }
        catch
        {
            // Self-log is optional - don't crash the app if it fails
            SelfLog.Enable(Console.Error);
        }

        // Bootstrap minimal logger for startup; full config after configuration loaded
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .Enrich.FromLogContext()
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}")
            .WriteTo.File(
                path: "C:\\Logs\\FMS.Webclient\\startup\\webclient-startup.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 5,
                shared: true,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}")
            .CreateLogger();

        Log.Information("=== FMS.WebClient Starting ===");
        if (selfLogPath != null)
            Log.Information("Serilog self-log enabled at: {SelfLogPath}", selfLogPath);

        var builder = WebApplication.CreateBuilder(args);

        // Replace NLog with Serilog by telling the Host to use Serilog
        builder.Host.UseSerilog();

        Console.WriteLine("App started... " + builder.Environment.EnvironmentName);
        builder.Configuration
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);

        builder.Host.UseSerilog((ctx, services, lc) =>
        {
            lc.ReadFrom.Configuration(ctx.Configuration)
              .Enrich.FromLogContext()
              .Enrich.WithProperty("Application", "FMS.WebClient")
              .Enrich.WithProperty("Environment", ctx.HostingEnvironment.EnvironmentName);
        });

        // Refactored: service & db registrations moved to Extensions/FmsServiceCollectionExtensions
        builder.Services
            .AddFmsCore(builder.Configuration, builder.Environment)
            .AddFmsAuthentication(builder.Configuration)
            .AddFmsDatabase(builder.Configuration, builder.Environment);

        // Port 7009 availability check (skip when hosted under IIS where HTTP.sys already owns the port)
        var isIIS = IsRunningUnderIIS();
        if (isIIS)
        {
            Log.Information("Detected IIS/HTTP.sys hosting (in-process) - skipping explicit port 7009 ownership check (managed by IIS).");
        }
        else
        {
            Log.Information("Checking if port 7009 is available for required binding addresses (self-host mode)");
            bool portAvailable = !IsPortInUse(7009);
            if (!portAvailable)
            {
                Log.Warning("Port 7009 is in use on one or more required addresses");
                LogPortUsage(7009);

                var forceKillPorts = Environment.GetEnvironmentVariable("FORCE_KILL_PORTS")?.ToLower() == "true";
                if (forceKillPorts)
                {
                    Log.Warning("FORCE_KILL_PORTS is enabled, attempting to free up port 7009");
                    bool portFreed = TryKillProcessOnPort(7009);
                    if (portFreed)
                    {
                        Thread.Sleep(2000);
                        portAvailable = !IsPortInUse(7009);
                        if (portAvailable)
                        {
                            Log.Information("Successfully freed up port 7009");
                        }
                        else
                        {
                            Log.Error("Failed to free up port 7009 even after killing processes");
                        }
                    }
                }

                if (!portAvailable)
                {
                    Log.Error("Port 7009 is not available. Set FORCE_KILL_PORTS=true to attempt automatic cleanup, or manually stop the process using the port.");
                    throw new InvalidOperationException("Required port 7009 is not available when self-hosting.");
                }
            }
            else
            {
                Log.Information("Port 7009 is available for binding");
            }
        }

        // Don't configure Kestrel endpoints - let the default configuration from appsettings handle binding
        var currentEnvironment = builder.Environment.EnvironmentName;
        if (isIIS)
        {
            Log.Information("Environment: {Environment} (IIS) - IIS site bindings / ASPNETCORE_URLS will govern external access (expected port 7009).", currentEnvironment);
        }
        else
        {
            if (currentEnvironment == "Development")
            {
                Log.Information("Environment: {Environment} (self-host) - Listening on http://localhost:7009 and http://0.0.0.0:7009", currentEnvironment);
            }
            else
            {
                Log.Information("Environment: {Environment} (self-host) - Using Kestrel configuration from appsettings", currentEnvironment);
            }
        }
        var app = builder.Build();

        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
        });

        try
        {
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                var model = dbContext.Model; // Force model compilation
                Log.Information("✓ Model compiled successfully");
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "✗ Model compilation failed: {Message}\n{InnerException}",
                ex.Message, ex.InnerException?.Message);
            throw;
        }

        app.UseFmsPipeline();
        await SeedWidgetTemplatesAsync(app.Services);

        try
        {
            Console.WriteLine("App running...." + app);
            app.Run();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Application startup failed: {Message}", ex.Message);
            Console.WriteLine($"Application startup failed: {ex.Message}");
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }

    //Cursor on changes to code
    private static bool IsPortInUse(int port)
    {
        // Check if port is in use on the specific addresses we want to bind to
        IPAddress[] addressesToCheck = {
            IPAddress.Loopback,
            IPAddress.Parse("0.0.0.0")
        };

        foreach (IPAddress address in addressesToCheck)
        {
            try
            {
                using var socket = new System.Net.Sockets.Socket(
                    System.Net.Sockets.AddressFamily.InterNetwork,
                    System.Net.Sockets.SocketType.Stream,
                    System.Net.Sockets.ProtocolType.Tcp);

                socket.SetSocketOption(System.Net.Sockets.SocketOptionLevel.Socket,
                    System.Net.Sockets.SocketOptionName.ReuseAddress, false);
                socket.Bind(new System.Net.IPEndPoint(address, port));
                // If we get here, this address/port combo is free
            }
            catch (System.Net.Sockets.SocketException ex)
            {
                Log.Debug("Port {Port} is in use on {Address}: {Error}", port, address, ex.Message);
                return true; // Port is in use on at least one address we need
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Unexpected error checking port {Port} on {Address}", port, address);
                return true; // Assume in use on unexpected error
            }
        }

        return false; // Port is available on all addresses we need
    }



    //Cursor on changes to code
    /// <summary>
    /// Logs what processes are using a specific port (Windows-specific)
    /// </summary>
    private static void LogPortUsage(int port)
    {
        try
        {
            var processStartInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "netstat",
                Arguments = $"-ano",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(processStartInfo);
            if (process != null)
            {
                var output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();

                var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                var portLines = lines.Where(line => line.Contains($":{port}")).ToList();

                if (portLines.Any())
                {
                    Log.Warning("Processes using port {Port}:", port);
                    foreach (var line in portLines)
                    {
                        Log.Warning("  {Line}", line.Trim());
                    }
                }
                else
                {
                    Log.Information("No processes found using port {Port} in netstat output", port);
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Failed to check port usage for port {Port}", port);
        }
    }

    //Cursor on changes to code
    /// <summary>
    /// Attempts to kill processes listening on a specific port (use with caution)
    /// </summary>
    private static bool TryKillProcessOnPort(int port)
    {
        try
        {
            var processStartInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "netstat",
                Arguments = $"-ano",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(processStartInfo);
            if (process != null)
            {
                var output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();

                var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                var listeningLines = lines.Where(line =>
                    line.Contains($":{port}") && line.Contains("LISTENING")).ToList();

                foreach (var line in listeningLines)
                {
                    var parts = line.Split(new char[0], StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length >= 5 && int.TryParse(parts[^1], out int pid))
                    {
                        Log.Warning("Attempting to kill process {PID} listening on port {Port}", pid, port);

                        var killProcess = System.Diagnostics.Process.GetProcessById(pid);
                        killProcess.Kill();
                        killProcess.WaitForExit(5000);

                        Log.Information("Successfully killed process {PID}", pid);
                        return true;
                    }
                }
            }
            return false;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to kill process on port {Port}", port);
            return false;
        }
    }

    // Helper to detect if the app is running under IIS / IIS Express (in-process hosting)
    private static bool IsRunningUnderIIS()
    {
        try
        {
            // Environment variables set by the AspNetCoreModule when in-process
            string[] iisIndicators =
            [
                "ASPNETCORE_IIS_HTTPAUTH",
                "ASPNETCORE_IIS_PHYSICAL_PATH",
                "ASPNETCORE_PORTS"
            ];

            if (iisIndicators.Any(v => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(v))))
            {
                return true;
            }

            // Process name heuristic (w3wp for IIS, iisexpress for local dev via IIS Express)
            var procName = System.Diagnostics.Process.GetCurrentProcess().ProcessName;
            if (procName.Contains("w3wp", StringComparison.OrdinalIgnoreCase) || procName.Contains("iisexpress", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }
        catch
        {
            return false; // Fail-safe: assume not IIS if detection fails
        }
    }





    // Removed ConfigureApp (logic now in UseFmsPipeline extension)

    private static async Task SeedWidgetTemplatesAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<FMS.Application.Services.Dashboard.IWidgetTemplateSeeder>();
        try
        {
            await seeder.SeedWidgetTemplatesAsync();
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Error seeding widget templates during startup");
        }
    }

    /// <summary>
    /// Ensures all required log directories exist with proper permissions
    /// </summary>
    private static void EnsureLogDirectoriesExist()
    {
        var logBasePath = "C:\\Logs\\FMS.Webclient";
        var subDirectories = new[] { "app", "errors", "audit", "slow", "startup", "gps", "fuel", "signalr", "issues", "efcore" };

        try
        {
            foreach (var subDir in subDirectories)
            {
                var fullPath = Path.Combine(logBasePath, subDir);
                if (!Directory.Exists(fullPath))
                {
                    Directory.CreateDirectory(fullPath);
                    Console.WriteLine($"✓ Created log directory: {fullPath}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ WARNING: Could not create log directories: {ex.Message}");
            Console.WriteLine($"Logs will be written to application directory instead.");
        }
    }
}