/**
 * File: DeleteVehicleTripCommandValidator.cs
 * Purpose: Validates delete vehicle trip command inputs before soft-delete processing.
 * Dependencies: DeleteVehicleTripCommand, VehicleTripManualOverrideCommandBase.
 * Last Modified: 2026-03-17
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IDeleteVehicleTripCommandValidator
{
    List<string> Validate(DeleteVehicleTripCommand request);
}

public class DeleteVehicleTripCommandValidator : IDeleteVehicleTripCommandValidator
{
    public List<string> Validate(DeleteVehicleTripCommand request)
    {
        var errors = new List<string>();

        if (request.VehicleTripGroupId <= 0)
            errors.Add("VehicleTripGroupId is required.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            errors.Add("Reason is required for all override actions.");

        if (string.IsNullOrWhiteSpace(request.RequestedByUserId))
            errors.Add("RequestedByUserId is required.");

        return errors;
    }
}
