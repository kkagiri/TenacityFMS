/**
 * File: ReconcileVehicleTripsCommand.cs
 * Purpose: Command contract for reconciliation preview/execution of persisted vehicle trips.
 * Dependencies: MediatR, FMSResponse, VehicleTripReconciliationResultDTO.
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

public record ReconcileVehicleTripsCommand : IRequest<FMSResponse<VehicleTripReconciliationResultDTO>>
{
    public int VehicleId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
    public bool PreviewOnly { get; init; } = true;
}

public class ReconcileVehicleTripsCommandHandler : IRequestHandler<ReconcileVehicleTripsCommand, FMSResponse<VehicleTripReconciliationResultDTO>>
{
    private readonly IVehicleTripReconciliationService _reconciliationService;
    private readonly IReconcileVehicleTripsCommandValidator _validator;

    public ReconcileVehicleTripsCommandHandler(
        IVehicleTripReconciliationService reconciliationService,
        IReconcileVehicleTripsCommandValidator validator)
    {
        _reconciliationService = reconciliationService;
        _validator = validator;
    }

    public async Task<FMSResponse<VehicleTripReconciliationResultDTO>> Handle(ReconcileVehicleTripsCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripReconciliationResultDTO>.ValidationFailed(validationErrors);
        }

        return await _reconciliationService.ReconcileVehicleTripsAsync(
            request.VehicleId,
            request.FromUtc,
            request.ToUtc,
            request.PreviewOnly,
            cancellationToken);
    }
}
