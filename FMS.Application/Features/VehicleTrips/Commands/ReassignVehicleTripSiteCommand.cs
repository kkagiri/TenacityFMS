/**
 * File: ReassignVehicleTripSiteCommand.cs
 * Purpose: Command contract for reassigning trip origin and destination sites.
 * Dependencies: MediatR, FMSResponse, override response DTO.
 * Last Modified: 2026-03-11
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Application.Features.VehicleTrips.Validators;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Commands;

public class ReassignVehicleTripSiteCommand : VehicleTripManualOverrideCommandBase, IRequest<FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    public int VehicleTripGroupId { get; init; }
    public int? VehicleTripId { get; init; }
    public int? OverrideOriginSiteId { get; init; }
    public int? OverrideDestinationSiteId { get; init; }
}

public class ReassignVehicleTripSiteCommandHandler : IRequestHandler<ReassignVehicleTripSiteCommand, FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    private readonly IVehicleTripManualOverrideService _manualOverrideService;
    private readonly IReassignVehicleTripSiteCommandValidator _validator;

    public ReassignVehicleTripSiteCommandHandler(
        IVehicleTripManualOverrideService manualOverrideService,
        IReassignVehicleTripSiteCommandValidator validator)
    {
        _manualOverrideService = manualOverrideService;
        _validator = validator;
    }

    public async Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> Handle(ReassignVehicleTripSiteCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(validationErrors);
        }

        return await _manualOverrideService.ReassignSiteAsync(request, cancellationToken);
    }
}
