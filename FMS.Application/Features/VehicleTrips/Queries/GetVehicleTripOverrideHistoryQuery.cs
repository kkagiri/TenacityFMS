/**
 * File: GetVehicleTripOverrideHistoryQuery.cs
 * Purpose: Query contract for reading manual override audit history for a trip or trip group.
 * Dependencies: MediatR, FMSResponse, override history DTO.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Application.Features.VehicleTrips.Services;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Queries;

public class GetVehicleTripOverrideHistoryQuery : IRequest<FMSResponse<List<VehicleTripOverrideHistoryItemDTO>>>
{
    public int VehicleTripGroupId { get; init; }
    public int? VehicleTripId { get; init; }
}

public class GetVehicleTripOverrideHistoryQueryHandler : IRequestHandler<GetVehicleTripOverrideHistoryQuery, FMSResponse<System.Collections.Generic.List<VehicleTripOverrideHistoryItemDTO>>>
{
    private readonly IVehicleTripOverrideAuditService _auditService;

    public GetVehicleTripOverrideHistoryQueryHandler(IVehicleTripOverrideAuditService auditService)
    {
        _auditService = auditService;
    }

    public async Task<FMSResponse<System.Collections.Generic.List<VehicleTripOverrideHistoryItemDTO>>> Handle(GetVehicleTripOverrideHistoryQuery request, CancellationToken cancellationToken)
    {
        if (request.VehicleTripGroupId <= 0)
        {
            return FMSResponse<System.Collections.Generic.List<VehicleTripOverrideHistoryItemDTO>>.ValidationFailed(new System.Collections.Generic.List<string>
            {
                "VehicleTripGroupId must be greater than zero."
            });
        }

        var history = await _auditService.GetHistoryAsync(request.VehicleTripGroupId, request.VehicleTripId, cancellationToken);
        return FMSResponse<System.Collections.Generic.List<VehicleTripOverrideHistoryItemDTO>>.Success(history, "Vehicle trip override history retrieved successfully.");
    }
}
