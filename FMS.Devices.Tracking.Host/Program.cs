/*
 * File:          Program.cs
 * Purpose:       Starts the standalone tracking device host for provider health and GPSGate RabbitMQ channels.
 * Dependencies:  Host builder, EF Core, DeviceCore, Tracking providers
 * Last Modified: 2026-04-30
 *
 * Key Functions:
 * - Main(): Composes the tracking host service container and runs the worker process.
 */
using FMS.Application.Communication.SignalR;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Core.DependencyInjection;
using FMS.Devices.Tracking.Host;
using FMS.Devices.Tracking.DependencyInjection;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.Local.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

var connectionString = ResolveFmsConnectionString(builder.Configuration);

builder.Services.AddSingleton<ITenantScope, SystemTenantScope>();
builder.Services.AddSignalR();

builder.Services.AddDbContext<GpsdataContext>(options =>
{
    options.UseNpgsql(connectionString, npg =>
        {
            npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
            npg.CommandTimeout(60);
        })
        .UseSnakeCaseNamingConvention()
        .EnableDetailedErrors();
});

builder.Services.AddDbContextFactory<GpsdataContext>(options =>
{
    options.UseNpgsql(connectionString, npg =>
        {
            npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
            npg.CommandTimeout(60);
        })
        .UseSnakeCaseNamingConvention()
        .EnableDetailedErrors();
}, ServiceLifetime.Scoped);

builder.Services
    .AddDeviceCore()
    .AddTrackingProviders(options =>
    {
        options.EnableGpsGateRabbitMqConsumer = builder.Configuration.GetValue(
            "Tracking:EnableGpsGateRabbitMqConsumer",
            true);
    });

await builder.Build().RunAsync();

static string ResolveFmsConnectionString(IConfiguration configuration)
{
    var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__FMSConnection", EnvironmentVariableTarget.Machine)
        ?? Environment.GetEnvironmentVariable("ConnectionStrings__FMSConnection")
        ?? configuration.GetConnectionString("FMSConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("FMS tracking host requires ConnectionStrings__FMSConnection or ConnectionStrings:FMSConnection.");
    }

    return connectionString;
}
