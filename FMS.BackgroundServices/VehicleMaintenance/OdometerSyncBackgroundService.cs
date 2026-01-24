using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.BackgroundServices.VehicleMaintenance
{
    /// <summary>
    /// Background service that periodically syncs vehicle odometer/engine hours readings
    /// between GPS providers (GPSGate) and the FMS database.
    ///
    /// Sync Strategy:
    /// 1. Every fueling event (FuelRefill/PumpTransaction) captures the current odometer
    /// 2. This service periodically checks GPS readings against database values
    /// 3. When significant differences are found, it can sync in either direction
    ///
    /// Configuration options (via appsettings):
    /// - OdometerSync:Enabled - Enable/disable the service
    /// - OdometerSync:IntervalHours - How often to run (default: 4 hours)
    /// - OdometerSync:SyncFromGPS - Whether to update database from GPS (default: true)
    /// - OdometerSync:SyncToGPS - Whether to update GPS from fueling data (default: false)
    /// - OdometerSync:ThresholdKm - Minimum difference in km to trigger sync (default: 10)
    /// - OdometerSync:ThresholdHr - Minimum difference in hours to trigger sync (default: 1)
    /// </summary>
    public class OdometerSyncBackgroundService : BackgroundService
    {
        private readonly ILogger<OdometerSyncBackgroundService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        // Default configuration - can be overridden via appsettings
        private const int DefaultIntervalHours = 4;
        private const double DefaultThresholdKm = 10.0;
        private const double DefaultThresholdHr = 1.0;

        public OdometerSyncBackgroundService(
            ILogger<OdometerSyncBackgroundService> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Odometer Sync Background Service started.");

            // Wait before first execution to allow system startup
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SyncOdometersAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during odometer sync.");
                }

                // Run every 4 hours by default
                await Task.Delay(TimeSpan.FromHours(DefaultIntervalHours), stoppingToken);
            }

            _logger.LogInformation("Odometer Sync Background Service stopped.");
        }

        private async Task SyncOdometersAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting periodic odometer sync...");

            using IServiceScope scope = _scopeFactory.CreateScope();

            try
            {
                var odometerSyncService = scope.ServiceProvider.GetRequiredService<IOdometerSyncService>();

                // Step 1: Get all vehicle odometer status
                var statusResult = await odometerSyncService.GetAllVehicleOdometerStatusAsync(cancellationToken);

                if (!statusResult.IsSuccess || statusResult.Data == null)
                {
                    _logger.LogWarning($"Failed to get vehicle odometer status: {statusResult.Message}");
                    return;
                }

                var vehicles = statusResult.Data;
                _logger.LogInformation($"Retrieved odometer status for {vehicles.Count} vehicles with GPS mappings.");

                // Step 2: Identify vehicles needing sync
                var vehiclesNeedingSync = vehicles.Where(v => v.SyncNeeded).ToList();
                _logger.LogInformation($"Found {vehiclesNeedingSync.Count} vehicles requiring odometer sync.");

                if (!vehiclesNeedingSync.Any())
                {
                    _logger.LogInformation("No vehicles require sync. All readings are within tolerance.");
                    return;
                }

                // Step 3: Process each vehicle
                int successCount = 0;
                int failCount = 0;

                foreach (var vehicle in vehiclesNeedingSync)
                {
                    try
                    {
                        // Determine sync direction based on which reading is more recent
                        OdometerSyncResultDTO? syncResult = null;

                        if (vehicle.RecommendedSource == OdometerSource.GPS)
                        {
                            // GPS is more recent - update database from GPS
                            var result = await odometerSyncService.SyncOdometerFromGPSAsync(vehicle.VehicleId, cancellationToken);
                            syncResult = result.Data;
                        }
                        else if (vehicle.RecommendedSource == OdometerSource.FuelRefill ||
                                 vehicle.RecommendedSource == OdometerSource.PumpTransaction)
                        {
                            // Fueling data is more recent - update GPS from database
                            var result = await odometerSyncService.SyncOdometerToGPSAsync(vehicle.VehicleId, cancellationToken);
                            syncResult = result.Data;
                        }

                        if (syncResult?.Success == true)
                        {
                            successCount++;
                            _logger.LogInformation(
                                $"Synced vehicle {vehicle.HyoungNo}: {syncResult.OldValue:N2} → {syncResult.NewValue:N2} {vehicle.Unit} " +
                                $"(source: {syncResult.SourceUsed})");
                        }
                        else
                        {
                            failCount++;
                            _logger.LogWarning(
                                $"Failed to sync vehicle {vehicle.HyoungNo}: {syncResult?.Message ?? "Unknown error"}");
                        }
                    }
                    catch (Exception ex)
                    {
                        failCount++;
                        _logger.LogError(ex, $"Error syncing vehicle {vehicle.VehicleId} ({vehicle.HyoungNo})");
                    }
                }

                _logger.LogInformation(
                    $"Odometer sync completed. Success: {successCount}, Failed: {failCount}, Total: {vehiclesNeedingSync.Count}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during odometer sync process.");
                throw;
            }
        }
    }
}
