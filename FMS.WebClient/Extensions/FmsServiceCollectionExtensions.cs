/**
 * File: FmsServiceCollectionExtensions.cs
 * Purpose: Centralized dependency injection registration for FMS WebClient.
 * Dependencies: ASP.NET Core DI, FMS services, background services, MediatR
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - AddFmsCore(): Registers core framework, infrastructure, and app services
 * - AddFmsAuthentication(): Registers JWT auth and permission policies
 * - AddFmsDatabase(): Registers EF Core DbContext and Identity
 */

using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoMapper;
using FMS.Application.MappingProfile;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using FMS.BackgroundServices.TankReconciliation; // Unified Tank Reconciliation Service
using FMS.BackgroundServices.Notification; // Unified Notification Processing Service
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FMS.Application.Common;
using FMS.Application.Configuration;
using FMS.Application.CommonInterface; // For IPermissionAuthorizationService
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Application.Features.GPSGate.Queries;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using FMS.Application.Features.Reporting.Services;
using StackExchange.Redis;
using System.Text;
using FMS.Application.Infrastructure.Services.Authentication;
using FMS.Application.Infrastructure.Authorization;
using FMS.Application.Services.Dashboard;
using FMS.Application.Services.Dashboard.Extensions; // Dashboard widget services
using FMS.Application.Services;
using FMS.Application.Features.TankManagement.Services;
using FMS.Application.Features.TankManagement.Deliveries.Services;
using FMS.Application.Services.TankStock;
using FMS.Application.Features.TankManagement.DailyTankReconciliation.Queries;
using FMS.BackgroundServices.FMS;
using FMS.Application.Services.Configuration;
using FMS.Application.Services.FMS.BackgroundServices.FMS;
using FMS.WebClient.Services.SignalR;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.Businessfunction;
using FMS.Application.Features.Notification.Services.RecipientResolver;
using FMS.Application.Features.PTSService.Services;
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
using FMS.Application.Communication.Redis;
using FMS.Application.Features.Vehicle.Services;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Infrastructure.Services; // For PermissionAuthorizationService implementation

using FMS.Application.Command.PTSCommand.Common;
// Removed incorrect Tracker namespace import; DeviceConnectionTracker lives directly under FMS.Application.Communication
using FMS.Application.Communication.Connection;
using FMS.Application.PTSServices.PumpService;
using FMS.PTS.WindowsService.Services.Pump;
using Microsoft.Extensions.Diagnostics.HealthChecks;

using FMS.Application.Communication;
using FMS.Application.Validation.PTSValidators;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Application.CommonInterface;
using FMS.Infrastructure.Services;
using FMS.BackgroundServices.VehicleDocumentNotifier;
using FMS.BackgroundServices.VehicleMaintenance;
using FMS.Infrastructure.VehicleTracking.Extensions;
using FMS.Application.Services.Logging;
using FMS.Application.Features.LocationValidation.Extensions;
using FMS.Application.Features.PTS.Extensions;
using FMS.Application.PTSServices.PTSConfigService;
using FMS.BackgroundServices.IssueTracker;

// DevExpress Reporting
using DevExpress.AspNetCore;
using DevExpress.AspNetCore.Reporting;
using DevExpress.XtraReports.Web.Extensions;
using FMS.WebClient.Report;

namespace FMS.WebClient.Extensions;

/// <summary>
/// Centralizes all service registrations so Program.cs stays minimal.
/// </summary>
public static class FmsServiceCollectionExtensions
{
    public static IServiceCollection AddFmsCore(this IServiceCollection services, IConfiguration configuration, IHostEnvironment env)
    {
        // File storage configuration (external writable path for uploads)
        services.Configure<FileStorageSettings>(configuration.GetSection(FileStorageSettings.SectionName));

        // Controllers & JSON
        services.AddControllers().AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            o.JsonSerializerOptions.MaxDepth = 0;
            o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        });

        services.AddHttpContextAccessor();

        // Real-time hubs with CORS support and Redis backplane for cross-process communication
        var redisConn = Environment.GetEnvironmentVariable("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);
        var signalRBuilder = services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = true; // For debugging
            options.MaximumReceiveMessageSize = 102400000; // 100MB
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(60); // Server waits 60s for client ping before disconnect
            options.KeepAliveInterval = TimeSpan.FromSeconds(15); // Server sends keep-alive ping every 15s
            options.HandshakeTimeout = TimeSpan.FromSeconds(15); // Handshake timeout
        })
        .AddJsonProtocol(options =>
        {
            options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.PayloadSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        });

        // Add Redis backplane for cross-process SignalR communication (WebClient ↔ Windows Service)
        if (!string.IsNullOrEmpty(redisConn))
        {
            signalRBuilder.AddStackExchangeRedis(redisConn, options =>
            {
                options.Configuration.ChannelPrefix = "fms-signalr"; // Namespace SignalR channels
            });
            Log.Information("SignalR Redis backplane configured for cross-process communication");
        }
        else
        {
            Log.Warning("SignalR Redis backplane not configured - cross-process hub context will not work");
        }

        RegisterCors(services);
        RegisterMediatR(services);
        RegisterAutoMapper(services);
        RegisterHealthChecks(services);
        RegisterRedis(services);
        RegisterCustom(services, configuration);
        RegisterDistributedCache(services);

        // Register dashboard widget services (factories, coordinators)
        services.AddDashboardWidgetServices();

        // Register vehicle tracking provider infrastructure (Phase 1-4)
        services.AddVehicleTracking();

        // Register DevExpress Reporting services
        RegisterDevExpressReporting(services);

        return services;
    }

    public static IServiceCollection AddFmsAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSecretKey = GetEnvRequired("JwtSettings__SecretKey");
        var jwtIssuer = GetEnvRequired("JwtSettings__Issuer");
        var jwtAudience = GetEnvRequired("JwtSettings__Audience");
        var jwtExpireDays = Environment.GetEnvironmentVariable("JwtSettings__ExpireDays", EnvironmentVariableTarget.Machine) ?? "7";

        services.Configure<JwtSettings>(opt =>
        {
            opt.SecretKey = jwtSecretKey;
            opt.Issuer = jwtIssuer;
            opt.Audience = jwtAudience;
            opt.ExpireDays = int.Parse(jwtExpireDays);
        });

        services.AddAuthentication(o =>
        {
            o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(o =>
        {
            o.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience
            };
            o.Events = new JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    var accessToken = ctx.Request.Query["access_token"]; // SignalR support
                    var path = ctx.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && (path.StartsWithSegments("/dashboardHub") || path.StartsWithSegments("/ptsHub") || path.StartsWithSegments("/frontendHub")))
                    {
                        ctx.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization(options =>
        {
            options.DefaultPolicy = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
                .RequireAuthenticatedUser()
                .Build();
        });

        // Register custom policy provider for permission-based authorization
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        return services;
    }

    public static IServiceCollection AddFmsDatabase(this IServiceCollection services, IConfiguration configuration, IHostEnvironment env)
    {
        var fmsConnectionString = GetEnvRequired("ConnectionStrings__FMSConnection");
        if (!fmsConnectionString.Contains("AllowZeroDateTime") && !fmsConnectionString.Contains("ConvertZeroDateTime"))
        {
            fmsConnectionString += fmsConnectionString.Contains("?") ? "&" : ";";
            fmsConnectionString += "AllowZeroDateTime=True;ConvertZeroDateTime=True";
        }

        // Disambiguate Role between FMS.Domain.Entities.Role and StackExchange.Redis.Role by fully qualifying the domain Role
        services.AddIdentity<User, FMS.Domain.Entities.Role>()
            .AddEntityFrameworkStores<GpsdataContext>()
            .AddDefaultTokenProviders();

        services.AddDbContext<GpsdataContext>(opt =>
        {
            opt.UseMySql(fmsConnectionString, new MySqlServerVersion(new Version(5, 5, 61)), mySql =>
            {
                mySql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
                mySql.CommandTimeout(60);
            })
            .EnableSensitiveDataLogging()
            .LogTo(msg =>
            {
                if (msg.Contains("Executed DbCommand"))
                {
                    Log.Debug("EFCore: {Message}", msg);
                }
            }, LogLevel.Information)
            .EnableDetailedErrors();
        });

        // Register IDbContextFactory for services that need to create independent DbContext instances
        // for parallel operations (prevents "A second operation was started" threading errors)
        services.AddDbContextFactory<GpsdataContext>(opt =>
        {
            opt.UseMySql(fmsConnectionString, new MySqlServerVersion(new Version(5, 5, 61)), mySql =>
            {
                mySql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
                mySql.CommandTimeout(60);
            })
            .EnableDetailedErrors();
        }, ServiceLifetime.Scoped);

        return services;
    }

    private static void RegisterMediatR(IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblies(
            typeof(GetVehicleQuery).Assembly,
            typeof(GetDailyReconciliationReportQuery).Assembly));

        // Register generic ProcessReportQueryHandler for specific DTO types
        // MediatR doesn't auto-register open generic handlers, so we need to close them explicitly
        services.AddTransient<
            IRequestHandler<ProcessReportQuery<RefuelingReportDto>, FMSResponse<ProcessedReportDto<RefuelingReportDto>>>,
            ProcessReportQueryHandler<RefuelingReportDto>>();

        services.AddTransient<
            IRequestHandler<ProcessReportQuery<FuelConsumptionReportDto>, FMSResponse<ProcessedReportDto<FuelConsumptionReportDto>>>,
            ProcessReportQueryHandler<FuelConsumptionReportDto>>();
    }

    private static void RegisterAutoMapper(IServiceCollection services)
    {
        services.AddAutoMapper(typeof(MainMappingProfile).Assembly);
    }

    private static void RegisterCors(IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("DevelopmentCorsPolicy", builder =>
            {
                builder.WithOrigins(
                        "http://localhost:3000",
                        "http://localhost:3001",
                        "http://localhost",
                        "http://10.0.11.90:3000",
                        "http://10.0.11.90:7009",
                        "https://10.0.11.90:7009",
                        "http://127.0.0.1:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
                    .WithExposedHeaders("X-Correlation-ID");
            });

            options.AddPolicy("ProductionCorsPolicy", builder =>
            {
                // Allow specific known origins
                var allowedOrigins = new List<string>
                {
                    // External IP
                    "http://197.254.33.227",
                    "https://197.254.33.227",
                    // Production Server (10.0.10.153)
                    "http://10.0.10.153",
                    "https://10.0.10.153",
                    "http://10.0.10.153:3000",
                    "https://10.0.10.153:3000",
                    "http://10.0.10.153:7009",
                    "https://10.0.10.153:7009",
                    // Development Server (10.0.11.90) - for testing from dev environment
                    "http://10.0.11.90",
                    "https://10.0.11.90",
                    "http://10.0.11.90:3000",
                    "https://10.0.11.90:3000",
                    "http://10.0.11.90:7009",
                    "https://10.0.11.90:7009",
                    // Other production network machines
                    "http://10.0.10.113",
                    "https://10.0.10.113",
                    // Localhost for testing
                    "http://localhost",
                    "http://localhost:3000",
                    "http://localhost:7009"
                };

                builder.WithOrigins(allowedOrigins.ToArray())
                    .SetIsOriginAllowed(origin =>
                    {
                        if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                        {
                            var host = uri.Host;
                            // Allow production subnet (10.0.10.x)
                            if (host.StartsWith("10.0.10."))
                                return true;
                            // Allow development subnet (10.0.11.x) - for cross-testing
                            if (host.StartsWith("10.0.11."))
                                return true;
                            // Allow localhost for testing
                            if (host == "localhost" || host == "127.0.0.1")
                                return true;
                            // Allow external IP
                            if (host == "197.254.33.227")
                                return true;
                            // Check against explicit allowed origins
                            return allowedOrigins.Contains(origin);
                        }
                        return false;
                    })
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
                    .WithExposedHeaders("X-Correlation-ID");
            });
        });
    }

    private static void RegisterHealthChecks(IServiceCollection services)
    {
        services.AddHealthChecks().AddCheck("self", () => HealthCheckResult.Healthy());
    }

    private static void RegisterRedis(IServiceCollection services)
    {
        var redisConn = Environment.GetEnvironmentVariable("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);
        if (!string.IsNullOrEmpty(redisConn))
        {
            services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConn));
            services.AddSingleton(sp => sp.GetRequiredService<IConnectionMultiplexer>().GetDatabase());
            services.AddSingleton<IRedisPublisher, RedisPublisher>();
            services.AddSingleton<IRedisSubscriber, RedisSubscriber>();
            services.AddSingleton<RedisCommandService>();

            // Policy Trigger Service for event-driven reconciliation
            services.AddScoped<IPolicyTriggerService, PolicyTriggerService>();

            Log.Information("Redis services registered (including PolicyTriggerService)");
        }
        else
        {
            Log.Warning("Redis connection not configured - using in-memory fallbacks");

            // Register a null/no-op implementation when Redis is not available
            services.AddScoped<IPolicyTriggerService, NullPolicyTriggerService>();
        }
        services.AddSingleton<FMS.Application.Communication.Tracker.DeviceStatusHelper>();
    }

    private static void RegisterDistributedCache(IServiceCollection services)
    {
        var redisConn = Environment.GetEnvironmentVariable("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);
        if (!string.IsNullOrEmpty(redisConn))
        {
            services.AddStackExchangeRedisCache(o =>
            {
                o.Configuration = redisConn;
                o.InstanceName = "FMS:";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }
    }

    private static void RegisterCustom(IServiceCollection services, IConfiguration configuration)
    {
        // Moved bulk registration from original Program.cs (abbreviated to essentials to keep file lean)
        services.AddMemoryCache();

        // Authorization & Permission Services (database-driven with caching)
        services.AddScoped<IPermissionAuthorizationService, PermissionAuthorizationService>();

        services.AddScoped<IDeviceHttpCommandPusher, DeviceHttpCommandPusher>();
        services.AddSingleton<IPTSConnectionManager, PTSConnectionManager>();
        // Register the device connection tracker (shared Redis-based tracker)
        services.AddSingleton<FMS.Application.Communication.DeviceConnectionTracker>();
        // Register orphaned transaction cleanup service (handles saving transactions on device disconnect)
        services.AddSingleton<FMS.Application.Services.IOrphanedTransactionCleanupService, FMS.Application.Services.OrphanedTransactionCleanupService>();
        // Register SignalR connection monitor for FrontEndHub
        services.AddSingleton<FMS.Application.Communication.SignalR.ConnectionMonitor>();
        services.AddScoped<ISystemUserService, SystemUserService>();
        services.AddScoped<IFileHandlingService, FileHandlingService>();

        // Ensure file storage directory exists at startup
        var fileStorageSettings = configuration.GetSection(FileStorageSettings.SectionName).Get<FileStorageSettings>() ?? new FileStorageSettings();
        try
        {
            if (!Directory.Exists(fileStorageSettings.BasePath))
            {
                Directory.CreateDirectory(fileStorageSettings.BasePath);
                Serilog.Log.Information("Created file storage directory: {Path}", fileStorageSettings.BasePath);
            }
        }
        catch (Exception ex)
        {
            Serilog.Log.Warning(ex, "Could not create file storage directory: {Path}. File uploads may fail.", fileStorageSettings.BasePath);
        }

        // GPSGate Services
        services.AddScoped<FMS.Application.Features.GPSGate.Services.IGPSGateDirectoryService, FMS.Application.Features.GPSGate.Services.GPSGateDirectoryService>();
        services.AddScoped<FMS.Application.Features.GPSGate.Services.IGPSGateReportingService, FMS.Application.Features.GPSGate.Services.GPSGateReportingService>();

        // GPSGate Report Processors
        services.AddScoped<FMS.Application.Features.GPSGate.Processors.FuelConsumptionReportProcessor>();
        services.AddScoped<FMS.Application.Features.GPSGate.Processors.RefuelingReportProcessor>();
        services.AddSingleton<FMS.Application.Features.GPSGate.Processors.IReportProcessorFactory, FMS.Application.Features.GPSGate.Processors.ReportProcessorFactory>();
        services.AddSingleton<IReportDefinitionService, ReportDefinitionService>();
        services.AddScoped<IReportGenerationService, ReportGenerationService>();

        // JsReport PDF/Excel Report Generation Service
        services.AddSingleton<FMS.WebClient.Services.Reporting.IJsReportService, FMS.WebClient.Services.Reporting.JsReportService>();
        services.AddScoped<INotificationReportRenderer, FMS.WebClient.Services.Reporting.NotificationReportRenderer>();
        services.AddScoped<IScheduledReportDeliveryService, ScheduledReportDeliveryService>();

        // GPS Fetch Progress Service (SignalR)
        services.AddScoped<FMS.Application.Communication.SignalR.IGpsFetchProgressService, FMS.Application.Communication.SignalR.GpsFetchProgressService>();

        // Vehicle & GPS Services
        // OLD: Legacy GPSGateService - Now replaced by pluggable vehicle tracking providers (Phase 1-4)
        // services.AddHttpClient<IGPSService, FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService>();
        // services.AddScoped<IGPSService, FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService>();
        // NEW: IVehicleTrackingService registered via AddVehicleTracking() in AddFmsCore
        // Adapter bridges new tracking service to legacy IGPSService interface for backward compatibility
        // Register GPSGateService separately for adapter to use (for GPS information with sensor data)
        services.AddHttpClient<FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService>();
        services.AddScoped<FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService>();
        services.AddScoped<IGPSService, FMS.Infrastructure.VehicleTracking.Adapters.VehicleTrackingServiceAdapter>();

        // Configuration Services
        services.AddScoped<ISystemConfigurationService, SystemConfigurationService>();

        // PTS Services
        services.AddScoped<IServiceControlService, ServiceControlService>();
        services.AddScoped<IPumpService, PumpService>();
        services.AddScoped<IPTSConfigService, PTSConfigService>();
        services.AddScoped<PumpTransactionIntegrationService>();
        services.AddScoped<ICommandExecutor, CommandExecutor>();
        services.AddScoped<ITransactionMonitoringService, TransactionMonitoringService>();
        services.AddScoped<ITransactionCompletionService, TransactionCompletionService>();
        services.AddScoped<IAutoTransactionCompletionService, AutoTransactionCompletionService>();
        services.AddScoped<IDirectHttpTransactionService, DirectHttpTransactionService>();
        services.AddScoped<IDeviceCommunicationService, DeviceCommunicationService>();
        services.AddScoped<IDeviceValidator, DeviceValidator>();

        // Location Validation Services (for proximity-based fueling validation)
        services.AddLocationValidationServices();

        // PTS Authorization Services (validators, pre-checks, transaction context)
        services.AddPtsAuthorizationServices();

        // Communication & Tracking Services
        services.AddScoped<IPendingCommandRepository, PendingCommandsRepository>();
        services.AddScoped<IAuthorizationStateTracker, AuthorizationStateTracker>();

        // Tank Management Services
        services.AddScoped<ITankVolumeHistoryDeletionService, TankVolumeHistoryDeletionService>();
        services.AddScoped<IPumpTankTransferService, PumpTankTransferService>(); //Cursor: Add pump tank transfer service
        services.AddScoped<TankStockReconciliationService>(); // Tank Stock reconciliation service

        // ========== UNIFIED BACKGROUND SERVICES (consolidated from multiple services) ==========
        // Unified Tank Reconciliation Service - combines:
        // - TankMonitoringService (tank level monitoring every 5 min)
        // - AutomatedReconciliationBackgroundService (policy-based reconciliation every 15 min)
        // - DailyTankReconciliationService (daily aggregation at 12:00 AM and reconciliation at 2:00 AM)
        services.AddHostedService<FMS.BackgroundServices.TankReconciliation.UnifiedTankReconciliationService>();

        // Unified Notification Processing Service - combines:
        // - NotificationBackgroundService (scheduled notifications every 1 min, alarm checks every 5 min)
        // - ActiveAlarmProcessingService (auto-resolution and escalation every 5 min)
        services.AddHostedService<FMS.BackgroundServices.Notification.UnifiedNotificationProcessingService>();

        // Other Background Services
        services.AddHostedService<SystemUserInitializationService>();
        services.AddHostedService<VehicleDocumentExpiryNotifierService>();
        services.AddHostedService<VehicleMaintenanceNotifierService>();
        // DEAD CODE: OdometerSyncBackgroundService temporarily disabled (2026-01-28)
        // services.AddHostedService<FMS.BackgroundServices.VehicleMaintenance.OdometerSyncBackgroundService>();
        services.AddHostedService<FMS.BackgroundServices.Dashboard.LiveDataBroadcastService>();

        // Tank measurement real-time broadcast (FrontEndHub)
        services.AddHostedService<TankMeasurementBroadcastService>();

        // GPSGate Vehicle Location Tag Monitoring Service - monitors vehicle tags at 8:00 AM daily
        services.AddHostedService<GPSGateVehicleLocationTagMonitoringService>();

        // GPSGate RabbitMQ Consumer - Real-time vehicle tracking via RabbitMQ → SignalR
        // Consumes GPS position updates from GPSGate and broadcasts to connected clients
        // DISABLED: RabbitMQ vehicle tracking temporarily disabled (2026-01-28)
        // Uncomment the line below to re-enable real-time vehicle tracking via RabbitMQ
        // services.AddHostedService<FMS.BackgroundServices.VehicleTracking.GPSGateRabbitMQConsumerService>();

        // Issue Tracker V2 Background Services (includes checker factory + checkers)
        services.AddIssueTrackerBackgroundServices();

        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ISmsService, SmsService>();
        services.AddScoped<INotificationService, NotificationService>();
        // Issue Tracker Activity Service
        services.AddScoped<FMS.Application.Features.IssueTracker.Services.IIssueActivityService, FMS.Application.Features.IssueTracker.Services.IssueActivityService>();
        // Issue Tracker Attachment Storage Service
        services.AddScoped<FMS.Application.Features.IssueTracker.Services.IIssueAttachmentStorageService, FMS.Application.Features.IssueTracker.Services.IssueAttachmentStorageService>();
        // Push notification service for mobile/web push
        services.AddScoped<FMS.Application.Features.Notification.Services.DeliveryChannel.IPushNotificationService, FMS.Application.Features.Notification.Services.DeliveryChannel.PushNotificationService>();
        // Real-time notification abstraction
        services.AddScoped<FMS.Application.Infrastructure.Communication.SignalR.ISignalRNotificationService, FMS.Application.Infrastructure.Communication.SignalR.SignalRNotificationService>();
        services.AddScoped<INotificationRecipientResolver, NotificationRecipientResolver>();
        services.AddScoped<IBusinessFunctionNotificationService, BusinessFunctionNotificationService>();
        services.AddScoped<FMS.Application.Features.Notification.Services.Groups.INotificationGroupService, FMS.Application.Features.Notification.Services.Groups.NotificationGroupService>();
        services.AddSingleton<ICategoryMetadataProvider, InMemoryCategoryMetadataProvider>();

        // ========== EVENT EXPRESSION ENGINE (Phase 1) ==========
        services.AddSingleton<FMS.Application.Features.EventEngine.Expressions.ExpressionEvaluatorFactory>();
        services.AddScoped<FMS.Application.Features.EventEngine.Expressions.ExpressionCooldownService>();
        services.AddScoped<FMS.Application.Features.EventEngine.Engine.IEventExpressionEngine, FMS.Application.Features.EventEngine.Engine.EventExpressionEngine>();
        services.AddScoped<FMS.Application.Features.EventEngine.Engine.EventLogService>();
        // Alert Configuration Service — cached, typed access to configurable alert thresholds
        services.AddScoped<FMS.Application.Features.Notification.Services.AlertConfiguration.IAlertConfigurationService, FMS.Application.Features.Notification.Services.AlertConfiguration.AlertConfigurationService>();
        // IWidgetFactoryService and WidgetFactoryCoordinator now registered via AddDashboardWidgetServices()
        services.AddScoped<FMS.Application.Services.Dashboard.IWidgetTemplateSeeder, FMS.Application.Services.Dashboard.WidgetTemplateSeeder>();
        services.AddScoped<IDataSourceManager, DataSourceManager>();
        services.AddScoped<IMetricCalculationService, MetricCalculationService>();
        services.AddScoped<IWidgetDataTransformerService, WidgetDataTransformerService>();
        services.AddScoped<ITimeSeriesDataService, TimeSeriesDataService>();
        services.AddScoped<IDataSourceMetadataService, DataSourceMetadataService>();
        // Tank Management Services
        services.AddScoped<InventoryCostingService>();
        services.AddScoped<FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand.TankVolumeHistoryIntegrationService>();
        services.AddScoped<IInTankDeliveryDetectionService, InTankDeliveryDetectionService>();
        services.AddScoped<TankStockFutureRecordsService>();
        services.AddScoped<OpeningStockValidationService>();
        services.AddScoped<FMS.Application.Features.TankManagement.BulkImport.Services.BulkImportValidationService>();
        // Data validation and correction services for tank volume history
        services.AddScoped<ITankVolumeHistoryValidationService, TankVolumeHistoryValidationService>();
        services.AddScoped<ITankVolumeCorrectionService, TankVolumeCorrectionService>();
        // Automated reconciliation core + supporting services
        services.AddScoped<FMS.Application.Features.AutomatedReconciliation.Services.PolicyEvaluationEngine>();
        services.AddScoped<FMS.Application.Services.AutomatedReconciliation.DiscrepancyDetectionService>();
        services.AddScoped<FMS.Application.Features.AutomatedReconciliation.Services.ReconciliationOrchestrationService>();
        services.AddScoped<FMS.Application.Features.AutomatedReconciliation.Services.DailyReconciliationPolicyService>();
        services.AddScoped<FMS.Application.Features.AutomatedReconciliation.Services.AutomatedReconciliationService>();
        services.AddHttpClient<DeviceHttpCommandPusher>().SetHandlerLifetime(TimeSpan.FromMinutes(5));

        // GPSGate Services - Use AddHttpClient to properly inject HttpClient for API calls
        services.AddHttpClient<FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services.IGPSGateTracksService, FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services.GPSGateTracksService>();

        // Fuel Audit Services
        services.AddScoped<FMS.Application.Features.FuelAudit.Services.IFuelAuditGPSService, FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services.FuelAuditGPSService>();
        services.AddScoped<FMS.Application.Features.FuelAudit.Services.IFuelAuditTankStockService, FMS.Application.Features.FuelAudit.Services.FuelAuditTankStockService>();
        services.AddScoped<FMS.Application.Features.FuelAudit.Services.IFuelAuditCalculationService, FMS.Application.Features.FuelAudit.Services.FuelAuditCalculationService>();
        services.AddScoped<FMS.Application.Features.FuelAudit.Services.IFullTankEstimationService, FMS.Application.Features.FuelAudit.Services.FullTankEstimationService>();

        // Fueling Rules Services
        services.AddScoped<FMS.Application.Features.FuelTagManagement.FuelingRules.Services.IFuelingRuleEvaluationService, FMS.Application.Features.FuelTagManagement.FuelingRules.Services.FuelingRuleEvaluationService>();

        // Location Bypass Notification Service (SignalR broadcast for bypass status changes)
        services.AddScoped<FMS.Application.Features.Geofence.Services.ILocationBypassNotificationService, FMS.Application.Features.Geofence.Services.LocationBypassNotificationService>();

        // Location Bypass Monitor Background Service (auto-expires bypasses and notifies clients via SignalR)
        services.AddHostedService<LocationBypassMonitorService>();

        // Vehicle Site Auto-Assignment Service (auto-assigns vehicles to sites based on refueling patterns)
        services.AddScoped<FMS.Application.Features.Vehicle.Services.IVehicleSiteAutoAssignmentService, FMS.Application.Features.Vehicle.Services.VehicleSiteAutoAssignmentService>();

        // Vehicle GPS Offline Alert Service (alerts when vehicles with GPS are fueled while offline)
        services.AddScoped<FMS.Application.Features.Vehicle.Services.IVehicleGpsOfflineAlertService, FMS.Application.Features.Vehicle.Services.VehicleGpsOfflineAlertService>();

        // Log Management Services
        services.AddScoped<ILogCleanupService, LogCleanupService>();
        services.AddHostedService<LogCleanupBackgroundService>();
    }

    private static string GetEnvRequired(string key)
    {
        return Environment.GetEnvironmentVariable(key, EnvironmentVariableTarget.Machine) ?? throw new InvalidOperationException($"Missing environment variable: {key}");
    }

    /// <summary>
    /// Registers DevExpress Reporting services for Report Viewer and Report Designer.
    /// </summary>
    private static void RegisterDevExpressReporting(IServiceCollection services)
    {
        // Get connection string for DevExpress Report Designer data sources
        var fmsConnectionString = GetEnvRequired("ConnectionStrings__FMSConnection");
        if (!fmsConnectionString.Contains("AllowZeroDateTime") && !fmsConnectionString.Contains("ConvertZeroDateTime"))
        {
            fmsConnectionString += fmsConnectionString.Contains("?") ? "&" : ";";
            fmsConnectionString += "AllowZeroDateTime=True;ConvertZeroDateTime=True";
        }

        // Add DevExpress controls support - this registers all required services including:
        // - IWebDocumentViewerMvcControllerService
        // - IReportDesignerMvcControllerService
        // - IQueryBuilderMvcControllerService
        services.AddDevExpressControls();

        // Configure DevExpress Reporting services with custom routes
        services.ConfigureReportingServices(configurator =>
        {
            // Enable development mode for troubleshooting and verbose error messages
            configurator.UseDevelopmentMode();

            // Configure the Report Designer route
            configurator.ConfigureReportDesigner(designerConfigurator =>
            {
                // Intentionally rely on DefaultConnectionStringProvider (single FMSConnection)
            });

            // Configure the Web Document Viewer route
            configurator.ConfigureWebDocumentViewer(viewerConfigurator =>
            {
                viewerConfigurator.UseCachedReportSourceBuilder();
            });
        });

        // Register default connection string provider for DevExpress Report Designer
        // This provides connection strings for the Query Builder and data source wizard
        DevExpress.DataAccess.DefaultConnectionStringProvider.AssignConnectionStrings(() =>
            new Dictionary<string, string>
            {
                { "FMSConnection", fmsConnectionString }
            });

        // Configure report storage to use database
        services.AddScoped<ReportStorageWebExtension, ReportStorageService>();

        // Add MVC with Views for DevExpress Reporting controllers
        // DevExpress controllers inherit from Controller (not ControllerBase) and need full MVC
        services.AddControllersWithViews();

        Log.Information("DevExpress Reporting services registered with FMS data connection");
    }
}
