using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleMaintenance.Events;

/// <summary>
/// Handles the VehicleOdometerUpdatedEvent to:
/// 1. Update the vehicle's CurrentPhysicalReading if needed
/// 2. Optionally sync to GPS
/// 3. Update any maintenance records that track odometer-based schedules
/// </summary>
public class VehicleOdometerUpdatedEventHandler : INotificationHandler<VehicleOdometerUpdatedEvent>
{
    private readonly GpsdataContext _context;
    private readonly IOdometerSyncService _odometerSyncService;
    private readonly ILogger<VehicleOdometerUpdatedEventHandler> _logger;

    public VehicleOdometerUpdatedEventHandler(
        GpsdataContext context,
        IOdometerSyncService odometerSyncService,
        ILogger<VehicleOdometerUpdatedEventHandler> logger)
    {
        _context = context;
        _odometerSyncService = odometerSyncService;
        _logger = logger;
    }

    public async Task Handle(VehicleOdometerUpdatedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                $"Handling odometer update for vehicle {notification.VehicleId}: {notification.OldReading} → {notification.NewReading} (source: {notification.Source})");

            // Update the vehicle's current physical reading if the new value is higher
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == notification.VehicleId, cancellationToken);

            if (vehicle != null)
            {
                var currentReading = decimal.TryParse(vehicle.CurrentPhysicalReading, out var current) ? current : 0;

                // Only update if new reading is higher (odometer/hours can only go up)
                if (notification.NewReading > currentReading)
                {
                    vehicle.CurrentPhysicalReading = notification.NewReading.ToString("F2");
                    vehicle.DateModified = DateTime.UtcNow;

                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation($"Updated vehicle {notification.VehicleId} physical reading to {notification.NewReading}");
                }
            }

            // Sync to GPS if requested
            if (notification.ShouldSyncToGPS)
            {
                try
                {
                    var syncResult = await _odometerSyncService.SyncOdometerToGPSAsync(notification.VehicleId, cancellationToken);
                    if (syncResult.IsSuccess && syncResult.Data?.Success == true)
                    {
                        _logger.LogInformation($"Synced odometer to GPS for vehicle {notification.VehicleId}");
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to sync odometer to GPS for vehicle {notification.VehicleId}: {syncResult.Message}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error syncing odometer to GPS for vehicle {notification.VehicleId}");
                    // Don't rethrow - GPS sync failure shouldn't fail the main operation
                }
            }

            // Check if any maintenance schedules need to be updated based on odometer
            await UpdateMaintenanceSchedulesAsync(notification.VehicleId, notification.NewReading, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error handling odometer update event for vehicle {notification.VehicleId}");
            // Don't rethrow - event handlers shouldn't fail silently but also shouldn't break the main flow
        }
    }

    /// <summary>
    /// Check and update maintenance schedules that are odometer-based
    /// </summary>
    private async Task UpdateMaintenanceSchedulesAsync(int vehicleId, decimal currentOdometer, CancellationToken cancellationToken)
    {
        // Find maintenance records that are:
        // 1. Active (Scheduled or In Progress)
        // 2. Have an odometer-based due threshold
        // 3. Are approaching or past due
        var maintenanceRecords = await _context.VehicleMaintenances
            .Where(m => m.VehicleId == vehicleId)
            .Where(m => m.Status == "Scheduled" || m.Status == "In Progress")
            .Where(m => m.NextDueOdometer.HasValue)
            .ToListAsync(cancellationToken);

        foreach (var maintenance in maintenanceRecords)
        {
            if (!maintenance.NextDueOdometer.HasValue) continue;

            // Calculate how far from due
            var distanceFromDue = maintenance.NextDueOdometer.Value - currentOdometer;

            // Mark as overdue if past due
            if (distanceFromDue < 0 && !maintenance.IsOverdue)
            {
                maintenance.IsOverdue = true;
                maintenance.DateModified = DateTime.UtcNow;
                _logger.LogWarning(
                    $"Maintenance ID {maintenance.MaintenanceId} for vehicle {vehicleId} is now overdue (current: {currentOdometer}, due: {maintenance.NextDueOdometer})");
            }
        }

        if (maintenanceRecords.Any(m => m.IsOverdue))
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
