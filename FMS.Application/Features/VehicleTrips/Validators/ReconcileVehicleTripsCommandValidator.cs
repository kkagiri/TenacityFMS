/**
 * File: ReconcileVehicleTripsCommandValidator.cs
 * Purpose: Validates reconcile vehicle trips command inputs before reconciliation processing.
 * Dependencies: ReconcileVehicleTripsCommand.
 * Last Modified: 2026-03-17
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IReconcileVehicleTripsCommandValidator
{
    List<string> Validate(ReconcileVehicleTripsCommand request);
}

public class ReconcileVehicleTripsCommandValidator : IReconcileVehicleTripsCommandValidator
{
    public List<string> Validate(ReconcileVehicleTripsCommand request)
    {
        var errors = new List<string>();

        if (request.VehicleId <= 0)
            errors.Add("VehicleId is required.");

        if (request.FromUtc.HasValue && request.ToUtc.HasValue
            && request.FromUtc.Value >= request.ToUtc.Value)
            errors.Add("FromUtc must be before ToUtc.");

        return errors;
    }
}
