/**
 * File: AdjustVehicleTripTimesCommandValidator.cs
 * Purpose: Validates adjust vehicle trip times command inputs before time-override processing.
 * Dependencies: AdjustVehicleTripTimesCommand, VehicleTripManualOverrideCommandBase.
 * Last Modified: 2026-03-17
 */
using System;
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IAdjustVehicleTripTimesCommandValidator
{
    List<string> Validate(AdjustVehicleTripTimesCommand request);
}

public class AdjustVehicleTripTimesCommandValidator : IAdjustVehicleTripTimesCommandValidator
{
    public List<string> Validate(AdjustVehicleTripTimesCommand request)
    {
        var errors = new List<string>();

        if (request.VehicleTripGroupId <= 0)
            errors.Add("VehicleTripGroupId is required.");

        if (request.VehicleTripId <= 0)
            errors.Add("VehicleTripId is required.");

        if (!request.OverrideStartTimeUtc.HasValue && !request.OverrideEndTimeUtc.HasValue)
            errors.Add("At least one of OverrideStartTimeUtc or OverrideEndTimeUtc must be provided.");

        if (request.OverrideStartTimeUtc.HasValue && request.OverrideEndTimeUtc.HasValue
            && request.OverrideStartTimeUtc.Value >= request.OverrideEndTimeUtc.Value)
            errors.Add("OverrideStartTimeUtc must be before OverrideEndTimeUtc.");

        if (request.OverrideStartTimeUtc.HasValue && request.OverrideStartTimeUtc.Value > DateTime.UtcNow)
            errors.Add("OverrideStartTimeUtc cannot be in the future.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            errors.Add("Reason is required for all override actions.");

        if (string.IsNullOrWhiteSpace(request.RequestedByUserId))
            errors.Add("RequestedByUserId is required.");

        return errors;
    }
}
