using System.Reflection;
using AutoMapper;
using FMS.Application;
using FMS.Application.Command.DatabaseCommand.Common;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Command.PTSCommand.UploadStatusCommands;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Features.AutomatedReconciliation.Services;
using FMS.Application.Handlers;
using FMS.Application.Handlers.Common;
using FMS.Application.Handlers.Interface;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.BackgroundServices.FMS;
// using FMS.Application.PTSServices.Configuration; // Cursor - Commented out missing namespace
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Services;
using FMS.Application.Services.AutomatedReconciliation;
using FMS.Application.Services.Configuration;
using FMS.Application.Util;
using FMS.Application.Validation.PTSValidators;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using FMS.PTS.WindowsService.Infrastructure.Communication.WebSocket;
using FMS.PTS.WindowsService.Services.Pump;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;
using Serilog.Sinks.SystemConsole.Themes;
using StackExchange.Redis;
using Role = FMS.Domain.Entities.Role;
using FMS.Application.Communication.Redis;
using FMS.Application.Communication.SignalR;
using FMS.Application.Communication.Tracker;
using FMS.Application.Communication.webSocket;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using FMS.Application.Features.Notification.Services.Businessfunction;
using FMS.Application.Features.Notification.Services.Channels;
using FMS.Application.Features.Notification.Services.Integration;
using FMS.Application.Features.Notification.Services.RecipientResolver;
using FMS.Application.Features.PTSService.Services;
using FMS.Application.Features.TankManagement.Services;
using FMS.Application.Features.TankManagement.Services;
using FMS.Application.Infrastructure.Communication.SignalR;
using FMS.Application.Infrastructure.Services.Authentication;
using FMS.Application.Services.Dashboard;
using FMS.Application.Services.Dashboard.WidgetFactories;
using FMS.Application.Services.FMS.BackgroundServices.FMS;
using FMS.Application.Services.TankStock;
using FMS.PTS.WindowsService.Infrastructure.Communication.RedisMessageHandling;
using Microsoft.AspNetCore.SignalR;

namespace FMS.PTS.WindowsService {

    public class Program {

        public static async Task Main (string[] args) {
            try {
                var environment = Environment.GetEnvironmentVariable ("DOTNET_ENVIRONMENT") ?? "Development";

                ConfigureBootstrapLogging (); // Separate method for bootstrap logging

                Log.Information ("Starting up PTS Service - Bootstrap initialization");

                var host = CreateHostBuilder (args, environment).Build ();

                ConfigureFinalLogging (host.Services.GetRequiredService<IConfiguration> (), environment); // Separate method

                Log.Information ("Starting service execution");
                await host.RunAsync ();
            } catch (Exception ex) {
                Log.Fatal (ex, "PTS Service terminated unexpectedly");
                throw;
            } finally {
                Log.Information ("Shutting down PTS Windows Service");
                Log.CloseAndFlush ();
            }
        }
        private static void ConfigureBootstrapLogging () {
            Log.Logger = new LoggerConfiguration ()
                .MinimumLevel.Debug ()
                .WriteTo.Console (outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}", theme : AnsiConsoleTheme.Code)
                .WriteTo.File (path: $"C:\\Logs\\FMS.PTS\\pts-startup.log", rollingInterval : RollingInterval.Day, outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
                .Enrich.WithEnvironmentName ()
                .Enrich.WithMachineName ()
                .CreateBootstrapLogger ();
        }

        private static IHostBuilder CreateHostBuilder (string[] args, string environment) {
            return Host.CreateDefaultBuilder (args)
                .UseWindowsService ()
                .UseSerilog ()
                .ConfigureAppConfiguration ((hostContext, config) => {
                    ConfigureApp (hostContext, config, environment);
                })
                .ConfigureServices (ConfigureServices);
        }

        private static void ConfigureApp (HostBuilderContext hostContext, IConfigurationBuilder config, string environment) {
            config.SetBasePath (Directory.GetCurrentDirectory ())
                .AddJsonFile ("appsettings.json", optional : false, reloadOnChange : true)
                .AddJsonFile ($"appsettings.{environment}.json", optional : true, reloadOnChange : true)
                .AddEnvironmentVariables ();

            if (environment == "Development") {
                config.AddUserSecrets<Program> ();
            }
        }

        private static void ConfigureServices (HostBuilderContext hostContext, IServiceCollection services) {
            var configuration = hostContext.Configuration;

            ConfigureAutoMapper (services); // Separate method
            ConfigureCaching (services, configuration); // Separate method
            ConfigureMediatR (services); // Separate method
            ConfigureSettings (services, configuration);
            ConfigureDatabase (services, configuration);
            ConfigureCoreServices (services);
            ConfigureCommunicationServices (services);
            ConfigureHandlers (services);
            ConfigurePipelineBehaviors (services);
            ConfigureAuthentication (services, configuration); // If needed
            ConfigureAuthorization (services); // If needed

            // Update this registration to use a factory - fix scoped service issue
            services.AddSingleton<DeviceActivityMonitorService> (sp => {
                // Create a scope factory and device connection tracker for the singleton service
                var serviceScopeFactory = sp.GetRequiredService<IServiceScopeFactory> ();
                var deviceConnectionTracker = sp.GetRequiredService<DeviceConnectionTracker> ();
                var logger = sp.GetRequiredService<ILogger<DeviceActivityMonitorService>> ();

                // Create the service without the scoped ISystemConfigurationService dependency
                // It will resolve the scoped service internally using the factory
                return new DeviceActivityMonitorService (
                    logger,
                    serviceScopeFactory,
                    deviceConnectionTracker);
            });

            // Register DeviceActivityMonitorService as a hosted service
            services.AddHostedService (sp => sp.GetRequiredService<DeviceActivityMonitorService> ());
        }

        private static void ConfigureAutoMapper (IServiceCollection services) {
            services.AddAutoMapper (AppDomain.CurrentDomain.GetAssemblies ());
        }

        private static void ConfigureCaching (IServiceCollection services, IConfiguration configuration) {
            services.AddSingleton<IConnectionMultiplexer> (sp => {
                var configuration = sp.GetRequiredService<IConfiguration> ();
                var redisConnectionString = configuration["PTSService:ConnectionStrings:RedisConnection"];
                if (string.IsNullOrEmpty (redisConnectionString))
                    throw new InvalidOperationException ("Redis connection string is missing.");

                return ConnectionMultiplexer.Connect (redisConnectionString);
            });
            services.AddSingleton<IDatabase> (sp => sp.GetRequiredService<IConnectionMultiplexer> ().GetDatabase ());

            // Register DeviceConnectionTracker as singleton for consistent state tracking
            services.AddSingleton<DeviceConnectionTracker> (sp => {
                var logger = sp.GetRequiredService<ILogger<DeviceConnectionTracker>> ();
                var hubContext = sp.GetRequiredService<IHubContext<FrontEndHub>> ();
                var redisConnection = sp.GetRequiredService<IConnectionMultiplexer> ();
                return new DeviceConnectionTracker (logger, hubContext, redisConnection);
            }); //Cursor

            // Register DeviceStatusHelper for Redis status management //Cursor
            services.AddSingleton<DeviceStatusHelper> (sp => {
                var logger = sp.GetRequiredService<ILogger<DeviceStatusHelper>> ();
                var redisConnection = sp.GetRequiredService<IConnectionMultiplexer> ();
                return new DeviceStatusHelper (logger, redisConnection);
            }); //Cursor

            services.AddSingleton<RedisPTSCommandProcessor> ();

            services.AddDistributedMemoryCache ();

            services.Configure<DistributedCacheEntryOptions> (options => {
                options.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (5); // TODO: From config
            });

        }
        private static void ConfigureMediatR (IServiceCollection services) {
            services.AddMediatR (cfg => {
                cfg.RegisterServicesFromAssemblyContaining<Program> ();

                // Make sure to register handlers from the Application assembly
                cfg.RegisterServicesFromAssemblyContaining<UploadStatusCommand> (); //Cursor
            });
        }
        private static void ConfigureAuthentication (IServiceCollection services, IConfiguration configuration) {
            // Add your authentication configuration here if needed (e.g., JWT)
            // Example (adapt to your needs):
            // services.AddAuthentication(...);
            // services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        }
        private static void ConfigureAuthorization (IServiceCollection services) {
            // Add your authorization configuration here if needed (e.g., policies)
            // Example (adapt to your needs):
            // services.AddAuthorization(...);
        }

        private static void ConfigureFinalLogging (IConfiguration configuration, string environment) {
            var ptsConfig = configuration.GetSection ("PTSService").Get<PTSServiceSettings> ();
            if (ptsConfig?.Logging == null) {
                throw new InvalidOperationException ("Logging configuration is missing in appsettings");
            }

            var loggerConfig = new LoggerConfiguration ()
                .MinimumLevel.Is (GetLogEventLevel (ptsConfig.Logging.MinimumLevel))
                .MinimumLevel.Override ("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override ("System", LogEventLevel.Warning)
                .MinimumLevel.Override ("Microsoft.EntityFrameworkCore", LogEventLevel.Error)
                .MinimumLevel.Override ("Pomelo.EntityFrameworkCore.MySql", LogEventLevel.Error)
                .Enrich.FromLogContext ()
                .Enrich.WithEnvironmentName ()
                .Enrich.WithMachineName ();

            // Configure Console Sink with specific filter for Development //Cursor
            loggerConfig.WriteTo.Logger (lc => lc
                .Filter.ByExcluding (le =>
                    environment == "Development" &&
                    le.Level < LogEventLevel.Warning && // Exclude Information and below
                    le.Properties.TryGetValue ("SourceContext", out var sourceContext) &&
                    sourceContext is Serilog.Events.ScalarValue sv && //Cursor Add full namespace
                    sv.Value is string contextString &&
                    (contextString.StartsWith ("Microsoft.EntityFrameworkCore") || contextString.StartsWith ("Pomelo.EntityFrameworkCore"))) // Only for EF Core/Pomelo sources
                .WriteTo.Console (
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}",
                    theme : AnsiConsoleTheme.Code
                )
            );

            var logDirectory = Path.GetDirectoryName (ptsConfig.Logging.FilePath);
            if (!string.IsNullOrEmpty (logDirectory) && !Directory.Exists (logDirectory)) {
                Directory.CreateDirectory (logDirectory);
            }
            var timestamp = DateTime.Now.ToString ("yyyyMMdd_HHmmss");
            // Ensure logDirectory has a default value if null or empty after GetDirectoryName //Cursor
            var effectiveLogDirectory = string.IsNullOrEmpty (logDirectory) ? "C:\\Logs\\FMS.PTS" : logDirectory; //Cursor
            var logFilePath = Path.Combine (effectiveLogDirectory, $"pts-service-{timestamp}.log"); //Cursor

            loggerConfig.WriteTo.File (
                formatter: new CompactJsonFormatter (),
                path: logFilePath,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: ptsConfig.Logging.RetainedFileCount,
                fileSizeLimitBytes: ptsConfig.Logging.MaxFileSizeInMB * 1024 * 1024,
                rollOnFileSizeLimit: true,
                shared: true);

            if (environment == "Development") {
                loggerConfig.WriteTo.Debug ().MinimumLevel.Debug ();
            }

            Log.Logger = loggerConfig.CreateLogger ();
        }

        private static void ConfigureDatabase (IServiceCollection services, IConfiguration configuration) {
            try {
                var ptsConfig = configuration.GetSection ("PTSService");
                var connectionString = ptsConfig.GetSection ("ConnectionStrings") ["FMSConnection"];

                if (string.IsNullOrEmpty (connectionString)) {
                    throw new InvalidOperationException (
                        "Connection string 'FMSConnection' is missing in PTSService:ConnectionStrings section of appsettings");
                }

                // Add ConvertZeroDateTime to connection string if not present
                if (!connectionString.Contains ("ConvertZeroDateTime", StringComparison.OrdinalIgnoreCase)) {
                    connectionString += ";ConvertZeroDateTime=true";
                    Log.Information ("Added ConvertZeroDateTime=true to connection string to handle invalid MySQL datetime values");
                }

                Log.Information ("Configuring database connection for server: {Server}, database: {Database}",
                    GetServerFromConnectionString (connectionString),
                    GetDatabaseFromConnectionString (connectionString));

                services.AddDbContext<GpsdataContext> (options =>
                    options.UseMySql (
                        connectionString,
                        new MySqlServerVersion (new Version (5, 5, 61)),
                        mySqlOptions => mySqlOptions
                        .EnableRetryOnFailure (
                            maxRetryCount: 3,
                            maxRetryDelay: TimeSpan.FromSeconds (5),
                            errorNumbersToAdd: null)
                    ),
                    contextLifetime : ServiceLifetime.Scoped);

                services.AddIdentity<User, Role> ()
                    .AddEntityFrameworkStores<GpsdataContext> ()
                    .AddDefaultTokenProviders ();
            } catch (Exception ex) {
                Log.Error (ex, "Error configuring database: {Message}", ex.Message);
                throw; // Or handle as needed
            }
        }

        private static void ConfigureSettings (IServiceCollection services, IConfiguration configuration) {
            services.Configure<PTSServiceSettings> (
                configuration.GetSection (PTSServiceSettings.ConfigurationSection),
                options => options.BindNonPublicProperties = true);

            services.AddOptions<PTSServiceSettings> ()
                .Bind (configuration.GetSection (PTSServiceSettings.ConfigurationSection))
                .ValidateDataAnnotations ()
                .ValidateOnStart ();
        }
        private static void ConfigureCoreServices (IServiceCollection services) {
            services.AddHttpClient ();
            // Register Memory Cache
            services.AddMemoryCache ();

            Log.Information ("Configuring core services...");
            // Device Management
            // Buffer Management
            services.AddSingleton<BufferManager> ();

        }

        private static void ConfigureCommunicationServices (IServiceCollection services) {

            Log.Information ("Begin configuring communication services...");

            try {
                // Register SignalR core services needed to inject and use IHubContext
                services.AddSignalR ();

                // No need for AddStackExchangeRedis() here if this service
                // is only PUBLISHING via IHubContext and not HOSTING a hub endpoint.
                // The IHubContext will use the backplane configured on the actual hub host (WebClient).

                // Existing communication services...
                services.AddHostedService (sp => sp.GetRequiredService<PTSWebSocketListenerService> ());

                Log.Information ("Communication services configured (SignalR Core added, no server-side backplane)");
            } catch (Exception ex) {
                Log.Error (ex, "Error configuring communication services");
                throw;
            }
        }

        private static void ConfigureHandlers (IServiceCollection services) {
            // Register IRedisPublisher with its concrete implementation.
            services.AddScoped<IRedisPublisher, RedisPublisher> ();
            services.AddScoped<IRedisSubscriber, RedisSubscriber> ();

            // Register RedisCommandService if it's not already registered.
            services.AddScoped<RedisCommandService> ();

            //Cursor: Register RedisPTSCommandProcessor hosted service to start Redis subscriptions
            services.AddHostedService<RedisPTSCommandProcessorHostedService> ();

            // Register missing services causing dependency injection errors
            services.AddScoped<ITransactionMonitoringService, TransactionMonitoringService> (); //Cursor
            services.AddScoped<TankVolumeHistoryIntegrationService> (); //Cursor
            services.AddScoped<ITransactionCompletionService, TransactionCompletionService> (); //Cursor

            //Cursor: Register AutoTransactionCompletionService and DirectHttpTransactionService
            services.AddScoped<IAutoTransactionCompletionService, AutoTransactionCompletionService> (); //Cursor
            services.AddScoped<IDirectHttpTransactionService, DirectHttpTransactionService> (); //Cursor

            //Cursor: Register missing configuration and alarm services
            services.AddScoped<ISystemConfigurationService, SystemConfigurationService> (); //Cursor
            services.AddScoped<IAutomatedFuelingConfigurationService, AutomatedFuelingConfigurationService> (); //Cursor
            services.AddScoped<IAlarmHandlerService, AlarmHandlerService> (); //Cursor
            services.AddScoped<PumpTransactionIntegrationService> (); //Cursor
            services.AddScoped<AutomatedReconciliationService> (); //Cursor
            services.AddScoped<DiscrepancyDetectionService> (); //Cursor on changes to code
            services.AddScoped<PolicyEvaluationEngine> ();
            services.AddScoped<DailyReconciliationPolicyService> ();
            services.AddSingleton<IPTSConnectionManager, PTSConnectionManager> ();
            services.AddHttpClient<FMS.Application.Features.Vehicle.Services.IGPSService, FMS.Application.Features.Vehicle.Services.GPSGateService> ();
            services.AddScoped<FMS.Application.Features.Vehicle.Services.IGPSService, FMS.Application.Features.Vehicle.Services.GPSGateService> ();
            services.AddScoped<IBusinessFunctionNotificationService, BusinessFunctionNotificationService> ();

            services.AddScoped<IPolicyTriggerService, PolicyTriggerService> (); //Cursor
            services.Scan (scan => scan
                .FromAssemblyOf<UploadStatusHandler> ()
                .AddClasses (classes => classes.AssignableTo<IPacketHandler> ())
                .AsSelf ()
                .AsImplementedInterfaces ()
                .WithScopedLifetime ());

            services.AddMediatR (cfg => {
                cfg.RegisterServicesFromAssembly (typeof (Program).Assembly);
                cfg.RegisterServicesFromAssembly (typeof (UploadStatusCommand).Assembly);
            });
            services.AddScoped<IPTSMessageProcessor, PTSMessageProcessor> ();

            services.AddScoped<MessageHandlerRegistry> ();

            services.AddScoped<IPendingCommandRepository, PendingCommandsRepository> ();
            services.AddScoped<IAuthorizationStateTracker, AuthorizationStateTracker> ();
            services.AddScoped<ITankVolumeAdjustmentService, TankVolumeAdjustmentService> ();
            services.AddScoped<IAuthorizationHandler, PermissionHandler> ();
            services.AddScoped<IPumpService, PumpService> ();
            services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator> ();
            services.AddScoped<IDeviceCommunicationService, DeviceCommunicationService> ();
            services.AddScoped<IDeviceHttpCommandPusher, DeviceHttpCommandPusher> ();
            services.AddScoped<IDeviceValidator, DeviceValidator> ();
            services.AddScoped<UserManager<User>> ();
            services.AddScoped<ICommandExecutor, CommandExecutor> ();
            //Cursor on changes to code
            services.AddScoped<IStaleConnectionDetectionService, StaleConnectionDetectionService> ();
            services.AddScoped<ReconciliationOrchestrationService> (); //Cursor on changes to code
            // ... existing code ...

            services.AddTransient<RoleManager<Role>> ();
            services.AddTransient (typeof (IPipelineBehavior<,>), typeof (TransactionMiddleware<,>));

            services.AddSingleton<PTSWebSocketListenerService> ();
            services.AddScoped<TankStockFutureRecordsService> (); //Cursor
            services.AddScoped<OpeningStockValidationService> ();

            // Register notification services
            services.AddScoped<INotificationRecipientResolver, NotificationRecipientResolver> ();
            services.AddScoped<INotificationService, NotificationService> ();
            services.AddScoped<IEmailService, EmailService> ();
            services.AddScoped<ISmsService, SmsService> ();

            // Register SignalR notification service
            services.AddScoped<ISignalRNotificationService, SignalRNotificationService> ();

            // Register tank management services
            services.AddScoped<InventoryCostingService> ();

            //Cursor: Register system user service
            services.AddScoped<ISystemUserService, SystemUserService> ();

            // Register the missing services from the exception
            services.AddScoped<IServiceControlService, ServiceControlService> ();
            services.AddScoped<IWidgetFactoryService, WidgetFactoryService> ();
            services.AddScoped<AlarmHandlerActiveAlarmIntegration> ();
            services.AddScoped<ITankVolumeHistoryDeletionService, TankVolumeHistoryDeletionService> ();

            // Register widget factory dependencies
            services.AddScoped<WidgetFactoryCoordinator> ();
            services.AddScoped<ChartWidgetFactory> ();
            services.AddScoped<StatCardWidgetFactory> ();
            services.AddScoped<TableWidgetFactory> ();
            services.AddScoped<IDataSourceManager, DataSourceManager> ();

            // Register additional missing services from WebClient
            services.AddScoped<IActiveAlarmService, ActiveAlarmService> ();
            services.AddScoped<INotificationCategoryService, NotificationCategoryService> ();
            services.AddScoped<FMS.Application.Features.Notification.Services.Groups.INotificationGroupService, FMS.Application.Features.Notification.Services.Groups.NotificationGroupService> ();
            services.AddSingleton<ICategoryMetadataProvider, InMemoryCategoryMetadataProvider> ();

            // Dynamic notification channels and registry
            services.AddScoped<INotificationChannelRegistry, NotificationChannelRegistry> ();
            services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.SystemNotificationChannel> ();
            services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.EmailNotificationChannel> ();
            services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.SmsNotificationChannel> ();
            services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.SlackNotificationChannel> ();
            services.AddScoped<INotificationChannel, FMS.Application.Features.Notification.Services.Channels.PushNotificationChannel> ();

            // Register Dashboard Services
            services.AddScoped<FMS.Application.Services.Dashboard.IDashboardMetricsService, FMS.Application.Services.Dashboard.DashboardMetricsService> ();
            services.AddScoped<FMS.Application.Services.Dashboard.IWidgetDataService, FMS.Application.Services.Dashboard.WidgetDataService> ();
            services.AddScoped<FMS.Application.Services.Dashboard.IWidgetTemplateSeeder, FMS.Application.Services.Dashboard.WidgetTemplateSeeder> ();

            // Register background service
            //services.AddHostedService<NotificationBackgroundService> ();

            //Cursor: Register system user initialization service
            services.AddHostedService<SystemUserInitializationService> ();

        }

        private static void ConfigurePipelineBehaviors (IServiceCollection services) {
            //   services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ErrorHandlingBehavior<,>));
            // services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            // services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        }

        private static string GetServerFromConnectionString (string connectionString) {
            try {
                var serverPart = connectionString
                    .Split (';')
                    .FirstOrDefault (p => p.Trim ().StartsWith ("server=", StringComparison.OrdinalIgnoreCase)) ?
                    .Split ('=') [1];
                return serverPart ?? "unknown";
            } catch {
                return "unknown";
            }
        }

        private static string GetDatabaseFromConnectionString (string connectionString) {
            try {
                var dbPart = connectionString
                    .Split (';')
                    .FirstOrDefault (p => p.Trim ().StartsWith ("database=", StringComparison.OrdinalIgnoreCase)) ?
                    .Split ('=') [1];
                return dbPart ?? "unknown";
            } catch {
                return "unknown";
            }
        }
        private static LogEventLevel GetLogEventLevel (string level) {
            return level?.ToLower () switch {
                "verbose" => LogEventLevel.Verbose,
                    "debug" => LogEventLevel.Debug,
                    "information" => LogEventLevel.Information,
                    "warning" => LogEventLevel.Warning,
                    "error" => LogEventLevel.Error,
                    "fatal" => LogEventLevel.Fatal,
                    _ => LogEventLevel.Information
            };
        }

    }
}