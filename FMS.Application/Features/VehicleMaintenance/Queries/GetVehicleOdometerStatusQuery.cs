using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleMaintenance.Queries;

/// <summary>
/// Query to get the latest odometer/engine hours status for a vehicle from all sources (GPS, FuelRefill, PumpTransaction)
/// </summary>
/// <param name="VehicleId">Vehicle ID to get status for</param>
public record GetVehicleOdometerStatusQuery(int VehicleId) : IRequest<FMSResponse<OdometerSyncDTO>>;

/// <summary>
/// Query to get odometer status for all vehicles with GPS mappings
/// </summary>
/// <param name="OnlyOutOfSync">If true, only return vehicles where readings differ significantly</param>
/// <param name="DiscrepancyThreshold">Threshold in km/hours to consider as a significant discrepancy (default: 100)</param>
public record GetAllVehicleOdometerStatusQuery(bool OnlyOutOfSync = false, decimal DiscrepancyThreshold = 100) : IRequest<FMSResponse<List<OdometerSyncDTO>>>;
