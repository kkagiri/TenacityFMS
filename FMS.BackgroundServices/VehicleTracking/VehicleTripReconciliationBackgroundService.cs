/**
 * File: VehicleTripReconciliationBackgroundService.cs
 * Purpose: Runs scheduled end-of-day reconciliation for vehicle trips after a configurable local run time.
 * Dependencies: IServiceScopeFactory, GpsdataContext, ISystemConfigurationService, IVehicleTripReconciliationService.
 * Last Modified: 2026-03-11
 */
using System;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Application.Services.Configuration;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.VehicleTracking;

public class VehicleTripReconciliationBackgroundService : BackgroundService
{
    private const string ReconciliationEnabledKey = "VehicleTrips.Reconciliation.Enabled";
    private const string ReconciliationRunTimeLocalKey = "VehicleTrips.Reconciliation.DailyRunTimeLocal";
    private const string ReconciliationLookbackDaysKey = "VehicleTrips.Reconciliation.LookbackDays";
    private static readonly TimeSpan DisabledPollInterval = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan DefaultDailyRunTimeLocal = TimeSpan.FromMinutes(30);
    private const int DefaultLookbackDays = 1;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VehicleTripReconciliationBackgroundService> _logger;

    public VehicleTripReconciliationBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<VehicleTripReconciliationBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("VehicleTripReconciliationBackgroundService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var settings = await LoadSettingsAsync(stoppingToken);
                if (!settings.IsEnabled)
                {
                    _logger.LogDebug("Vehicle trip reconciliation background service is disabled by configuration.");
                    await Task.Delay(DisabledPollInterval, stoppingToken);
                    continue;
                }

                var delay = CalculateDelayUntilNextRun(settings.DailyRunTimeLocal);
                _logger.LogInformation(
                    "Vehicle trip reconciliation background service waiting {Delay} until next run at local time {RunTime}.",
                    delay,
                    settings.DailyRunTimeLocal);

                await Task.Delay(delay, stoppingToken);
                await RunCycleAsync(settings.LookbackDays, stoppingToken);
            }
            catch (TaskCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in VehicleTripReconciliationBackgroundService.");
            }
        }

        _logger.LogInformation("VehicleTripReconciliationBackgroundService stopped.");
    }

    private async Task<(bool IsEnabled, TimeSpan DailyRunTimeLocal, int LookbackDays)> LoadSettingsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var configurationService = scope.ServiceProvider.GetRequiredService<ISystemConfigurationService>();

        var isEnabled = await configurationService.GetBoolAsync(ReconciliationEnabledKey, true, cancellationToken);
        var configuredRunTime = await configurationService.GetConfigurationValueAsync(ReconciliationRunTimeLocalKey, cancellationToken);
        var lookbackDays = await configurationService.GetIntAsync(ReconciliationLookbackDaysKey, DefaultLookbackDays, cancellationToken);

        return (isEnabled, ParseDailyRunTimeLocal(configuredRunTime), lookbackDays <= 0 ? DefaultLookbackDays : lookbackDays);
    }

    private static TimeSpan CalculateDelayUntilNextRun(TimeSpan runTimeLocal)
    {
        var nowLocal = DateTime.Now;
        var nextRunLocal = nowLocal.Date.Add(runTimeLocal);
        if (nextRunLocal <= nowLocal)
        {
            nextRunLocal = nextRunLocal.AddDays(1);
        }

        return nextRunLocal - nowLocal;
    }

    private TimeSpan ParseDailyRunTimeLocal(string? configuredRunTime)
    {
        if (!string.IsNullOrWhiteSpace(configuredRunTime)
            && TimeSpan.TryParseExact(
                configuredRunTime,
                new[] { @"hh\:mm", @"h\:mm", @"hh\:mm\:ss", @"h\:mm\:ss" },
                CultureInfo.InvariantCulture,
                out var parsedRunTime)
            && parsedRunTime >= TimeSpan.Zero
            && parsedRunTime < TimeSpan.FromDays(1))
        {
            return parsedRunTime;
        }

        if (!string.IsNullOrWhiteSpace(configuredRunTime))
        {
            _logger.LogWarning(
                "Invalid vehicle trip reconciliation run time '{RunTime}'. Falling back to default {DefaultRunTime}.",
                configuredRunTime,
                DefaultDailyRunTimeLocal);
        }

        return DefaultDailyRunTimeLocal;
    }

    private async Task RunCycleAsync(int lookbackDays, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
        var reconciliationService = scope.ServiceProvider.GetRequiredService<IVehicleTripReconciliationService>();
        var targetDayLocal = DateTime.Today.AddDays(-lookbackDays);
        var fromUtc = targetDayLocal.ToUniversalTime();
        var toUtc = targetDayLocal.AddDays(1).ToUniversalTime();

        var vehicleIds = await context.VehicleTripGroups
            .AsNoTracking()
            .Where(group => group.StartTimeUtc < toUtc && group.EndTimeUtc >= fromUtc)
            .Select(group => group.VehicleId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (vehicleIds.Count == 0)
        {
            _logger.LogInformation(
                "Vehicle trip reconciliation background cycle found no persisted groups for local date {TargetDate}.",
                targetDayLocal.Date);
            return;
        }

        foreach (var vehicleId in vehicleIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var result = await reconciliationService.ReconcileVehicleTripsAsync(vehicleId, fromUtc, toUtc, previewOnly: false, cancellationToken);
            if (!result.IsSuccess)
            {
                _logger.LogWarning(
                    "Vehicle trip reconciliation background cycle failed for vehicle {VehicleId}: {Message}",
                    vehicleId,
                    result.Message);
            }
        }

        _logger.LogInformation(
            "Vehicle trip reconciliation background cycle processed {VehicleCount} vehicle(s) for local date {TargetDate}.",
            vehicleIds.Count,
            targetDayLocal.Date);
    }
}
