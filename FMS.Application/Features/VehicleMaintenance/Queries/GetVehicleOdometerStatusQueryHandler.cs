using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleMaintenance.Queries;

/// <summary>
/// Handler for GetVehicleOdometerStatusQuery - retrieves odometer status for a single vehicle
/// </summary>
public class GetVehicleOdometerStatusQueryHandler : IRequestHandler<GetVehicleOdometerStatusQuery, FMSResponse<OdometerSyncDTO>>
{
    private readonly IOdometerSyncService _odometerSyncService;
    private readonly ILogger<GetVehicleOdometerStatusQueryHandler> _logger;

    public GetVehicleOdometerStatusQueryHandler(
        IOdometerSyncService odometerSyncService,
        ILogger<GetVehicleOdometerStatusQueryHandler> logger)
    {
        _odometerSyncService = odometerSyncService;
        _logger = logger;
    }

    public async Task<FMSResponse<OdometerSyncDTO>> Handle(GetVehicleOdometerStatusQuery request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation($"Getting odometer status for vehicle {request.VehicleId}");
            return await _odometerSyncService.GetVehicleOdometerStatusAsync(request.VehicleId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting odometer status for vehicle {request.VehicleId}");
            return FMSResponse<OdometerSyncDTO>.Failed($"Error getting odometer status: {ex.Message}");
        }
    }
}

/// <summary>
/// Handler for GetAllVehicleOdometerStatusQuery - retrieves odometer status for all vehicles
/// </summary>
public class GetAllVehicleOdometerStatusQueryHandler : IRequestHandler<GetAllVehicleOdometerStatusQuery, FMSResponse<List<OdometerSyncDTO>>>
{
    private readonly IOdometerSyncService _odometerSyncService;
    private readonly ILogger<GetAllVehicleOdometerStatusQueryHandler> _logger;

    public GetAllVehicleOdometerStatusQueryHandler(
        IOdometerSyncService odometerSyncService,
        ILogger<GetAllVehicleOdometerStatusQueryHandler> logger)
    {
        _odometerSyncService = odometerSyncService;
        _logger = logger;
    }

    public async Task<FMSResponse<List<OdometerSyncDTO>>> Handle(GetAllVehicleOdometerStatusQuery request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Getting odometer status for all vehicles (OnlyOutOfSync: {OnlyOutOfSync}, Threshold: {Threshold})",
                request.OnlyOutOfSync, request.DiscrepancyThreshold);

            var result = await _odometerSyncService.GetAllVehicleOdometerStatusAsync(cancellationToken);

            if (result.IsSuccess && result.Data != null && request.OnlyOutOfSync)
            {
                // Filter by both SyncNeeded flag and discrepancy threshold
                var filteredData = result.Data
                    .Where(d => d.SyncNeeded || (d.ReadingDifference.HasValue && Math.Abs(d.ReadingDifference.Value) >= (double)request.DiscrepancyThreshold))
                    .ToList();

                return FMSResponse<List<OdometerSyncDTO>>.Success(
                    filteredData,
                    $"Found {filteredData.Count} vehicles with discrepancies >= {request.DiscrepancyThreshold}");
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all vehicle odometer status");
            return FMSResponse<List<OdometerSyncDTO>>.Failed($"Error getting odometer status: {ex.Message}");
        }
    }
}
