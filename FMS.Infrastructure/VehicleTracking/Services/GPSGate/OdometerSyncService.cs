using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Application.ModelsDTOs.GPSGate;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Infrastructure.VehicleTracking.Services.GPSGate
{
    /// <summary>
    /// Service for bidirectional synchronization of odometer/engine hours
    /// between GPS providers and fueling data (FuelRefill/PumpTransaction)
    /// </summary>
    public class OdometerSyncService : IOdometerSyncService
    {
        private readonly IGPSGateAccumulatorService _accumulatorService;
        private readonly GpsdataContext _context;
        private readonly ILogger<OdometerSyncService> _logger;

        public OdometerSyncService(
            IGPSGateAccumulatorService accumulatorService,
            GpsdataContext context,
            ILogger<OdometerSyncService> logger)
        {
            _accumulatorService = accumulatorService;
            _context = context;
            _logger = logger;
        }

        /// <inheritdoc/>
        public int GetAccumulatorTypeForVehicle(bool averageKmL)
        {
            // AverageKmL = true means vehicle uses km/l (Odometer, type 1)
            // AverageKmL = false means vehicle uses hr/l (Engine Hours, type 2)
            return averageKmL ? AccumulatorTypeConstants.Odometer : AccumulatorTypeConstants.EngineHours;
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<OdometerSyncDTO>> GetVehicleOdometerStatusAsync(int vehicleId, CancellationToken cancellationToken = default)
        {
            try
            {
                // Get vehicle info
                var vehicle = await _context.Set<Vehicle>()
                    .AsNoTracking()
                    .Where(v => v.VehicleId == vehicleId)
                    .Select(v => new
                    {
                        v.VehicleId,
                        v.HyoungNo,
                        v.NumberPlate,
                        v.AverageKmL,
                        v.CurrentPhysicalReading
                    })
                    .FirstOrDefaultAsync(cancellationToken);

                if (vehicle == null)
                {
                    return FMSResponse<OdometerSyncDTO>.Failed($"Vehicle {vehicleId} not found");
                }

                var dto = new OdometerSyncDTO
                {
                    VehicleId = vehicle.VehicleId,
                    HyoungNo = vehicle.HyoungNo,
                    NumberPlate = vehicle.NumberPlate,
                    AverageKmL = vehicle.AverageKmL,
                    StoredPhysicalReading = vehicle.CurrentPhysicalReading
                };

                // Get GPS provider mapping
                var mapping = await _context.VehicleProviderMappings
                    .AsNoTracking()
                    .Where(m => m.VehicleId == vehicleId && m.IsActive)
                    .Select(m => new { m.ExternalDeviceId })
                    .FirstOrDefaultAsync(cancellationToken);

                dto.HasGPSMapping = mapping != null && !string.IsNullOrEmpty(mapping.ExternalDeviceId);

                if (dto.HasGPSMapping && int.TryParse(mapping!.ExternalDeviceId, out int gpsUserId))
                {
                    dto.GPSUserId = gpsUserId;

                    // Get GPS accumulator reading
                    var accumulators = await _accumulatorService.GetVehicleAccumulatorsAsync(vehicleId, cancellationToken);
                    var targetType = GetAccumulatorTypeForVehicle(vehicle.AverageKmL);
                    var accumulator = accumulators.FirstOrDefault(a => a.AccumulatorTypeId == targetType);

                    if (accumulator != null)
                    {
                        dto.GPSAccumulatorId = accumulator.Id;
                        dto.GPSReading = accumulator.Value;
                        dto.GPSReadingTimestamp = !string.IsNullOrEmpty(accumulator.Timestamp)
                            ? DateTime.TryParse(accumulator.Timestamp, out var ts) ? ts : null
                            : null;
                    }
                }

                // Get latest reading from fueling data (FuelRefill or PumpTransaction)
                var fuelingData = await GetLatestFuelingReadingAsync(vehicleId, cancellationToken);
                if (fuelingData != null)
                {
                    dto.FuelingReading = fuelingData.Value.reading;
                    dto.FuelingSource = fuelingData.Value.source;
                    dto.FuelingTimestamp = fuelingData.Value.timestamp;
                }

                // Calculate sync status
                dto.CalculateSyncStatus();

                return FMSResponse<OdometerSyncDTO>.Success(dto, "Odometer status retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting odometer status for vehicle {vehicleId}");
                return FMSResponse<OdometerSyncDTO>.Failed($"Error getting odometer status: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<List<OdometerSyncDTO>>> GetAllVehicleOdometerStatusAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                // Get all active vehicles with GPS mappings including Site and VehicleType
                var vehiclesWithMappings = await _context.VehicleProviderMappings
                    .AsNoTracking()
                    .Where(m => m.IsActive && m.ExternalDeviceId != null)
                    .Select(m => new
                    {
                        m.VehicleId,
                        m.ExternalDeviceId,
                        m.Vehicle!.HyoungNo,
                        m.Vehicle.NumberPlate,
                        m.Vehicle.AverageKmL,
                        m.Vehicle.CurrentPhysicalReading,
                        SiteId = m.Vehicle.WorkingSiteId,
                        SiteName = m.Vehicle.WorkingSite != null ? m.Vehicle.WorkingSite.Name : null,
                        m.Vehicle.VehicleTypeId,
                        VehicleTypeName = m.Vehicle.VehicleType != null ? m.Vehicle.VehicleType.Name : null
                    })
                    .ToListAsync(cancellationToken);

                if (!vehiclesWithMappings.Any())
                {
                    return FMSResponse<List<OdometerSyncDTO>>.Success(
                        new List<OdometerSyncDTO>(),
                        "No vehicles with GPS mappings found");
                }

                // Get all GPS accumulators in batch
                var allAccumulators = await _accumulatorService.GetAllAccumulatorsAsync(1000, cancellationToken);
                var accumulatorsByUser = allAccumulators
                    .GroupBy(a => a.UserId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // Get latest fueling readings for all vehicles
                var vehicleIds = vehiclesWithMappings.Select(v => v.VehicleId).ToList();
                var fuelingReadings = await GetLatestFuelingReadingsForVehiclesAsync(vehicleIds, cancellationToken);

                var results = new List<OdometerSyncDTO>();

                foreach (var vehicle in vehiclesWithMappings)
                {
                    var dto = new OdometerSyncDTO
                    {
                        VehicleId = vehicle.VehicleId,
                        HyoungNo = vehicle.HyoungNo,
                        NumberPlate = vehicle.NumberPlate,
                        AverageKmL = vehicle.AverageKmL,
                        SiteId = vehicle.SiteId,
                        SiteName = vehicle.SiteName,
                        VehicleTypeId = vehicle.VehicleTypeId,
                        VehicleTypeName = vehicle.VehicleTypeName,
                        StoredPhysicalReading = vehicle.CurrentPhysicalReading,
                        HasGPSMapping = true
                    };

                    // Get GPS accumulator
                    if (int.TryParse(vehicle.ExternalDeviceId, out int gpsUserId))
                    {
                        dto.GPSUserId = gpsUserId;

                        if (accumulatorsByUser.TryGetValue(gpsUserId, out var vehicleAccumulators))
                        {
                            var targetType = GetAccumulatorTypeForVehicle(vehicle.AverageKmL);
                            var accumulator = vehicleAccumulators.FirstOrDefault(a => a.AccumulatorTypeId == targetType);

                            if (accumulator != null)
                            {
                                dto.GPSAccumulatorId = accumulator.Id;
                                dto.GPSReading = accumulator.Value;
                                dto.GPSReadingTimestamp = !string.IsNullOrEmpty(accumulator.Timestamp)
                                    ? DateTime.TryParse(accumulator.Timestamp, out var ts) ? ts : null
                                    : null;
                            }
                        }
                    }

                    // Get fueling reading
                    if (fuelingReadings.TryGetValue(vehicle.VehicleId, out var fuelingData))
                    {
                        dto.FuelingReading = fuelingData.reading;
                        dto.FuelingSource = fuelingData.source;
                        dto.FuelingTimestamp = fuelingData.timestamp;
                    }

                    dto.CalculateSyncStatus();
                    results.Add(dto);
                }

                return FMSResponse<List<OdometerSyncDTO>>.Success(
                    results,
                    $"Retrieved odometer status for {results.Count} vehicles");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all vehicle odometer status");
                return FMSResponse<List<OdometerSyncDTO>>.Failed($"Error getting odometer status: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<OdometerSyncResultDTO>> SyncOdometerFromGPSAsync(int vehicleId, CancellationToken cancellationToken = default)
        {
            try
            {
                var status = await GetVehicleOdometerStatusAsync(vehicleId, cancellationToken);
                if (!status.IsSuccess || status.Data == null)
                {
                    return FMSResponse<OdometerSyncResultDTO>.Failed(status.Message ?? "Failed to get vehicle status");
                }

                var dto = status.Data;
                var result = new OdometerSyncResultDTO
                {
                    VehicleId = vehicleId,
                    HyoungNo = dto.HyoungNo
                };

                if (!dto.HasGPSMapping)
                {
                    result.Success = false;
                    result.Message = "Vehicle has no GPS provider mapping configured";
                    return FMSResponse<OdometerSyncResultDTO>.Success(result, result.Message);
                }

                if (!dto.GPSReading.HasValue)
                {
                    result.Success = false;
                    result.Message = "No GPS accumulator reading available";
                    return FMSResponse<OdometerSyncResultDTO>.Success(result, result.Message);
                }

                // Get the GPS reading in display units (km or hr)
                var gpsDisplayValue = dto.GetGPSReadingInDisplayUnits();

                // Update Vehicle.CurrentPhysicalReading
                var vehicle = await _context.Set<Vehicle>()
                    .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, cancellationToken);

                if (vehicle == null)
                {
                    result.Success = false;
                    result.Message = "Vehicle not found";
                    return FMSResponse<OdometerSyncResultDTO>.Failed(result.Message);
                }

                result.OldValue = decimal.TryParse(vehicle.CurrentPhysicalReading, out var oldVal) ? (double)oldVal : null;
                result.NewValue = gpsDisplayValue;
                result.SourceUsed = OdometerSource.GPS;

                vehicle.CurrentPhysicalReading = gpsDisplayValue.ToString("F2");
                vehicle.DateModified = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                result.Success = true;
                result.Message = $"Updated odometer from GPS: {result.OldValue:N2} → {result.NewValue:N2} {dto.Unit}";

                _logger.LogInformation($"Synced odometer for vehicle {vehicleId} ({dto.HyoungNo}) from GPS: {result.NewValue:N2} {dto.Unit}");

                return FMSResponse<OdometerSyncResultDTO>.Success(result, result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error syncing odometer from GPS for vehicle {vehicleId}");
                return FMSResponse<OdometerSyncResultDTO>.Failed($"Error syncing odometer: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<OdometerSyncResultDTO>> SyncOdometerToGPSAsync(int vehicleId, CancellationToken cancellationToken = default)
        {
            try
            {
                var status = await GetVehicleOdometerStatusAsync(vehicleId, cancellationToken);
                if (!status.IsSuccess || status.Data == null)
                {
                    return FMSResponse<OdometerSyncResultDTO>.Failed(status.Message ?? "Failed to get vehicle status");
                }

                var dto = status.Data;
                var result = new OdometerSyncResultDTO
                {
                    VehicleId = vehicleId,
                    HyoungNo = dto.HyoungNo
                };

                if (!dto.HasGPSMapping || !dto.GPSUserId.HasValue)
                {
                    result.Success = false;
                    result.Message = "Vehicle has no GPS provider mapping configured";
                    return FMSResponse<OdometerSyncResultDTO>.Success(result, result.Message);
                }

                if (!dto.FuelingReading.HasValue)
                {
                    result.Success = false;
                    result.Message = "No fueling data reading available to sync";
                    return FMSResponse<OdometerSyncResultDTO>.Success(result, result.Message);
                }

                // Convert fueling reading to GPS units (International System of Units)
                // - Odometer: meters (km * 1000)
                // - Engine Hours: seconds (hours * 3600)
                var gpsValue = dto.AverageKmL
                    ? (double)dto.FuelingReading.Value * 1000.0   // km to meters
                    : (double)dto.FuelingReading.Value * 3600.0;  // hours to seconds

                result.OldValue = dto.GPSReading.HasValue ? dto.GetGPSReadingInDisplayUnits() : null;
                result.NewValue = (double)dto.FuelingReading.Value;
                result.SourceUsed = dto.FuelingSource;

                bool success;
                var timestamp = dto.FuelingTimestamp?.ToString("o") ?? DateTime.UtcNow.ToString("o");

                if (dto.GPSAccumulatorId.HasValue)
                {
                    // Update existing accumulator
                    success = await _accumulatorService.UpdateAccumulatorAsync(
                        dto.GPSAccumulatorId.Value,
                        dto.GPSUserId.Value,
                        dto.AccumulatorTypeId,
                        gpsValue,
                        timestamp,
                        cancellationToken);
                }
                else
                {
                    // Create new accumulator
                    var newId = await _accumulatorService.CreateAccumulatorAsync(
                        dto.GPSUserId.Value,
                        dto.AccumulatorTypeId,
                        gpsValue,
                        timestamp,
                        cancellationToken);
                    success = newId > 0;
                }

                result.Success = success;
                result.Message = success
                    ? $"Updated GPS {(dto.AverageKmL ? "odometer" : "engine hours")}: {result.OldValue:N2} → {result.NewValue:N2} {dto.Unit}"
                    : "Failed to update GPS accumulator";

                if (success)
                {
                    _logger.LogInformation($"Synced odometer to GPS for vehicle {vehicleId} ({dto.HyoungNo}): {result.NewValue:N2} {dto.Unit}");
                }

                return FMSResponse<OdometerSyncResultDTO>.Success(result, result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error syncing odometer to GPS for vehicle {vehicleId}");
                return FMSResponse<OdometerSyncResultDTO>.Failed($"Error syncing odometer: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<OdometerBatchSyncResultDTO>> BatchSyncFromGPSAsync(bool onlyOutOfSync = true, CancellationToken cancellationToken = default)
        {
            var batchResult = new OdometerBatchSyncResultDTO
            {
                SyncStartTime = DateTime.UtcNow
            };

            try
            {
                var allStatus = await GetAllVehicleOdometerStatusAsync(cancellationToken);
                if (!allStatus.IsSuccess || allStatus.Data == null)
                {
                    batchResult.SyncEndTime = DateTime.UtcNow;
                    return FMSResponse<OdometerBatchSyncResultDTO>.Failed(allStatus.Message ?? "Failed to get vehicle status");
                }

                var vehiclesToSync = onlyOutOfSync
                    ? allStatus.Data.Where(d => d.SyncNeeded && d.GPSReading.HasValue).ToList()
                    : allStatus.Data.Where(d => d.GPSReading.HasValue).ToList();

                batchResult.TotalVehicles = allStatus.Data.Count;

                foreach (var vehicle in vehiclesToSync)
                {
                    try
                    {
                        var syncResult = await SyncOdometerFromGPSAsync(vehicle.VehicleId, cancellationToken);
                        if (syncResult.IsSuccess && syncResult.Data != null)
                        {
                            batchResult.Results.Add(syncResult.Data);
                            if (syncResult.Data.Success)
                                batchResult.SuccessCount++;
                            else
                                batchResult.SkippedCount++;
                        }
                        else
                        {
                            batchResult.FailedCount++;
                            batchResult.Results.Add(new OdometerSyncResultDTO
                            {
                                VehicleId = vehicle.VehicleId,
                                HyoungNo = vehicle.HyoungNo,
                                Success = false,
                                Message = syncResult.Message
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        batchResult.FailedCount++;
                        batchResult.Results.Add(new OdometerSyncResultDTO
                        {
                            VehicleId = vehicle.VehicleId,
                            HyoungNo = vehicle.HyoungNo,
                            Success = false,
                            Message = ex.Message
                        });
                    }
                }

                batchResult.SkippedCount = batchResult.TotalVehicles - vehiclesToSync.Count;
                batchResult.SyncEndTime = DateTime.UtcNow;

                var message = $"Batch sync completed: {batchResult.SuccessCount} synced, {batchResult.FailedCount} failed, {batchResult.SkippedCount} skipped";
                _logger.LogInformation(message);

                return FMSResponse<OdometerBatchSyncResultDTO>.Success(batchResult, message);
            }
            catch (Exception ex)
            {
                batchResult.SyncEndTime = DateTime.UtcNow;
                _logger.LogError(ex, "Error in batch sync from GPS");
                return FMSResponse<OdometerBatchSyncResultDTO>.Failed($"Error in batch sync: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<List<GPSGateAccumulator>>> GetAllGPSAccumulatorsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var accumulators = await _accumulatorService.GetAllAccumulatorsAsync(1000, cancellationToken);
                return FMSResponse<List<GPSGateAccumulator>>.Success(
                    accumulators,
                    $"Retrieved {accumulators.Count} GPS accumulators");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all GPS accumulators");
                return FMSResponse<List<GPSGateAccumulator>>.Failed($"Error getting accumulators: {ex.Message}");
            }
        }

        #region Private Methods

        /// <summary>
        /// Get the latest meter reading from FuelRefill or PumpTransaction for a vehicle
        /// </summary>
        private async Task<(decimal reading, OdometerSource source, DateTime? timestamp)?> GetLatestFuelingReadingAsync(
            int vehicleId, CancellationToken cancellationToken)
        {
            // Get latest from FuelRefill
            var latestFuelRefill = await _context.FuelRefills
                .AsNoTracking()
                .Where(fr => fr.VehicleId == vehicleId && !fr.IsDeleted && fr.CurrentMeterReading.HasValue)
                .OrderByDescending(fr => fr.Date)
                .Select(fr => new { fr.CurrentMeterReading, fr.Date })
                .FirstOrDefaultAsync(cancellationToken);

            // Get latest from PumpTransaction
            var latestPumpTransaction = await _context.Pumptransactions
                .AsNoTracking()
                .Where(pt => pt.VehicleId.HasValue && pt.VehicleId.Value == vehicleId && pt.Odometer.HasValue)
                .OrderByDescending(pt => pt.DateTime)
                .Select(pt => new { Odometer = pt.Odometer, DateTime = pt.DateTime })
                .FirstOrDefaultAsync(cancellationToken);

            // Compare and return the latest
            if (latestFuelRefill == null && latestPumpTransaction == null)
            {
                return null;
            }

            if (latestFuelRefill != null && latestPumpTransaction == null)
            {
                return (latestFuelRefill.CurrentMeterReading!.Value, OdometerSource.FuelRefill, latestFuelRefill.Date);
            }

            if (latestFuelRefill == null && latestPumpTransaction != null)
            {
                return (latestPumpTransaction.Odometer!.Value, OdometerSource.PumpTransaction, latestPumpTransaction.DateTime);
            }

            // Both have values - compare dates
            if (latestFuelRefill!.Date >= latestPumpTransaction!.DateTime)
            {
                return (latestFuelRefill.CurrentMeterReading!.Value, OdometerSource.FuelRefill, latestFuelRefill.Date);
            }
            else
            {
                return (latestPumpTransaction.Odometer!.Value, OdometerSource.PumpTransaction, latestPumpTransaction.DateTime);
            }
        }

        /// <summary>
        /// Get latest fueling readings for multiple vehicles in batch
        /// </summary>
        private async Task<Dictionary<int, (decimal reading, OdometerSource source, DateTime? timestamp)>> GetLatestFuelingReadingsForVehiclesAsync(
            List<int> vehicleIds, CancellationToken cancellationToken)
        {
            var result = new Dictionary<int, (decimal reading, OdometerSource source, DateTime? timestamp)>();

            // Get all relevant FuelRefills and process in memory to avoid EF Core GroupBy limitations
            var allFuelRefills = await _context.FuelRefills
                .AsNoTracking()
                .Where(fr => vehicleIds.Contains(fr.VehicleId) && !fr.IsDeleted && fr.CurrentMeterReading.HasValue)
                .Select(fr => new { fr.VehicleId, fr.CurrentMeterReading, fr.Date })
                .ToListAsync(cancellationToken);

            // Group in memory to get latest per vehicle
            var latestFuelRefills = allFuelRefills
                .GroupBy(fr => fr.VehicleId)
                .Select(g => new
                {
                    VehicleId = g.Key,
                    Latest = g.OrderByDescending(fr => fr.Date).FirstOrDefault()
                })
                .Where(x => x.Latest != null);

            foreach (var fr in latestFuelRefills)
            {
                if (fr.Latest?.CurrentMeterReading != null)
                {
                    result[fr.VehicleId] = (fr.Latest.CurrentMeterReading.Value, OdometerSource.FuelRefill, fr.Latest.Date);
                }
            }

            // Get all relevant PumpTransactions and process in memory
            var allPumpTransactions = await _context.Pumptransactions
                .AsNoTracking()
                .Where(pt => pt.VehicleId.HasValue && vehicleIds.Contains(pt.VehicleId.Value) && pt.Odometer.HasValue)
                .Select(pt => new { VehicleId = pt.VehicleId!.Value, pt.Odometer, pt.DateTime })
                .ToListAsync(cancellationToken);

            // Group in memory to get latest per vehicle
            var latestPumpTransactions = allPumpTransactions
                .GroupBy(pt => pt.VehicleId)
                .Select(g => new
                {
                    VehicleId = g.Key,
                    Latest = g.OrderByDescending(pt => pt.DateTime).FirstOrDefault()
                })
                .Where(x => x.Latest != null);

            // Compare and update with PumpTransaction if it's more recent
            foreach (var pt in latestPumpTransactions)
            {
                if (pt.Latest?.Odometer == null) continue;

                if (result.TryGetValue(pt.VehicleId, out var existing))
                {
                    // Compare timestamps - use pump transaction if newer
                    if (existing.timestamp == null || (pt.Latest.DateTime > existing.timestamp))
                    {
                        result[pt.VehicleId] = (pt.Latest.Odometer.Value, OdometerSource.PumpTransaction, pt.Latest.DateTime);
                    }
                }
                else
                {
                    result[pt.VehicleId] = (pt.Latest.Odometer.Value, OdometerSource.PumpTransaction, pt.Latest.DateTime);
                }
            }

            return result;
        }

        #endregion
    }
}
