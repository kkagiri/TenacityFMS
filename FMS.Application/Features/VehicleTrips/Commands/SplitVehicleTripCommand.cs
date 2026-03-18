/**
 * File: SplitVehicleTripCommand.cs
 * Purpose: Command contract for splitting one persisted trip leg into two manual legs.
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

public class SplitVehicleTripCommand : VehicleTripManualOverrideCommandBase, IRequest<FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    public int VehicleTripGroupId { get; init; }
    public int VehicleTripId { get; init; }
    public DateTime SplitTimeUtc { get; init; }
    public int? IntermediateSiteId { get; init; }
    public decimal? SplitLatitude { get; init; }
    public decimal? SplitLongitude { get; init; }
}

public class SplitVehicleTripCommandHandler : IRequestHandler<SplitVehicleTripCommand, FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    private readonly IVehicleTripManualOverrideService _manualOverrideService;
    private readonly ISplitVehicleTripCommandValidator _validator;

    public SplitVehicleTripCommandHandler(
        IVehicleTripManualOverrideService manualOverrideService,
        ISplitVehicleTripCommandValidator validator)
    {
        _manualOverrideService = manualOverrideService;
        _validator = validator;
    }

    public async Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> Handle(SplitVehicleTripCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(validationErrors);
        }

        return await _manualOverrideService.SplitTripAsync(request, cancellationToken);
    }
}
