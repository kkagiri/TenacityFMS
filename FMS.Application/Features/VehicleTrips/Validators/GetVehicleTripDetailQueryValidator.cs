/**
 * File: GetVehicleTripDetailQueryValidator.cs
 * Purpose: Validates trip detail query inputs before data access.
 * Dependencies: GetVehicleTripDetailQuery.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Queries;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IGetVehicleTripDetailQueryValidator
{
    List<string> Validate(GetVehicleTripDetailQuery request);
}

public class GetVehicleTripDetailQueryValidator : IGetVehicleTripDetailQueryValidator
{
    public List<string> Validate(GetVehicleTripDetailQuery request)
    {
        var errors = new List<string>();

        if (request.VehicleTripGroupId <= 0)
        {
            errors.Add("VehicleTripGroupId must be greater than zero.");
        }

        return errors;
    }
}
