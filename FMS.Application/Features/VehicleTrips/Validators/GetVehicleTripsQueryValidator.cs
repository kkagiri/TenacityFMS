/**
 * File: GetVehicleTripsQueryValidator.cs
 * Purpose: Validates trip list query inputs before data access.
 * Dependencies: GetVehicleTripsQuery.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Queries;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IGetVehicleTripsQueryValidator
{
    List<string> Validate(GetVehicleTripsQuery request);
}

public class GetVehicleTripsQueryValidator : IGetVehicleTripsQueryValidator
{
    public List<string> Validate(GetVehicleTripsQuery request)
    {
        var errors = new List<string>();
        var fromUtc = request.FromUtc?.ToUniversalTime();
        var toUtc = request.ToUtc?.ToUniversalTime();

        if (request.VehicleId.HasValue && request.VehicleId.Value <= 0)
        {
            errors.Add("VehicleId must be greater than zero.");
        }

        if (request.SiteId.HasValue && request.SiteId.Value <= 0)
        {
            errors.Add("SiteId must be greater than zero.");
        }

        if (fromUtc.HasValue && toUtc.HasValue && fromUtc.Value >= toUtc.Value)
        {
            errors.Add("FromUtc must be earlier than ToUtc.");
        }

        if (request.MinimumConfidenceScore.HasValue
            && (request.MinimumConfidenceScore.Value < 0.00m || request.MinimumConfidenceScore.Value > 1.00m))
        {
            errors.Add("MinimumConfidenceScore must be between 0.00 and 1.00.");
        }

        return errors;
    }
}
