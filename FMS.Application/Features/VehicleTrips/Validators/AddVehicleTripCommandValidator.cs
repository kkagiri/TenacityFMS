/**
 * File: AddVehicleTripCommandValidator.cs
 * Purpose: Validates add vehicle trip command inputs before manual trip creation.
 * Dependencies: AddVehicleTripCommand, VehicleTripManualOverrideCommandBase.
 * Last Modified: 2026-03-17
 */
using System;
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IAddVehicleTripCommandValidator
{
    List<string> Validate(AddVehicleTripCommand request);
}

public class AddVehicleTripCommandValidator : IAddVehicleTripCommandValidator
{
    public List<string> Validate(AddVehicleTripCommand request)
    {
        var errors = new List<string>();

        if (request.VehicleId <= 0)
            errors.Add("VehicleId is required.");

        if (request.StartTimeUtc == default)
            errors.Add("StartTimeUtc is required.");

        if (request.EndTimeUtc == default)
            errors.Add("EndTimeUtc is required.");

        if (request.StartTimeUtc != default && request.EndTimeUtc != default
            && request.StartTimeUtc >= request.EndTimeUtc)
            errors.Add("StartTimeUtc must be before EndTimeUtc.");

        if (request.StartTimeUtc > DateTime.UtcNow)
            errors.Add("StartTimeUtc cannot be in the future.");

        if (request.DistanceKm < 0)
            errors.Add("DistanceKm cannot be negative.");

        if (request.MaxSpeedKph.HasValue && request.MaxSpeedKph.Value < 0)
            errors.Add("MaxSpeedKph cannot be negative.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            errors.Add("Reason is required for all override actions.");

        if (string.IsNullOrWhiteSpace(request.RequestedByUserId))
            errors.Add("RequestedByUserId is required.");

        return errors;
    }
}
