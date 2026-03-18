/**
 * File: GetVehicleTripBreadcrumbsQueryValidator.cs
 * Purpose: Validates trip breadcrumb query inputs before GPS lookup.
 * Dependencies: GetVehicleTripBreadcrumbsQuery.
 * Last Modified: 2026-03-13
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Queries;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IGetVehicleTripBreadcrumbsQueryValidator
{
    List<string> Validate(GetVehicleTripBreadcrumbsQuery request);
}

public class GetVehicleTripBreadcrumbsQueryValidator : IGetVehicleTripBreadcrumbsQueryValidator
{
    public List<string> Validate(GetVehicleTripBreadcrumbsQuery request)
    {
        var errors = new List<string>();

        if (request.VehicleTripGroupId <= 0)
        {
            errors.Add("VehicleTripGroupId must be greater than zero.");
        }

        if (request.MaxPoints <= 0)
        {
            errors.Add("MaxPoints must be greater than zero.");
        }

        if (request.MaxPoints > 5000)
        {
            errors.Add("MaxPoints must be less than or equal to 5000.");
        }

        return errors;
    }
}