using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Application.ModelsDTOs.GPSGate;

namespace FMS.Application.CommonInterface;

/// <summary>
/// Interface for Odometer/Engine Hours synchronization between GPS and fueling data
/// </summary>
public interface IOdometerSyncService
{
    /// <summary>
    /// Get the latest odometer/engine hours reading for a vehicle from all sources
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>OdometerSyncDTO with readings from all sources</returns>
    Task<FMSResponse<OdometerSyncDTO>> GetVehicleOdometerStatusAsync(int vehicleId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get odometer status for all vehicles
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of OdometerSyncDTO for all vehicles with GPS mappings</returns>
    Task<FMSResponse<List<OdometerSyncDTO>>> GetAllVehicleOdometerStatusAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Sync a vehicle's odometer from GPS to the maintenance database
    /// Updates Vehicle.CurrentPhysicalReading with the latest GPS reading
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Sync result</returns>
    Task<FMSResponse<OdometerSyncResultDTO>> SyncOdometerFromGPSAsync(int vehicleId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update GPS accumulator with the latest fueling data reading
    /// Pushes the latest FuelRefill/PumpTransaction reading to GPSGate
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Sync result</returns>
    Task<FMSResponse<OdometerSyncResultDTO>> SyncOdometerToGPSAsync(int vehicleId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Batch sync all vehicles' odometers from GPS
    /// </summary>
    /// <param name="onlyOutOfSync">Only sync vehicles where readings differ significantly</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Batch sync result</returns>
    Task<FMSResponse<OdometerBatchSyncResultDTO>> BatchSyncFromGPSAsync(bool onlyOutOfSync = true, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all GPS accumulators in batch (for dashboard/monitoring)
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>All accumulators with vehicle mapping</returns>
    Task<FMSResponse<List<GPSGateAccumulator>>> GetAllGPSAccumulatorsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Determine the correct accumulator type for a vehicle based on AverageKmL setting
    /// </summary>
    /// <param name="averageKmL">True for km/l (Odometer), False for hr/l (Engine Hours)</param>
    /// <returns>Accumulator type ID (1 for Odometer, 2 for Engine Hours)</returns>
    int GetAccumulatorTypeForVehicle(bool averageKmL);
}
