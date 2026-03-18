/**
 * File: AddVehicleTripCommand.cs
 * Purpose: Command contract for manually creating a persisted vehicle trip record.
 * Dependencies: MediatR, FMSResponse, override response DTO.
 * Last Modified: 2026-03-11
 */
using System;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using MediatR;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Application.Features.VehicleTrips.Validators;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Commands;

public class AddVehicleTripCommand : VehicleTripManualOverrideCommandBase, IRequest<FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    public int VehicleId { get; init; }
    public DateTime StartTimeUtc { get; init; }
    public DateTime EndTimeUtc { get; init; }
    public int? OriginSiteId { get; init; }
    public int? DestinationSiteId { get; init; }
    public decimal StartLatitude { get; init; }
    public decimal StartLongitude { get; init; }
    public decimal EndLatitude { get; init; }
    public decimal EndLongitude { get; init; }
    public decimal DistanceKm { get; init; }
    public decimal? MaxSpeedKph { get; init; }
    public VehicleMovementProfile? MovementProfile { get; init; }
    public VehicleTripGroupingType GroupingType { get; init; } = VehicleTripGroupingType.SingleLeg;
}

public class AddVehicleTripCommandHandler : IRequestHandler<AddVehicleTripCommand, FMSResponse<VehicleTripManualOverrideResponseDTO>>
{
    private readonly IVehicleTripManualOverrideService _manualOverrideService;
    private readonly IAddVehicleTripCommandValidator _validator;

    public AddVehicleTripCommandHandler(
        IVehicleTripManualOverrideService manualOverrideService,
        IAddVehicleTripCommandValidator validator)
    {
        _manualOverrideService = manualOverrideService;
        _validator = validator;
    }

    public async Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> Handle(AddVehicleTripCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(validationErrors);
        }

        return await _manualOverrideService.AddTripAsync(request, cancellationToken);
    }
}
