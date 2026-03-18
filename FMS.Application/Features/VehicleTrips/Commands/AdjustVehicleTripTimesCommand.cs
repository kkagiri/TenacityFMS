/**
 * File: AdjustVehicleTripTimesCommand.cs
 * Purpose: Command contract for manually adjusting departure and arrival times for a trip.
 * Dependencies: MediatR, FMSResponse, override response DTO.
 * Last Modified: 2026-03-11
 */
using System;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Application.Features.VehicleTrips.Validators;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Commands;

public class AdjustVehicleTripTimesCommand : VehicleTripManualOverrideCommandBase, IRequest<FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    public int VehicleTripGroupId { get; init; }
    public int VehicleTripId { get; init; }
    public DateTime? OverrideStartTimeUtc { get; init; }
    public DateTime? OverrideEndTimeUtc { get; init; }
}

public class AdjustVehicleTripTimesCommandHandler : IRequestHandler<AdjustVehicleTripTimesCommand, FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    private readonly IVehicleTripManualOverrideService _manualOverrideService;
    private readonly IAdjustVehicleTripTimesCommandValidator _validator;

    public AdjustVehicleTripTimesCommandHandler(
        IVehicleTripManualOverrideService manualOverrideService,
        IAdjustVehicleTripTimesCommandValidator validator)
    {
        _manualOverrideService = manualOverrideService;
        _validator = validator;
    }

    public async Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> Handle(AdjustVehicleTripTimesCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(validationErrors);
        }

        return await _manualOverrideService.AdjustTripTimesAsync(request, cancellationToken);
    }
}
