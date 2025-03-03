using AutoMapper;
using MediatR;
using FMS.PTS.WindowsService.Infrastructure.Communication.WebSocket;
using FMS.Domain.Entities;
using Serilog;
using FMS.Application.Handlers.Common;
using FMS.Application.Handlers.Interface;
using FMS.Application.Communication.Connection;
using Serilog.Events;
using StackExchange.Redis;
using Serilog.Sinks.SystemConsole.Themes;
using Serilog.Formatting.Compact;
using FMS.Application.Communication;
using FMS.Infrastructure.webSocket;
using FMS.Application.Communication.HttpPolling;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using FMS.Application.Infrastructure.DistCacheTracker;
using Microsoft.Extensions.Caching.Distributed;
using System.Reflection;
using FMS.Application;
using FMS.Application.PTSServices.PumpService;
using FMS.PTS.WindowsService.Services.Pump;
using Microsoft.AspNetCore.Authorization;
using FMS.Infrastructure.DependancyInjection;
using FMS.Application.Command.DatabaseCommand.Common;
using FMS.Application.Util;
using FMS.Application.PTSServices.Configuration;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Application.Validation.PTSValidators;
using FMS.Infrastructure.Webservice;
using FMS.Application.Handlers;
using FMS.Application.Command.PTSCommand.UploadStatusCommands;
using Microsoft.Extensions.DependencyInjection;
using Role = FMS.Domain.Entities.Role;
using FMS.PTS.WindowsService.Infrastructure.Communication.RedisMessageHandling;
using FMS.Application.Communication.Redis;



namespace FMS.PTS.WindowsService
{

    public class Program
    {

        public static async Task Main(string[] args)
        {
            try
            {
                var environment = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Development";

                ConfigureBootstrapLogging(); // Separate method for bootstrap logging

                Log.Information("Starting up PTS Service - Bootstrap initialization");

                var host = CreateHostBuilder(args, environment).Build();

                ConfigureFinalLogging(host.Services.GetRequiredService<IConfiguration>(), environment); // Separate method

                Log.Information("Starting service execution");
                await host.RunAsync();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "PTS Service terminated unexpectedly");
                throw;
            }
            finally
            {
                Log.Information("Shutting down PTS Windows Service");
                Log.CloseAndFlush();
            }
        }
        private static void ConfigureBootstrapLogging()
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Debug()
                .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}", theme: AnsiConsoleTheme.Code)
                .WriteTo.File(path: $"C:\\Logs\\FMS.PTS\\pts-startup.log", rollingInterval: RollingInterval.Day, outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
                .Enrich.WithEnvironmentName()
                .Enrich.WithMachineName()
                .CreateBootstrapLogger();
        }

        private static IHostBuilder CreateHostBuilder(string[] args, string environment)
        {
            return Host.CreateDefaultBuilder(args)
                .UseWindowsService()
                .UseSerilog()
                .ConfigureAppConfiguration((hostContext, config) =>
                {
                    ConfigureApp(hostContext, config, environment);
                })
                .ConfigureServices(ConfigureServices);
        }

        private static void ConfigureApp(HostBuilderContext hostContext, IConfigurationBuilder config, string environment)
        {
            config.SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables();

            if (environment == "Development")
            {
                config.AddUserSecrets<Program>();
            }
        }


        private static void ConfigureServices(HostBuilderContext hostContext, IServiceCollection services)
        {
            var configuration = hostContext.Configuration;

            ConfigureAutoMapper(services); // Separate method
            ConfigureCaching(services, configuration);   // Separate method
            ConfigureMediatR(services);    // Separate method
            ConfigureSettings(services, configuration);
            ConfigureDatabase(services, configuration);
            ConfigureCoreServices(services);
            ConfigureCommunicationServices(services);
            ConfigureHandlers(services);
            ConfigurePipelineBehaviors(services);
            ConfigureAuthentication(services, configuration); // If needed
            ConfigureAuthorization(services); // If needed

        }

        private static void ConfigureAutoMapper(IServiceCollection services)
        {
            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
        }

        private static void ConfigureCaching(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IConnectionMultiplexer>(sp =>
            {
                var configuration = sp.GetRequiredService<IConfiguration>();
                var redisConnectionString = configuration["PTSService:ConnectionStrings:RedisConnection"];
                if (string.IsNullOrEmpty(redisConnectionString))
                    throw new InvalidOperationException("Redis connection string is missing.");

                return ConnectionMultiplexer.Connect(redisConnectionString);
            });
            services.AddSingleton<IDatabase>(sp => sp.GetRequiredService<IConnectionMultiplexer>().GetDatabase());

            services.AddSingleton<DeviceConnectionTracker>();


            services.AddSingleton<RedisPTSCommandProcessor>();

            services.AddDistributedMemoryCache();

            services.Configure<DistributedCacheEntryOptions>(options =>
            {
                options.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5); // TODO: From config
            });

        }
        private static void ConfigureMediatR(IServiceCollection services)
        {
            services.AddMediatR(cfg =>
            {
                cfg.RegisterServicesFromAssemblyContaining<Program>();
            });
        }
        private static void ConfigureAuthentication(IServiceCollection services, IConfiguration configuration)
        {
            // Add your authentication configuration here if needed (e.g., JWT)
            // Example (adapt to your needs):
            // services.AddAuthentication(...);
            // services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        }
        private static void ConfigureAuthorization(IServiceCollection services)
        {
            // Add your authorization configuration here if needed (e.g., policies)
            // Example (adapt to your needs):
            // services.AddAuthorization(...);
        }

        private static void ConfigureFinalLogging(IConfiguration configuration, string environment)
        {
            var ptsConfig = configuration.GetSection("PTSService").Get<PTSServiceSettings>();
            if (ptsConfig?.Logging == null)
            {
                throw new InvalidOperationException("Logging configuration is missing in appsettings");
            }

            var loggerConfig = new LoggerConfiguration()
                .MinimumLevel.Is(GetLogEventLevel(ptsConfig.Logging.MinimumLevel))
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("System", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .Enrich.WithEnvironmentName()
                .Enrich.WithMachineName()
                .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}", theme: AnsiConsoleTheme.Code);


            var logDirectory = Path.GetDirectoryName(ptsConfig.Logging.FilePath);
            if (!string.IsNullOrEmpty(logDirectory) && !Directory.Exists(logDirectory))
            {
                Directory.CreateDirectory(logDirectory);
            }
            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            var logFilePath = Path.Combine(logDirectory ?? "C:\\Logs\\FMS.PTS", $"pts-service-{timestamp}.log");


            loggerConfig.WriteTo.File(
                formatter: new CompactJsonFormatter(),
                path: logFilePath,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: ptsConfig.Logging.RetainedFileCount,
                fileSizeLimitBytes: ptsConfig.Logging.MaxFileSizeInMB * 1024 * 1024,
                rollOnFileSizeLimit: true,
                shared: true);

            if (environment == "Development")
            {
                loggerConfig.WriteTo.Debug().MinimumLevel.Debug();
            }

            Log.Logger = loggerConfig.CreateLogger();
        }


        private static void ConfigureDatabase(IServiceCollection services, IConfiguration configuration)
        {
            try
            {
                var ptsConfig = configuration.GetSection("PTSService");
                var connectionString = ptsConfig.GetSection("ConnectionStrings")["FMSConnection"];

                if (string.IsNullOrEmpty(connectionString))
                {
                    throw new InvalidOperationException(
                        "Connection string 'FMSConnection' is missing in PTSService:ConnectionStrings section of appsettings");
                }

                Log.Information("Configuring database connection for server: {Server}, database: {Database}",
                    GetServerFromConnectionString(connectionString),
                    GetDatabaseFromConnectionString(connectionString));

                services.AddDbContext<GpsdataContext>(options =>
                    options.UseMySql(
                        connectionString,
                        new MySqlServerVersion(new Version(5, 5, 61)),
                        mySqlOptions => mySqlOptions
                            .EnableRetryOnFailure(
                                maxRetryCount: 3,
                                maxRetryDelay: TimeSpan.FromSeconds(5),
                                errorNumbersToAdd: null)
                    ),
                    contextLifetime: ServiceLifetime.Scoped);

                services.AddIdentity<User, Role>()
                    .AddEntityFrameworkStores<GpsdataContext>()
                    .AddDefaultTokenProviders();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error configuring database: {Message}", ex.Message);
                throw; // Or handle as needed
            }
        }

        private static void ConfigureSettings(IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<PTSServiceSettings>(
                configuration.GetSection(PTSServiceSettings.ConfigurationSection),
                options => options.BindNonPublicProperties = true);



            services.AddOptions<PTSServiceSettings>()
                .Bind(configuration.GetSection(PTSServiceSettings.ConfigurationSection))
                .ValidateDataAnnotations()
                .ValidateOnStart();
        }
        private static void ConfigureCoreServices(IServiceCollection services)
        {
            services.AddHttpClient();
            // Register Memory Cache
            services.AddMemoryCache();

            Log.Information("Configuring core services...");
            // Device Management
            // Buffer Management
            services.AddSingleton<BufferManager>();

        }

        private static void ConfigureCommunicationServices(IServiceCollection services)
        {

            Log.Information("Begin configuring communication services...");

            try
            {

                services.AddSignalR();

                // Create a temporary service provider to test resolution


                //   services.AddSingleton<MessageHandlerRegistry>();

                services.AddHostedService(sp => sp.GetRequiredService<PTSWebSocketListenerService>());




                Log.Information("Communication services configured");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error verifying MediatR registration");
            }
        }




        private static void ConfigureHandlers(IServiceCollection services)
        {
            // Register IRedisPublisher with its concrete implementation.
            services.AddScoped<IRedisPublisher, RedisPublisher>();
            services.AddScoped<IRedisSubscriber, RedisSubscriber>();

            // Register RedisCommandService if it's not already registered.
            services.AddScoped<RedisCommandService>();

            // Existing registrations
            services.AddSingleton<IPTSConnectionManager, PTSConnectionManager>();

            services.Scan(scan => scan
                .FromAssemblyOf<UploadStatusHandler>()
                .AddClasses(classes => classes.AssignableTo<IPacketHandler>())
                .AsSelf()
                .AsImplementedInterfaces()
                .WithScopedLifetime());

            services.AddMediatR(cfg =>
            {
                cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
                cfg.RegisterServicesFromAssembly(typeof(UploadStatusCommand).Assembly);
            });
            services.AddScoped<IPTSMessageProcessor, PTSMessageProcessor>();

            services.AddScoped<MessageHandlerRegistry>();

            services.AddScoped<IPendingCommandRepository, PendingCommandsRepository>();
            services.AddScoped<IAuthorizationStateTracker, AuthorizationStateTracker>();
            services.AddScoped<ITankVolumeAdjustmentService, TankVolumeAdjustmentService>();
            services.AddScoped<IAuthorizationHandler, PermissionHandler>();
            services.AddScoped<IConfigurationService, ConfigurationService>();
            services.AddScoped<IGPSGateDirectoryWebservice, GPSGateDirectoryWebservice>();
            services.AddScoped<IPumpService, PumpService>();
            services.AddScoped<IJwtGenerator, JwtGenerator>();
            services.AddScoped<IDeviceCommunicationService, DeviceCommunicationService>();
            services.AddScoped<IDeviceHttpCommandPusher, DeviceHttpCommandPusher>();
            services.AddScoped<IDeviceValidator, DeviceValidator>();
            services.AddScoped<UserManager<User>>();
            services.AddScoped<ICommandExecutor, CommandExecutor>();

            services.AddTransient<RoleManager<Role>>();
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(TransactionMiddleware<,>));

            services.AddSingleton<PTSWebSocketListenerService>();
        }

        private static void ConfigurePipelineBehaviors(IServiceCollection services)
        {
            //   services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ErrorHandlingBehavior<,>));
            // services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            // services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        }

        private static string GetServerFromConnectionString(string connectionString)
        {
            try
            {
                var serverPart = connectionString
                    .Split(';')
                    .FirstOrDefault(p => p.Trim().StartsWith("server=", StringComparison.OrdinalIgnoreCase))?
                    .Split('=')[1];
                return serverPart ?? "unknown";
            }
            catch
            {
                return "unknown";
            }
        }

        private static string GetDatabaseFromConnectionString(string connectionString)
        {
            try
            {
                var dbPart = connectionString
                    .Split(';')
                    .FirstOrDefault(p => p.Trim().StartsWith("database=", StringComparison.OrdinalIgnoreCase))?
                    .Split('=')[1];
                return dbPart ?? "unknown";
            }
            catch
            {
                return "unknown";
            }
        }
        private static LogEventLevel GetLogEventLevel(string level)
        {
            return level?.ToLower() switch
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


    }
}
