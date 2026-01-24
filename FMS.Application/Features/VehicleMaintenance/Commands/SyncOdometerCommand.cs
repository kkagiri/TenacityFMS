using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleMaintenance.Commands;

/// <summary>
/// Command to sync a vehicle's odometer from GPS to the maintenance database
/// Updates Vehicle.CurrentPhysicalReading with the latest GPS accumulator value
/// </summary>
/// <param name="VehicleId">Vehicle ID to sync</param>
public record SyncOdometerFromGPSCommand(int VehicleId) : IRequest<FMSResponse<OdometerSyncResultDTO>>;

/// <summary>
/// Command to sync a vehicle's odometer TO GPS from fueling data
/// Updates GPSGate accumulator with the latest FuelRefill/PumpTransaction reading
/// </summary>
/// <param name="VehicleId">Vehicle ID to sync</param>
public record SyncOdometerToGPSCommand(int VehicleId) : IRequest<FMSResponse<OdometerSyncResultDTO>>;

/// <summary>
/// Command to batch sync all vehicles' odometers from GPS
/// </summary>
/// <param name="OnlyOutOfSync">If true, only sync vehicles where readings differ significantly</param>
public record BatchSyncOdometerFromGPSCommand(bool OnlyOutOfSync = true) : IRequest<FMSResponse<OdometerBatchSyncResultDTO>>;

/// <summary>
/// Command to manually set a vehicle's odometer reading
/// Updates both the local database and optionally the GPS accumulator
/// </summary>
/// <param name="VehicleId">Vehicle ID</param>
/// <param name="Reading">New odometer/engine hours reading in display units (km or hr)</param>
/// <param name="SyncToGPS">If true, also update the GPS accumulator</param>
/// <param name="UserId">User performing the update</param>
public record SetVehicleOdometerCommand(
    int VehicleId,
    decimal Reading,
    bool SyncToGPS = false,
    string? UserId = null
) : IRequest<FMSResponse<OdometerSyncResultDTO>>;
