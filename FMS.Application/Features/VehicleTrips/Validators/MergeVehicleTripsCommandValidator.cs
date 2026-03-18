/**
 * File: MergeVehicleTripsCommandValidator.cs
 * Purpose: Validates merge vehicle trips command inputs before override processing.
 * Dependencies: MergeVehicleTripsCommand, VehicleTripManualOverrideCommandBase.
 * Last Modified: 2026-03-17
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IMergeVehicleTripsCommandValidator
{
    List<string> Validate(MergeVehicleTripsCommand request);
}

public class MergeVehicleTripsCommandValidator : IMergeVehicleTripsCommandValidator
{
    public List<string> Validate(MergeVehicleTripsCommand request)
    {
        var errors = new List<string>();

        if (request.VehicleTripGroupId <= 0)
            errors.Add("VehicleTripGroupId is required.");

        if (request.PrimaryVehicleTripId <= 0)
            errors.Add("PrimaryVehicleTripId is required.");

        if (request.SecondaryVehicleTripId <= 0)
            errors.Add("SecondaryVehicleTripId is required.");

        if (request.PrimaryVehicleTripId > 0 && request.SecondaryVehicleTripId > 0
            && request.PrimaryVehicleTripId == request.SecondaryVehicleTripId)
            errors.Add("PrimaryVehicleTripId and SecondaryVehicleTripId must be different trips.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            errors.Add("Reason is required for all override actions.");

        if (string.IsNullOrWhiteSpace(request.RequestedByUserId))
            errors.Add("RequestedByUserId is required.");

        return errors;
    }
}
