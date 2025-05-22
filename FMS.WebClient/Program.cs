using System;
using System.Collections.Concurrent;
using System.Net;
using System.Reflection;
using System.Security.Cryptography.Xml;
using System.Text;
using System.Text.Json.Serialization;
using AutoMapper;
using FMS.Application;
using FMS.Application.Command.DatabaseCommand.Common;
using FMS.Application.Command.DatabaseCommand.TagCmd;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.Redis;
using FMS.Application.Communication.SignalR;
using FMS.Application.Communication.Tracker;
using FMS.Application.Handlers;
using FMS.Application.Handlers.Interface;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Infrastructure.Services.Authentication;
using FMS.Application.MappingProfile;
using FMS.Application.ModelsDTOs.FMS.UserManagement;
using FMS.Application.PTSServices.Configuration;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using FMS.Application.Queries.GPSGATEServer.GetconsumptionReport;
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

namespace FMS.WebClient;

public class Program {
    public static void Main (string[] args) {
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

        int httpPort = 7009; // Default port
        int httpsPort = 7010; // Default HTTPS port
        bool httpPortInUse = IsPortInUse (7009);
        bool httpsPortInUse = IsPortInUse (7010);

        if (httpPortInUse || httpsPortInUse) {
            Log.Warning ($"Default ports are already in use. HTTP port in use: {httpPortInUse}, HTTPS port in use: {httpsPortInUse}");

            // Start looking from higher ports
            int basePort = 7020;
            while (IsPortInUse (basePort) || IsPortInUse (basePort + 1)) {
                basePort += 10;
                if (basePort > 8000) {
                    throw new InvalidOperationException ("Unable to find available ports in the range 7020-8000");
                }
            }

            httpPort = basePort;
            httpsPort = basePort + 1;
            Log.Information ($"Found available ports: HTTP on {httpPort}, HTTPS on {httpsPort}");
        }

        // Configure Kestrel with the selected ports
        builder.WebHost.ConfigureKestrel (serverOptions => {
            // Use explicit IPAddress.Loopback instead of ListenLocalhost
            serverOptions.Listen (IPAddress.Any, httpPort);
            serverOptions.Listen (IPAddress.Any, httpsPort, listenOptions => {
                //  listenOptions.UseHttps();
            });
        });
        var app = builder.Build ();
        ConfigureApp (app, builder.Environment);

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

    private static bool IsPortInUse (int port) {
        try {
            using var socket = new System.Net.Sockets.Socket (
                System.Net.Sockets.AddressFamily.InterNetwork,
                System.Net.Sockets.SocketType.Stream,
                System.Net.Sockets.ProtocolType.Tcp);

            socket.Bind (new System.Net.IPEndPoint (System.Net.IPAddress.Loopback, port));
            return false; // Port is available
        } catch {
            return true; // Port is in use
        }
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

    static void ConfigureServices (IServiceCollection services, IConfiguration configuration) {
        try {
            services.AddControllers ()
                .AddJsonOptions (options => {
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.MaxDepth = 0;
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
                services.AddSignalR ();
            } else {
                Console.WriteLine ("Redis connection string is missing, using in-memory for SignalR");
                services.AddSignalR ();
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

        // services.AddScoped<IWebDocumentViewerMvcControllerService, WebDocumentViewerMvcControllerService>();
        // services.AddScoped<IReportDesignerMvcControllerService, ReportDesignerMvcControllerService>();

        services.AddScoped<ICommandExecutor, CommandExecutor> ();
        // services.AddScoped<ReportStorageWebExtension, ReportStorageService>();
        services.AddHttpClient<DeviceHttpCommandPusher> ().SetHandlerLifetime (TimeSpan.FromMinutes (5));
        services.AddScoped<IConfigurationService, ConfigurationService> ();

        services.Scan (scan =>
            scan.FromAssemblyOf<UploadStatusHandler> ()
            .AddClasses (classes => classes.AssignableTo<IPacketHandler> ())
            .AsSelf ()
            .AsImplementedInterfaces ()
            .WithScopedLifetime ()
        );
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
                };
            });
        // Temporarily commenting out the JWT Generator registration
        // services.AddScoped<IJwtGenerator, JwtGenerator> ();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator> ();
    }

    static void ConfigureAuthorization (IServiceCollection services) {
        try {
            // services.AddAuthorization(options =>
            // {
            //     // Configure policy-based authorization with requirements
            //     options.AddPolicy(
            //         "RequireAdminRole",
            //         policy => policy.RequireRole("Admin")
            //     );
            // });
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
                                "http://127.0.0.1:3000"
                            ) // Added both localhost and 127.0.0.1
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
                                "http://10.0.10.153",
                                "https://10.0.10.153",
                                "http://10.0.10.153:3000",
                                "https://10.0.10.153:3000",
                                "http://10.0.10.113",
                                "https://10.0.10.113",
                                "http://10.0.10.113:3000",
                                "https://10.0.10.113:3000",
                                "http://10.0.11.90",
                                "https://10.0.11.90",
                                "http://10.0.11.90:3000"
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
                            new MySqlServerVersion (new Version (5, 5, 61))
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

    static void ConfigureApp (WebApplication app, IWebHostEnvironment env) {
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

            // Add CORS headers for error responses
            if (context.Response.StatusCode >= 400) {
                if (!context.Response.Headers.ContainsKey ("Access-Control-Allow-Origin")) {
                    context.Response.Headers.Append ("Access-Control-Allow-Origin",
                        context.Request.Headers["Origin"].ToString ());
                    context.Response.Headers.Append ("Access-Control-Allow-Credentials", "true");
                    context.Response.Headers.Append ("Access-Control-Allow-Headers", "*");
                    context.Response.Headers.Append ("Access-Control-Allow-Methods", "*");
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
            endpoints.MapHub<FrontEndHub> ("/signalHub");
        });
    }
}