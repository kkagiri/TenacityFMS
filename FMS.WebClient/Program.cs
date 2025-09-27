using System;
using System.Collections.Concurrent;
using System.Net;
using System.Reflection;
using System.Security.Cryptography.Xml;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoMapper;
using FMS.Application;
using FMS.Application.Command.DatabaseCommand.Common;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.Redis;
using FMS.Application.Communication.SignalR;
using FMS.Application.Communication.Tracker;
using FMS.Application.Features.FMS.UserManagement;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Handlers;
using FMS.Application.Handlers.Interface;
using FMS.Application.Infrastructure.Communication.SignalR;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Infrastructure.Services.Authentication;
using FMS.Application.MappingProfile;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using FMS.Application.Queries.GPSGATEServer.GetconsumptionReport;
using FMS.Application.Services;
// using FMS.Application.Services.AutomatedReconciliation;
using FMS.Application.Features.TankManagement.Services;
using FMS.Application.Services.TankStock;
using FMS.Application.Util;
using FMS.Application.Validation.PTSValidators;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using FMS.Persistence.DataAccess.Nafta;
using FMS.PTS;
using FMS.PTS.WindowsService.Services.Pump;
using FMS.WebClient.Controllers;
using FMS.WebClient.Services;
using FMS.WebClient.Signal;
using FMS.WebClient.Util;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;
using StackExchange.Redis;
using Role = FMS.Domain.Entities.Role;
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
// using FMS.Application.Features.AutomatedReconciliation.Services;
using FMS.Application.Features.AutomatedReconciliation.Services;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using FMS.Application.Features.Notification.Services.Businessfunction;
using FMS.Application.Features.Notification.Services.Integration;
using FMS.Application.Features.Notification.Services.RecipientResolver;
using FMS.Application.Features.PTSService.Services;
using FMS.Application.Services.AutomatedReconciliation;
using FMS.Application.Services.Configuration;
using FMS.Application.Services.FMS.BackgroundServices.FMS;
using FMS.Application.Services.TankStock;
using FMS.BackgroundServices;
using FMS.BackgroundServices.ActiveAlarmProcessing;
using FMS.BackgroundServices.FMS;
//using FMS.Application.Extensions;

namespace FMS.WebClient;

public class Program {
    public static async Task Main (string[] args) {
        // Configure a bootstrap Serilog logger for early logging (e.g. during startup)
        Log.Logger = new LoggerConfiguration ()
            .MinimumLevel.Debug ()
            .Enrich.FromLogContext ()
            .WriteTo.Console (outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.File (
                path: "C:\\Logs\\FMS.Webclient\\webclient-startup.log",
                rollingInterval : RollingInterval.Day,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
            .CreateLogger ();

        var builder = WebApplication.CreateBuilder (args);

        // Replace NLog with Serilog by telling the Host to use Serilog
        builder.Host.UseSerilog ();

        Console.WriteLine ("App started... " + builder.Environment.EnvironmentName);
        builder.Configuration.AddJsonFile ("appsettings.json", optional : false, reloadOnChange : true);

        ConfigureServices (builder.Services, builder.Configuration);
        ConfigureDatabase (builder.Services, builder.Configuration, builder.Environment);

        //Cursor on changes to code
        // Simple port 7009 availability check - force use of port 7009 only
        Log.Information ("Checking if port 7009 is available for required binding addresses");
        bool portAvailable = !IsPortInUse (7009);

        if (!portAvailable) {
            Log.Warning ("Port 7009 is in use on one or more required addresses");
            LogPortUsage (7009);

            // Option to forcefully free up the port
            var forceKillPorts = Environment.GetEnvironmentVariable ("FORCE_KILL_PORTS")?.ToLower () == "true";
            if (forceKillPorts) {
                Log.Warning ("FORCE_KILL_PORTS is enabled, attempting to free up port 7009");
                bool portFreed = TryKillProcessOnPort (7009);
                if (portFreed) {
                    Thread.Sleep (2000); // Give time for port to be released
                    portAvailable = !IsPortInUse (7009);
                    if (portAvailable) {
                        Log.Information ("Successfully freed up port 7009");
                    } else {
                        Log.Error ("Failed to free up port 7009 even after killing processes");
                    }
                }
            }

            if (!portAvailable) {
                Log.Error ("Port 7009 is not available. Set environment variable FORCE_KILL_PORTS=true to attempt automatic cleanup, or manually stop the process using the port.");
                throw new InvalidOperationException ("Required port 7009 is not available. Application requires this specific port.");
            }
        } else {
            Log.Information ("Port 7009 is available for binding");
        }

        // Don't configure Kestrel endpoints - let the default configuration from appsettings handle binding
        Log.Information ("Using default URL configuration - should bind to http://10.0.11.90:7009 and http://localhost:7009"); //Cursor
        var app = builder.Build ();
        await ConfigureApp (app, builder.Environment);

        try {
            Console.WriteLine ("App running...." + app);
            app.Run ();
        } catch (Exception ex) {
            Log.Fatal (ex, "Application startup failed: {Message}", ex.Message);
            Console.WriteLine ($"Application startup failed: {ex.Message}");
        } finally {
            Log.CloseAndFlush ();
        }
    }

    //Cursor on changes to code
    private static bool IsPortInUse (int port) {
        // Check if port is in use on the specific addresses we want to bind to
        var addressesToCheck = new [] {
            IPAddress.Loopback, // 127.0.0.1 (localhost)
            IPAddress.Parse ("0.0.0.0") // your specific IP - updated to match actual machine IP //Cursor
        };

        foreach (var address in addressesToCheck) {
            try {
                using var socket = new System.Net.Sockets.Socket (
                    System.Net.Sockets.AddressFamily.InterNetwork,
                    System.Net.Sockets.SocketType.Stream,
                    System.Net.Sockets.ProtocolType.Tcp);

                socket.SetSocketOption (System.Net.Sockets.SocketOptionLevel.Socket,
                    System.Net.Sockets.SocketOptionName.ReuseAddress, false);
                socket.Bind (new System.Net.IPEndPoint (address, port));
                // If we get here, this address/port combo is free
            } catch (System.Net.Sockets.SocketException ex) {
                Log.Debug ("Port {Port} is in use on {Address}: {Error}", port, address, ex.Message);
                return true; // Port is in use on at least one address we need
            } catch (Exception ex) {
                Log.Warning (ex, "Unexpected error checking port {Port} on {Address}", port, address);
                return true; // Assume in use on unexpected error
            }
        }

        return false; // Port is available on all addresses we need
    }

    // Helper method to find an available port in a range
    private static int FindAvailablePort (int startPort, int endPort) {
        for (int port = startPort; port <= endPort; port++) {
            if (!IsPortInUse (port)) {
                return port;
            }
        }
        throw new InvalidOperationException ($"No available ports found in range {startPort}-{endPort}");
    }

    //Cursor on changes to code
    /// <summary>
    /// Logs what processes are using a specific port (Windows-specific)
    /// </summary>
    private static void LogPortUsage (int port) {
        try {
            var processStartInfo = new System.Diagnostics.ProcessStartInfo {
                FileName = "netstat",
                Arguments = $"-ano",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start (processStartInfo);
            if (process != null) {
                var output = process.StandardOutput.ReadToEnd ();
                process.WaitForExit ();

                var lines = output.Split ('\n', StringSplitOptions.RemoveEmptyEntries);
                var portLines = lines.Where (line => line.Contains ($":{port}")).ToList ();

                if (portLines.Any ()) {
                    Log.Warning ("Processes using port {Port}:", port);
                    foreach (var line in portLines) {
                        Log.Warning ("  {Line}", line.Trim ());
                    }
                } else {
                    Log.Information ("No processes found using port {Port} in netstat output", port);
                }
            }
        } catch (Exception ex) {
            Log.Warning (ex, "Failed to check port usage for port {Port}", port);
        }
    }

    //Cursor on changes to code
    /// <summary>
    /// Attempts to kill processes listening on a specific port (use with caution)
    /// </summary>
    private static bool TryKillProcessOnPort (int port) {
        try {
            var processStartInfo = new System.Diagnostics.ProcessStartInfo {
                FileName = "netstat",
                Arguments = $"-ano",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start (processStartInfo);
            if (process != null) {
                var output = process.StandardOutput.ReadToEnd ();
                process.WaitForExit ();

                var lines = output.Split ('\n', StringSplitOptions.RemoveEmptyEntries);
                var listeningLines = lines.Where (line =>
                    line.Contains ($":{port}") && line.Contains ("LISTENING")).ToList ();

                foreach (var line in listeningLines) {
                    var parts = line.Split (new char[0], StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length >= 5 && int.TryParse (parts[ ^ 1], out int pid)) {
                        Log.Warning ("Attempting to kill process {PID} listening on port {Port}", pid, port);

                        var killProcess = System.Diagnostics.Process.GetProcessById (pid);
                        killProcess.Kill ();
                        killProcess.WaitForExit (5000);

                        Log.Information ("Successfully killed process {PID}", pid);
                        return true;
                    }
                }
            }
            return false;
        } catch (Exception ex) {
            Log.Error (ex, "Failed to kill process on port {Port}", port);
            return false;
        }
    }

    static void ConfigureServices (IServiceCollection services, IConfiguration configuration) {
        try {
            services.AddControllers ()
                .AddJsonOptions (options => {
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.MaxDepth = 0;
                    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                });

            RegisterSignalR (services);
            RegisterMediatR (services);
            RegisterAutoMapper (services);
            RegisterHttpContextAccessor (services);
            ConfigureCors (services);
            RegisterHealthChecks (services);
            RegisterRedisCommandService (services);
            RegisterCustomServices (services);
            ConfigureAuthentication (services, configuration);
            ConfigureAuthorization (services);
            RegisterDistributedCache (services);

            // Register seed data services
            // services.AddSeedDataServices();

            //InfrastructureServicesConfiguration.Configure (services, configuration);
        } catch (Exception ex) {
            Console.WriteLine (ex);
            throw;
        }
    }

    static void RegisterSignalR (IServiceCollection services) {
        try {
            var redisConnectionString = Environment.GetEnvironmentVariable ("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);
            if (!string.IsNullOrEmpty (redisConnectionString)) {
                Console.WriteLine ($"Redis connection string: {redisConnectionString}");
                // Temporarily disable Redis for SignalR until we resolve package dependencies
                // services.AddSignalR ()
                //     .AddStackExchangeRedis (redisConnectionString, options => {
                //         options.Configuration.ChannelPrefix = "FMS";
                //     });
                Console.WriteLine ("Using in-memory SignalR instead of Redis due to dependency issues");
                services.AddSignalR (hubOptions => {
                    hubOptions.EnableDetailedErrors = true;
                });
            } else {
                Console.WriteLine ("Redis connection string is missing, using in-memory for SignalR");
                services.AddSignalR (hubOptions => {
                    hubOptions.EnableDetailedErrors = true;
                });
            }
        } catch (Exception ex) {
            Console.WriteLine (ex);
            throw;
        }
    }

    static void RegisterHealthChecks (IServiceCollection services) {
        try {
            var redisConnectionString = Environment.GetEnvironmentVariable ("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);
            var healthChecks = services.AddHealthChecks ()
                .AddCheck ("self", () => HealthCheckResult.Healthy ());

            // if (!string.IsNullOrEmpty (redisConnectionString)) {
            //     // Only add Redis health check if we have a connection string
            //     healthChecks.AddRedis (redisConnectionString, tags : new [] { "redis" });
            // }
        } catch (Exception ex) {
            Console.WriteLine (ex);
            throw;
        }
    }

    static void RegisterMediatR (IServiceCollection services) {
        services.AddMediatR (cfg => {
            cfg.RegisterServicesFromAssembly (typeof (GetVehicleQuery).Assembly);
            // Use just one assembly to avoid errors with missing types
            // cfg.RegisterServicesFromAssembly (typeof (GetConsumptionReportByDateRangeQuery).Assembly);
            // cfg.RegisterServicesFromAssembly (typeof (CreateUserCommand).Assembly);
            // cfg.RegisterServicesFromAssembly (typeof (CreateTagCommand).Assembly);
        });
    }

    static void RegisterHttpContextAccessor (IServiceCollection services) {
        services.AddHttpContextAccessor ();
    }

    static void RegisterRedisCommandService (IServiceCollection services) {
        try {
            var redisConnectionString = Environment.GetEnvironmentVariable (
                "ConnectionStrings__RedisConnection",
                EnvironmentVariableTarget.Machine
            );

            if (!string.IsNullOrEmpty (redisConnectionString)) {
                services.AddSingleton<IConnectionMultiplexer> (sp =>
                    ConnectionMultiplexer.Connect (redisConnectionString)
                );
                services.AddSingleton<StackExchange.Redis.IDatabase> (sp =>
                    sp.GetRequiredService<IConnectionMultiplexer> ().GetDatabase ()
                );
                services.AddSingleton<IRedisPublisher, RedisPublisher> ();
                services.AddSingleton<IRedisSubscriber, RedisSubscriber> ();
                services.AddSingleton<RedisCommandService> ();
            } else {
                Log.Warning ("Redis connection string is missing, skipping Redis services registration");
                // Register null implementations or fallbacks if needed
            }
        } catch (Exception ex) {
            Log.Error (ex, "Error configuring Redis services: {Message}", ex.Message);
            // Register null implementations or fallbacks if needed
        }

        // Register DeviceStatusHelper for accessing device status from Redis
        services.AddSingleton<DeviceStatusHelper> ();
    }

    static void RegisterAutoMapper (IServiceCollection services) {
        services.AddAutoMapper (typeof (MainMappingProfile).Assembly);
    }

    static void RegisterCustomServices (IServiceCollection services) {

        //automatic Reconsiclation

        services.AddScoped<PolicyEvaluationEngine> ();
        services.AddScoped<DiscrepancyDetectionService> ();
        services.AddScoped<ReconciliationOrchestrationService> ();
        services.AddScoped<AutomatedReconciliationService> ();
        services.AddHostedService<AutomatedReconciliationBackgroundService> ();
        services.AddScoped<DailyReconciliationPolicyService> ();
        // // Register Redis-based policy trigger service //Cursor
        services.AddScoped<IPolicyTriggerService, PolicyTriggerService> (); //Cursor

        // // Register background service for Redis policy trigger subscription //Cursor
        services.AddHostedService<PolicyTriggerBackgroundService> ();
        services.AddScoped<ISystemConfigurationService, SystemConfigurationService> ();
        services.AddScoped<TankStockFutureRecordsService> ();
        services.AddScoped<OpeningStockValidationService> ();
        services.AddScoped<OpeningStockValidationService> ();
        services.AddTransient<RoleManager<Role>> ();

        services.AddMemoryCache ();
        services.AddSingleton<PtsStatusService> ();
        services.AddScoped<UserManager<User>> ();
        services.AddScoped<RoleManager<Role>> ();
        services.AddScoped<IDeviceCommunicationService, DeviceCommunicationService> ();
        services.AddScoped<IDeviceValidator, DeviceValidator> ();
        services.AddScoped<IPumpService, PumpService> ();
        services.AddScoped<IAuthorizationStateTracker, AuthorizationStateTracker> ();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorization> ();
        services.AddScoped<IPendingCommandRepository, PendingCommandsRepository> ();
        services.AddScoped<IAuthorizationStateTracker, AuthorizationStateTracker> ();
        services.AddScoped<ITankVolumeAdjustmentService, TankVolumeAdjustmentService> ();
        services.AddScoped<IAuthorizationHandler, PermissionHandler> ();
        services.AddTransient (typeof (IPipelineBehavior<,>), typeof (TransactionMiddleware<,>));
        services.AddScoped<IEmailService, EmailService> ();

        // Register GPS Services
        services.AddHttpClient<FMS.Application.Features.Vehicle.Services.IGPSService, FMS.Application.Features.Vehicle.Services.GPSGateService> ();
        services.AddScoped<FMS.Application.Features.Vehicle.Services.IGPSService, FMS.Application.Features.Vehicle.Services.GPSGateService> ();

        // Register the pump transaction integration service
        services.AddScoped<PumpTransactionIntegrationService> ();
        // Register missing services that are causing dependency injection errors
        services.AddScoped<ITransactionMonitoringService, TransactionMonitoringService> (); //Cursor
        services.AddScoped<TankVolumeHistoryIntegrationService> (); //Cursor
        services.AddScoped<TankStockFutureRecordsService> (); //Cursor
        services.AddScoped<ITransactionCompletionService, TransactionCompletionService> (); //Cursor        // Register notification services
        services.AddScoped<INotificationRecipientResolver, NotificationRecipientResolver> ();
        services.AddScoped<IActiveAlarmService, ActiveAlarmService> ();
        services.AddScoped<AlarmHandlerActiveAlarmIntegration> ();
        services.AddScoped<IBusinessFunctionNotificationService, BusinessFunctionNotificationService> ();

        // Register background service
        services.AddHostedService<ActiveAlarmProcessingService> ();
        services.AddScoped<INotificationService, NotificationService> ();
        services.AddScoped<INotificationCategoryService, NotificationCategoryService> ();
        services.AddScoped<FMS.Application.Features.Notification.Services.Groups.INotificationGroupService, FMS.Application.Features.Notification.Services.Groups.NotificationGroupService> ();
        services.AddScoped<IAlarmHandlerService, AlarmHandlerService> ();
        services.AddScoped<IEmailService, EmailService> ();
        services.AddScoped<ISmsService, SmsService> ();
        services.AddSingleton<ICategoryMetadataProvider, InMemoryCategoryMetadataProvider> ();

        // Dynamic notification channels and registry
        services.AddScoped<INotificationChannelRegistry, NotificationChannelRegistry> ();
        services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.SystemNotificationChannel> ();
        services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.EmailNotificationChannel> ();
        services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.SmsNotificationChannel> ();
        services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.SlackNotificationChannel> ();
        services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.PushNotificationChannel> ();

        services.AddSingleton<ConnectionMonitor> ();

        // Register SignalR notification service
        services.AddScoped<ISignalRNotificationService, SignalRNotificationService> ();

        // Register tank management services
        services.AddScoped<InventoryCostingService> ();
        services.AddScoped<ITankVolumeHistoryDeletionService, TankVolumeHistoryDeletionService> ();

        //Cursor: Register system user service
        services.AddScoped<ISystemUserService, SystemUserService> ();

        // Register background service
        services.AddHostedService<NotificationBackgroundService> ();
        services.AddHostedService<TankMonitoringService> ();

        //Cursor: Register system user initialization service
        services.AddHostedService<SystemUserInitializationService> ();
        //Cursor: Register AutoTransactionCompletionService and DirectHttpTransactionService
        services.AddScoped<IAutoTransactionCompletionService, AutoTransactionCompletionService> (); //Cursor
        services.AddScoped<IDirectHttpTransactionService, DirectHttpTransactionService> (); //Cursor

        // Register PTSConnectionManager that was missing //Cursor
        services.AddSingleton<IPTSConnectionManager, PTSConnectionManager> (); //Cursor
        services.AddSingleton<DeviceConnectionTracker> (); //Cursor

        services.AddScoped<ICommandExecutor, CommandExecutor> ();
        // services.AddScoped<ReportStorageWebExtension, ReportStorageService>();
        services.AddHttpClient<DeviceHttpCommandPusher> ().SetHandlerLifetime (TimeSpan.FromMinutes (5));
        // Register the interface for DeviceHttpCommandPusher //Cursor
        services.AddScoped<IDeviceHttpCommandPusher, DeviceHttpCommandPusher> (); //Cursor

        // Register the missing AutomatedFuelingConfigurationService
        services.AddScoped<IAutomatedFuelingConfigurationService, AutomatedFuelingConfigurationService> ();

        // Register Dashboard Metrics Service
        services.AddScoped<FMS.Application.Services.Dashboard.IDashboardMetricsService, FMS.Application.Services.Dashboard.DashboardMetricsService> ();

        // Register Widget Data Service (original service - user/widget ID based)
        services.AddScoped<FMS.Application.Services.Dashboard.IWidgetDataService, FMS.Application.Services.Dashboard.WidgetDataService> ();

        // Register Widget Factory Service - Enhanced Widget Processing
        services.AddScoped<FMS.Application.Services.Dashboard.IWidgetFactoryService, FMS.Application.Services.Dashboard.WidgetFactoryService> ();

        // Register Widget Template Seeder
        services.AddScoped<FMS.Application.Services.Dashboard.IWidgetTemplateSeeder, FMS.Application.Services.Dashboard.WidgetTemplateSeeder> ();

        // Register Key Statistics Service

        // Register Phase 1 Enhanced Data Fetch Engine Services
        services.AddScoped<FMS.Application.Services.Dashboard.IDataSourceManager, FMS.Application.Services.Dashboard.DataSourceManager> ();
        services.AddHostedService<FMS.BackgroundServices.Dashboard.LiveDataBroadcastService> ();

        // Register Widget Factory System - Enhanced Widget Processing
        services.AddScoped<FMS.Application.Services.Dashboard.WidgetFactories.ChartWidgetFactory> ();
        services.AddScoped<FMS.Application.Services.Dashboard.WidgetFactories.StatCardWidgetFactory> ();
        services.AddScoped<FMS.Application.Services.Dashboard.WidgetFactories.TableWidgetFactory> ();
        services.AddScoped<FMS.Application.Services.Dashboard.WidgetFactories.WidgetFactoryCoordinator> ();

        services.Scan (scan =>
            scan.FromAssemblyOf<UploadStatusHandler> ()
            .AddClasses (classes => classes.AssignableTo<IPacketHandler> ())
            .AsSelf ()
            .AsImplementedInterfaces ()
            .WithScopedLifetime ()
        );

        // Add this in ConfigureServices method
        services.AddScoped<IServiceControlService, ServiceControlService> ();
    }

    static void RegisterDistributedCache (IServiceCollection services) {
        try {
            var redisConnectionString = Environment.GetEnvironmentVariable ("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);

            if (!string.IsNullOrEmpty (redisConnectionString)) {
                // Configure Redis cache if connection string exists
                services.AddStackExchangeRedisCache (options => {
                    options.Configuration = redisConnectionString;
                    options.InstanceName = "FMS:";
                });
                Log.Information ("Using Redis for distributed cache");
            } else {
                // Fallback to memory cache if Redis is not available
                services.AddDistributedMemoryCache ();
                Log.Warning ("Redis connection string is missing, using in-memory distributed cache instead");
            }
        } catch (Exception ex) {
            Log.Error (ex, "Error configuring distributed cache: {Message}", ex.Message);
            // Fallback to memory cache if there's an error
            services.AddDistributedMemoryCache ();
            Log.Warning ("Falling back to in-memory distributed cache due to error");
        }
    }

    static void ConfigureAuthentication (IServiceCollection services, IConfiguration configuration) {
        var jwtSecretKey =
            Environment.GetEnvironmentVariable (
                "JwtSettings__SecretKey",
                EnvironmentVariableTarget.Machine
            ) ??
            throw new InvalidOperationException (
                "JwtSettings__SecretKey is missing from environment variables."
            );
        var jwtIssuer =
            Environment.GetEnvironmentVariable (
                "JwtSettings__Issuer",
                EnvironmentVariableTarget.Machine
            ) ??
            throw new InvalidOperationException (
                "JwtSettings__Issuer is missing from environment variables."
            );
        var jwtAudience =
            Environment.GetEnvironmentVariable (
                "JwtSettings__Audience",
                EnvironmentVariableTarget.Machine
            ) ??
            throw new InvalidOperationException (
                "JwtSettings__Audience is missing from environment variables."
            );
        var jwtExpireDays =
            Environment.GetEnvironmentVariable (
                "JwtSettings__ExpireDays",
                EnvironmentVariableTarget.Machine
            ) ?? "7"; // Default to 7 days if not specified

        // Configure JwtSettings
        services.Configure<JwtSettings> (options => {
            options.SecretKey = jwtSecretKey;
            options.Issuer = jwtIssuer;
            options.Audience = jwtAudience;
            options.ExpireDays = int.Parse (jwtExpireDays);
        });

        services
            .AddAuthentication (options => {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer (options => {
                options.TokenValidationParameters = new TokenValidationParameters {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey (
                Encoding.UTF8.GetBytes (jwtSecretKey)
                ),
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                };

                options.Events = new JwtBearerEvents {
                    OnAuthenticationFailed = context => {
                            context.NoResult ();
                            context.Response.StatusCode = 401;
                            return Task.CompletedTask;
                        },
                        OnChallenge = async context => {
                            context.Response.Headers.Add ("WWW-Authenticate", "Bearer");
                            context.Response.StatusCode = 401;
                            await context.Response.WriteAsync ("Unauthorized");
                            context.HandleResponse ();
                        },
                        // Add SignalR specific token handling
                        OnMessageReceived = context => {
                            // Check if this is a SignalR request
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;

                            // If the request is for our SignalR hubs and we have an access token
                            if (!string.IsNullOrEmpty (accessToken) &&
                                (path.StartsWithSegments ("/dashboardHub") ||
                                    path.StartsWithSegments ("/ptsHub") ||
                                    path.StartsWithSegments ("/frontendHub"))) {
                                // Read the token out of the query string
                                context.Token = accessToken;
                            }
                            return Task.CompletedTask;
                        }
                };
            });
        // Temporarily commenting out the JWT Generator registration
        // services.AddScoped<IJwtGenerator, JwtGenerator> ();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator> ();
    }

    static void ConfigureAuthorization (IServiceCollection services) {
        try {
            services.AddAuthorization (options => {
                // Set default policy to require authentication with JWT Bearer
                options.DefaultPolicy = new AuthorizationPolicyBuilder (JwtBearerDefaults.AuthenticationScheme)
                    .RequireAuthenticatedUser ()
                    .Build ();

                // Configure policy-based authorization with requirements
                options.AddPolicy (
                    "RequireAdminRole",
                    policy => policy.RequireRole ("Admin")
                    .AddAuthenticationSchemes (JwtBearerDefaults.AuthenticationScheme)
                );
            });
        } catch (Exception ex) {
            using (var serviceProvider = services.BuildServiceProvider ()) {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>> ();
                logger.LogError (ex, "Error configuring authorization: {Message}", ex.Message);
            }
            throw;
        }
    }

    static void ConfigureCors (IServiceCollection services) {
        try {
            services.AddCors (options => {
                options.AddPolicy (
                    "DevelopmentCorsPolicy",
                    builder => {

                        builder
                            .WithOrigins (

                                "http://localhost:3000",
                                "http://localhost:3001",
                                "http://127.0.0.1:3000",
                                "http://10.0.2.2:7009", //Cursor - added for Android emulator
                                "http://10.0.11.133:7009",
                                "https://10.0.11.133:7009",
                                "https://10.0.11.135",
                                "http://10.0.11.133:3000",
                                "http://10.0.11.90:3000"

                            )
                            .AllowAnyHeader ()
                            .AllowAnyMethod ()
                            .AllowCredentials (); // Now we can use credentials
                    }
                );

                options.AddPolicy (
                    "ProductionCorsPolicy",
                    builder => {
                        builder
                            .WithOrigins (
                                "http://197.254.33.227",
                                "http://10.0.11.135:3000",
                                "https://10.0.11.135:3000",
                                "https://10.0.11.135",
                                "http://10.0.10.153",
                                "https://10.0.10.153",
                                "http://10.0.10.153:3000",
                                "https://10.0.10.153:3000",
                                "http://10.0.10.113",
                                "https://10.0.10.113",
                                "http://10.0.2.2:7009", //Cursor - added for Android emulator
                                "http://10.0.10.113:3000",
                                "https://10.0.10.113:3000",
                                "http://10.0.11.90", //Cursor - updated IP
                                "https://10.0.11.90", //Cursor - updated IP
                                "http://10.0.11.90:3000", //Cursor - updated IP
                                "https://10.0.11.90:3000" //Cursor - updated IP
                            )
                            .AllowAnyHeader ()
                            .AllowAnyMethod ()
                            .AllowCredentials ();
                    }
                );
            });
        } catch (Exception ex) {
            using (var serviceProvider = services.BuildServiceProvider ()) {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>> ();
                logger.LogError (ex, "Error configuring CORS: {Message}", ex.Message);
            }
            throw;
        }
    }

    static void ConfigureDatabase (IServiceCollection services, IConfiguration configuration, IWebHostEnvironment env) {
        try {
            var fmsConnectionString =
                Environment.GetEnvironmentVariable (
                    "ConnectionStrings__FMSConnection",
                    EnvironmentVariableTarget.Machine
                ) ??
                throw new InvalidOperationException (
                    "FMS Connection string is missing from environment variables."
                );

            // Add MySQL specific parameters to handle DateTime issues
            if (!fmsConnectionString.Contains ("AllowZeroDateTime") && !fmsConnectionString.Contains ("ConvertZeroDateTime")) {
                fmsConnectionString += fmsConnectionString.Contains ("?") ? "&" : ";";
                fmsConnectionString += "AllowZeroDateTime=True;ConvertZeroDateTime=True";
            }
            var naftaConnectionString = Environment.GetEnvironmentVariable (
                "ConnectionStrings__ATGConnection",
                EnvironmentVariableTarget.Machine
            ); //Removed the default value as it is not needed
            services
                .AddIdentity<User, Role> ()
                .AddEntityFrameworkStores<GpsdataContext> ()
                .AddDefaultTokenProviders ();

            services.AddDbContext<GpsdataContext> (
                options => {
                    options
                        .UseMySql (
                            fmsConnectionString,
                            new MySqlServerVersion (new Version (5, 5, 61)),
                            mySqlOptions => {
                                mySqlOptions.EnableRetryOnFailure (
                                    maxRetryCount: 5,
                                    maxRetryDelay: TimeSpan.FromSeconds (30),
                                    errorNumbersToAdd: null);
                                mySqlOptions.CommandTimeout (60); // Set command timeout to 60 seconds
                            }
                        )
                        .EnableDetailedErrors ()
                        .EnableSensitiveDataLogging ()
                        .LogTo (Console.WriteLine, LogLevel.Trace); // Changed LogLevel to Trace for more details.
                },
                ServiceLifetime.Scoped
            );
        } catch (Exception ex) {
            using (var serviceProvider = services.BuildServiceProvider ()) {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>> ();
                logger.LogError (ex, "Error configuring database: {Message}", ex.Message);
            }
            throw;
        }
    }

    static async Task ConfigureApp (WebApplication app, IWebHostEnvironment env) {
        // Register development exception page first
        if (env.IsDevelopment ()) {
            app.UseDeveloperExceptionPage ();
        }

        // First middleware in the pipeline
        app.Use (
            async (context, next) => {
                Console.WriteLine ($"Request Path: {context.Request.Path}");
                Console.WriteLine ($"Request Method: {context.Request.Method}");
                await next ();
                Console.WriteLine ($"Response Status Code: {context.Response.StatusCode}");
            }
        );

        // Application middleware order is critical:
        // 1. Use routing first
        app.UseRouting ();

        // 2. Use CORS after routing but before auth
        if (env.IsDevelopment ()) {
            app.UseCors ("DevelopmentCorsPolicy");
        } else {
            app.UseCors ("ProductionCorsPolicy");
        }

        // 3. Add CORS error handling middleware
        app.Use (async (context, next) => {
            // Process the request
            await next ();

            // Add CORS headers for error responses only if response hasn't started
            if (context.Response.StatusCode >= 400 && !context.Response.HasStarted) {
                if (!context.Response.Headers.ContainsKey ("Access-Control-Allow-Origin")) {
                    var origin = context.Request.Headers["Origin"].ToString ();
                    if (!string.IsNullOrEmpty (origin)) {
                        context.Response.Headers.Append ("Access-Control-Allow-Origin", origin);
                        context.Response.Headers.Append ("Access-Control-Allow-Credentials", "true");
                        context.Response.Headers.Append ("Access-Control-Allow-Headers", "*");
                        context.Response.Headers.Append ("Access-Control-Allow-Methods", "*");
                    }
                }
            }
        });

        // 4. Authentication and Authorization come after CORS
        app.UseAuthentication ();
        app.UseAuthorization ();

        // 5. Add user activity logging *after* authentication so it has access to user info
        app.UseUserActivity (); // Use the extension method instead of UseMiddleware

        //app.UseDevExpressControls();

        // 6. Finally set up endpoints
        app.UseEndpoints (endpoints => {
            endpoints.MapControllers ();
            endpoints.MapHub<DashboardHub> ("/dashboardHub").RequireAuthorization ();
            endpoints.MapHub<PTSHub> ("/ptsHub").RequireAuthorization ();
            endpoints.MapHub<FrontEndHub> ("/frontendHub").RequireAuthorization ();
        });

        // Seed widget templates on startup
        await SeedWidgetTemplatesAsync (app.Services);
    }

    static async Task SeedWidgetTemplatesAsync (IServiceProvider serviceProvider) {
        using var scope = serviceProvider.CreateScope ();
        var seeder = scope.ServiceProvider.GetRequiredService<FMS.Application.Services.Dashboard.IWidgetTemplateSeeder> ();
        try {
            await seeder.SeedWidgetTemplatesAsync ();
        } catch (Exception ex) {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>> ();
            logger.LogError (ex, "Error seeding widget templates during startup");
        }
    }
}