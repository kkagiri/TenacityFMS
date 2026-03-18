/**
 * File: MergeVehicleTripsCommand.cs
 * Purpose: Command contract for merging two consecutive trip legs into one manual leg.
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

public class MergeVehicleTripsCommand : VehicleTripManualOverrideCommandBase, IRequest<FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    public int VehicleTripGroupId { get; init; }
    public int PrimaryVehicleTripId { get; init; }
    public int SecondaryVehicleTripId { get; init; }
}

public class MergeVehicleTripsCommandHandler : IRequestHandler<MergeVehicleTripsCommand, FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    private readonly IVehicleTripManualOverrideService _manualOverrideService;
    private readonly IMergeVehicleTripsCommandValidator _validator;

    public MergeVehicleTripsCommandHandler(
        IVehicleTripManualOverrideService manualOverrideService,
        IMergeVehicleTripsCommandValidator validator)
    {
        _manualOverrideService = manualOverrideService;
        _validator = validator;
    }

    public async Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> Handle(MergeVehicleTripsCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(validationErrors);
        }

        return await _manualOverrideService.MergeTripsAsync(request, cancellationToken);
    }
}
