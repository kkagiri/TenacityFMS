/**
 * File: DeleteVehicleTripCommand.cs
 * Purpose: Command contract for superseding a false trip or trip group without hard deletion.
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

public class DeleteVehicleTripCommand : VehicleTripManualOverrideCommandBase, IRequest<FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    public int VehicleTripGroupId { get; init; }
    public int? VehicleTripId { get; init; }
}

public class DeleteVehicleTripCommandHandler : IRequestHandler<DeleteVehicleTripCommand, FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    private readonly IVehicleTripManualOverrideService _manualOverrideService;
    private readonly IDeleteVehicleTripCommandValidator _validator;

    public DeleteVehicleTripCommandHandler(
        IVehicleTripManualOverrideService manualOverrideService,
        IDeleteVehicleTripCommandValidator validator)
    {
        _manualOverrideService = manualOverrideService;
        _validator = validator;
    }

    public async Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> Handle(DeleteVehicleTripCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(validationErrors);
        }

        return await _manualOverrideService.DeleteTripAsync(request, cancellationToken);
    }
}
