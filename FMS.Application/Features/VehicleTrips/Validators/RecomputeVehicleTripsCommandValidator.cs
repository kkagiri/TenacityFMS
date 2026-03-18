/**
 * File: RecomputeVehicleTripsCommandValidator.cs
 * Purpose: Validates trip recompute command inputs before orchestration runs.
 * Dependencies: RecomputeVehicleTripsCommand.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IRecomputeVehicleTripsCommandValidator
{
    List<string> Validate(RecomputeVehicleTripsCommand request);
}

public class RecomputeVehicleTripsCommandValidator : IRecomputeVehicleTripsCommandValidator
{
    public List<string> Validate(RecomputeVehicleTripsCommand request)
    {
        var errors = new List<string>();
        var fromUtc = request.FromUtc?.ToUniversalTime();
        var toUtc = request.ToUtc?.ToUniversalTime();

        if (request.VehicleId <= 0)
        {
            errors.Add("VehicleId is required.");
        }

        if (fromUtc.HasValue && toUtc.HasValue && fromUtc.Value >= toUtc.Value)
        {
            errors.Add("FromUtc must be earlier than ToUtc.");
        }

        return errors;
    }
}
