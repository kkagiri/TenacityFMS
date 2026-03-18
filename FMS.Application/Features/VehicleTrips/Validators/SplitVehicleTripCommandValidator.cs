/**
 * File: SplitVehicleTripCommandValidator.cs
 * Purpose: Validates split vehicle trip command inputs before override processing.
 * Dependencies: SplitVehicleTripCommand, VehicleTripManualOverrideCommandBase.
 * Last Modified: 2026-03-17
 */
using System;
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface ISplitVehicleTripCommandValidator
{
    List<string> Validate(SplitVehicleTripCommand request);
}

public class SplitVehicleTripCommandValidator : ISplitVehicleTripCommandValidator
{
    public List<string> Validate(SplitVehicleTripCommand request)
    {
        var errors = new List<string>();

        if (request.VehicleTripGroupId <= 0)
            errors.Add("VehicleTripGroupId is required.");

        if (request.VehicleTripId <= 0)
            errors.Add("VehicleTripId is required.");

        if (request.SplitTimeUtc == default)
            errors.Add("SplitTimeUtc is required.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            errors.Add("Reason is required for all override actions.");

        if (string.IsNullOrWhiteSpace(request.RequestedByUserId))
            errors.Add("RequestedByUserId is required.");

        return errors;
    }
}
