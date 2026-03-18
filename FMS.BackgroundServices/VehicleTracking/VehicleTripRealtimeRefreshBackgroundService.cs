/**
 * File: VehicleTripRealtimeRefreshBackgroundService.cs
 * Purpose: Periodically refreshes current-day trip data so in-progress trips remain available without manual recompute.
 * Dependencies: IServiceScopeFactory, GpsdataContext, IVehicleTripOrchestrationService.
 * Last Modified: 2026-03-11
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.VehicleTracking;

public class VehicleTripRealtimeRefreshBackgroundService : BackgroundService
{
    private static readonly TimeSpan InitialDelay = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan RefreshInterval = TimeSpan.FromMinutes(5);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VehicleTripRealtimeRefreshBackgroundService> _logger;

    public VehicleTripRealtimeRefreshBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<VehicleTripRealtimeRefreshBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("VehicleTripRealtimeRefreshBackgroundService started. Refresh interval: {Interval}", RefreshInterval);

        try
        {
            await Task.Delay(InitialDelay, stoppingToken);
        }
        catch (TaskCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCycleAsync(stoppingToken);
            }
            catch (TaskCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in VehicleTripRealtimeRefreshBackgroundService.");
            }

            try
            {
                await Task.Delay(RefreshInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("VehicleTripRealtimeRefreshBackgroundService stopped.");
    }

    private async Task RunCycleAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
        var orchestrationService = scope.ServiceProvider.GetRequiredService<IVehicleTripOrchestrationService>();

        var fromUtc = DateTime.UtcNow.Date;
        var toUtc = DateTime.UtcNow;

        var vehicleIds = await context.Vehicles
            .AsNoTracking()
            .Where(vehicle => vehicle.MovementProfile != VehicleMovementProfile.Undefined)
            .Select(vehicle => vehicle.VehicleId)
            .ToListAsync(cancellationToken);

        var refreshedVehicles = 0;
        foreach (var vehicleId in vehicleIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var response = await orchestrationService.RecomputeVehicleTripsAsync(vehicleId, fromUtc, toUtc, cancellationToken);
            if (response.IsSuccess)
            {
                refreshedVehicles++;
            }
        }

        if (refreshedVehicles > 0)
        {
            _logger.LogInformation("Realtime trip refresh cycle updated {VehicleCount} vehicle(s).", refreshedVehicles);
        }
    }
}
