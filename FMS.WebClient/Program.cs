using System;
using System.Reflection;
using System.Security.Cryptography.Xml;
using System.Text;
using System.Text.Json.Serialization;
using Autofac.Core;
using AutoMapper;
using FMS.WebClient.Controllers;
using FMS.WebClient.Signal;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;

using FMS.Application;
using FMS.Application.Command.DatabaseCommand.TagCmd;
using FMS.Application.MappingProfile;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
using FMS.Application.Queries.GPSGATEServer.GetconsumptionReport;
using FMS.Domain.Entities;
using FMS.Infrastructure.DependancyInjection;
using FMS.Infrastructure.Webservice.GPSService;
using FMS.Persistence.DataAccess;
using FMS.Persistence.DataAccess.Nafta;
using FMS.PTS;
using FMS.WebClient.MappingProfile;
using FMS.Application.Command.DatabaseCommand.Common;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.SignalR;
using FMS.Application.Handlers.Interface;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.PTSServices.Configuration;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Util;
using FMS.Application.Validation.PTSValidators;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.PTS.WindowsService.Services.Pump;
using FMS.WebClient.Util;
using StackExchange.Redis;
using Role = FMS.Domain.Entities.Role;
using FMS.Application.Handlers;
using FMS.Application.Communication.Redis;
using FMS.Application.ModelsDTOs.FMS.UserManagement;
using System.Net;

namespace FMS.WebClient;

public class Program
{
    public static void Main(string[] args)
    {
        // Configure a bootstrap Serilog logger for early logging (e.g. during startup)
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .Enrich.FromLogContext()
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.File(
                path: "C:\\Logs\\FMS.Webclient\\webclient-startup.log",
                rollingInterval: RollingInterval.Day,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
            .CreateLogger();

        var builder = WebApplication.CreateBuilder(args);

        // Replace NLog with Serilog by telling the Host to use Serilog
        builder.Host.UseSerilog();

        Console.WriteLine("App started... " + builder.Environment.EnvironmentName);
        builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

        ConfigureServices(builder.Services, builder.Configuration);
        ConfigureDatabase(builder.Services, builder.Configuration, builder.Environment);

int httpPort = 7009; // Default port
        int httpsPort = 7010; // Default HTTPS port
bool httpPortInUse = IsPortInUse(7009);
bool httpsPortInUse = IsPortInUse(7010);

if (httpPortInUse || httpsPortInUse)
{
    Log.Warning($"Default ports are already in use. HTTP port in use: {httpPortInUse}, HTTPS port in use: {httpsPortInUse}");

    // Start looking from higher ports
    int basePort = 7020;
    while (IsPortInUse(basePort) || IsPortInUse(basePort + 1))
    {
        basePort += 10;
        if (basePort > 8000)
        {
            throw new InvalidOperationException("Unable to find available ports in the range 7020-8000");
        }
    }

    httpPort = basePort;
    httpsPort = basePort + 1;
    Log.Information($"Found available ports: HTTP on {httpPort}, HTTPS on {httpsPort}");
}

// Configure Kestrel with the selected ports
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    // Use explicit IPAddress.Loopback instead of ListenLocalhost
    serverOptions.Listen(IPAddress.Any, httpPort);
    serverOptions.Listen(IPAddress.Any
    , httpsPort, listenOptions =>
    {
      //  listenOptions.UseHttps();
    });
});
        var app = builder.Build();
        ConfigureApp(app, builder.Environment);

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
private static bool IsPortInUse(int port)
{
    try
    {
        using var socket = new System.Net.Sockets.Socket(
            System.Net.Sockets.AddressFamily.InterNetwork,
            System.Net.Sockets.SocketType.Stream,
            System.Net.Sockets.ProtocolType.Tcp);

        socket.Bind(new System.Net.IPEndPoint(System.Net.IPAddress.Loopback, port));
        return false; // Port is available
    }
    catch
    {
        return true; // Port is in use
    }
}

// Helper method to find an available port in a range
private static int FindAvailablePort(int startPort, int endPort)
{
    for (int port = startPort; port <= endPort; port++)
    {
        if (!IsPortInUse(port))
        {
            return port;
        }
    }
    throw new InvalidOperationException($"No available ports found in range {startPort}-{endPort}");
}
    static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        try
        {
            services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.MaxDepth = 0;
                });

            services.AddDistributedMemoryCache();
            services.AddSingleton<DeviceConnectionTracker>();

            services.AddSignalR();
            // services.AddDevExpressControls();
            services.AddHttpContextAccessor();

            RegisterMediatR(services);
            RegisterAutoMapper(services);
            RegisterCustomServices(services);
            RegisterRedisCommandService(services);
            ConfigureAuthentication(services, configuration);
            ConfigureAuthorization(services);
            ConfigureCors(services);
        }
        catch (Exception ex)
        {
            using (var serviceProvider = services.BuildServiceProvider())
            {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "Error configuring services: {Message}", ex.Message);
            }
            throw;
        }
    }

    static void RegisterRedisCommandService(IServiceCollection services)
    {
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var configuration = sp.GetRequiredService<IConfiguration>();
            var redisConnectionString = configuration["ConnectionStrings:RedisConnection"];
            if (string.IsNullOrEmpty(redisConnectionString))
                throw new InvalidOperationException("Redis connection string is missing.");
            return ConnectionMultiplexer.Connect(redisConnectionString);
        });
        services.AddSingleton<StackExchange.Redis.IDatabase>(sp =>
        {
            var multiplexer = sp.GetRequiredService<IConnectionMultiplexer>();
            return multiplexer.GetDatabase();
        });
        services.AddSingleton<IRedisPublisher, RedisPublisher>();
        services.AddSingleton<IRedisSubscriber, RedisSubscriber>();
        services.AddSingleton<RedisCommandService>();
    }

    static void RegisterMediatR(IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblyContaining<Program>();
            cfg.RegisterServicesFromAssembly(typeof(ConsumptionController).Assembly);
            cfg.RegisterServicesFromAssemblies(typeof(VehicleController).Assembly);
            cfg.RegisterServicesFromAssembly(typeof(GetConsumptionReportQueryHandler).Assembly);
            cfg.RegisterServicesFromAssembly(typeof(CreateTagCommand).Assembly);
        });
    }

    static void RegisterAutoMapper(IServiceCollection services)
    {
        services.AddAutoMapper(typeof(VehicleMappingProfile));
        services.AddAutoMapper(typeof(MainMappingProfile).Assembly);
    }

    static void RegisterCustomServices(IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddSingleton<PtsStatusService>();
        services.AddScoped<UserManager<User>>();
        services.AddScoped<RoleManager<Role>>();
        services.AddScoped<IDeviceCommunicationService, DeviceCommunicationService>();
        services.AddScoped<IDeviceValidator, DeviceValidator>();
        services.AddScoped<IPumpService, PumpService>();
        services.AddScoped<IAuthorizationStateTracker, AuthorizationStateTracker>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorization>();
        services.AddScoped<IGPSGateDirectoryWebservice, GPSGateDirectoryWebservice>();
        services.AddScoped<IPendingCommandRepository, PendingCommandsRepository>();
        services.AddScoped<IAuthorizationStateTracker, AuthorizationStateTracker>();
        services.AddScoped<ITankVolumeAdjustmentService, TankVolumeAdjustmentService>();
        services.AddScoped<IAuthorizationHandler, PermissionHandler>();
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(TransactionMiddleware<,>));
        // services.AddScoped<IWebDocumentViewerMvcControllerService, WebDocumentViewerMvcControllerService>();
        // services.AddScoped<IReportDesignerMvcControllerService, ReportDesignerMvcControllerService>();
        services.AddScoped<IPTSConnectionManager, PTSConnectionManager>();
        services.AddScoped<IDeviceHttpCommandPusher, DeviceHttpCommandPusher>();
        services.AddScoped<IConfigurationService, ConfigurationService>();
        services.AddScoped<ICommandExecutor, CommandExecutor>();
        // services.AddScoped<ReportStorageWebExtension, ReportStorageService>();
        services.AddHttpClient<DeviceHttpCommandPusher>().SetHandlerLifetime(TimeSpan.FromMinutes(5));
        services.AddScoped<IConfigurationService, ConfigurationService>();

        services.Scan(scan => scan
            .FromAssemblyOf<UploadStatusHandler>()
            .AddClasses(classes => classes.AssignableTo<IPacketHandler>())
            .AsSelf()
            .AsImplementedInterfaces()
            .WithScopedLifetime());
    }

    static void ConfigureAuthentication(IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettingsSection = configuration.GetSection("JwtSettings");
        if (!jwtSettingsSection.Exists() || !jwtSettingsSection.GetChildren().Any())
        {
            throw new InvalidOperationException("JwtSettings section is missing or empty in the configuration.");
        }
        services.Configure<JwtSettings>(jwtSettingsSection);
        var jwtSettings = jwtSettingsSection.Get<JwtSettings>();

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience
            };

            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    context.NoResult();
                    context.Response.StatusCode = 401;
                    return Task.CompletedTask;
                },
                OnChallenge = async context =>
                {
                    context.Response.Headers.Add("WWW-Authenticate", "Bearer");
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Unauthorized");
                    context.HandleResponse();
                }
            };
        });
        services.AddTransient<IJwtGenerator, JwtGenerator>();
        services.AddTransient<RoleManager<Role>>();
    }

    static void ConfigureAuthorization(IServiceCollection services)
    {
        try
        {
            services.AddAuthorization(options =>
            {
                using (var scope = services.BuildServiceProvider().CreateScope())
                {
                    var serviceProvider = scope.ServiceProvider;
                    var mediator = serviceProvider.GetRequiredService<IMediator>();
                    List<PermissionDTO> permissions;
                    try
                    {
                        permissions = mediator.Send(new GetPermissionQuery()).Result;
                    }
                    catch (Exception ex)
                    {
                        permissions = new List<PermissionDTO>();
                        var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                        logger.LogError(ex, "Error getting permissions: {Message}", ex.Message);
                    }

                    foreach (var permission in permissions)
                    {
                        options.AddPolicy(permission.Name, policy =>
                        {
                            policy.Requirements.Add(new PermissionRequirement(permission.Name));
                        });
                    }
                }
            });
        }
        catch (Exception ex)
        {
            using (var serviceProvider = services.BuildServiceProvider())
            {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "Error configuring authorization: {Message}", ex.Message);
            }
            throw;
        }
    }

    static void ConfigureCors(IServiceCollection services)
    {
        try
        {
            services.AddCors(options =>
            {
                options.AddPolicy("DevelopmentCorsPolicy", builder =>
                {
                    builder
              .WithOrigins("http://localhost:3000")  // Specify exact origin
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
                });

                options.AddPolicy("ProductionCorsPolicy", builder =>
                {
                    builder.WithOrigins(
                            "http://10.0.10.153", "https://10.0.10.153",
                            "http://197.254.33.227", "https://197.254.33.227",
                            "http://localhost", "https://localhost",
                            "http://localhost:3000/", "http://10.0.10.153:3000", "http://10.0.11.90:3000"
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });
        }
        catch (Exception ex)
        {
            using (var serviceProvider = services.BuildServiceProvider())
            {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "Error configuring CORS: {Message}", ex.Message);
            }
            throw;
        }
    }

    static void ConfigureDatabase(IServiceCollection services, IConfiguration configuration, IWebHostEnvironment env)
    {
        try
        {
            var connectionString = configuration.GetConnectionString("FMSConnection");
            var naftaConnectionString = configuration.GetConnectionString("ATGConnection");

            services.AddIdentity<User, Role>().AddEntityFrameworkStores<GpsdataContext>()
                .AddDefaultTokenProviders();

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("FMS Connection string is empty.");
            }

            services.AddDbContext<GpsdataContext>(options =>
            {
                options.UseMySql(
                    connectionString,
                    new MySqlServerVersion(new Version(5, 5, 61))
                )
                .EnableDetailedErrors()
                .EnableSensitiveDataLogging()
                .LogTo(Console.WriteLine, LogLevel.Trace); //chatgpt: Changed LogLevel to Trace for more details.
            },
         ServiceLifetime.Scoped);

            if (!string.IsNullOrEmpty(naftaConnectionString))
            {
                services.AddDbContext<NaftaContext>(options =>
                    options.UseMySQL(naftaConnectionString));
            }
            else
            {
                throw new InvalidOperationException("Nafta Connection string is empty.");
            }

            // services.ConfigureReportingServices(config =>
            // {
            //     if (env.IsDevelopment())
            //     {
            //         config.UseDevelopmentMode();
            //     }
            //     config.ConfigureReportDesigner(designerConfig =>
            //     {
            //      //   designerConfig.RegisterDataSourceWizardConfigFileConnectionStringsProvider();
            //     });
            //     config.ConfigureWebDocumentViewer(viewerConfig =>
            //     {
            //        // viewerConfig.UseCachedReportSourceBuilder();
            //       //  viewerConfig.UseDbStorage(connectionString);
            //     });
            // });
        }
        catch (Exception ex)
        {
            using (var serviceProvider = services.BuildServiceProvider())
            {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "Error configuring database: {Message}", ex.Message);
            }
            throw;
        }
    }

    static void ConfigureApp(WebApplication app, IWebHostEnvironment env)
    {
        app.UseRouting();

        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
            app.UseCors("DevelopmentCorsPolicy");
        }
        else
        {

            app.UseCors("ProductionCorsPolicy");
        }

        app.Use(async (context, next) =>
        {
            Console.WriteLine($"Request Path: {context.Request.Path}");
            Console.WriteLine($"Request Method: {context.Request.Method}");
            await next();
            Console.WriteLine($"Response Status Code: {context.Response.StatusCode}");
        });
        app.UseHttpsRedirection();
        app.UseMiddleware<UserActivityMiddleware>();

        app.UseAuthentication();
        app.UseAuthorization();

        //app.UseDevExpressControls();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
            endpoints.MapHub<FrontEndHub>("/signalHub");
        });
    }
}