/**
 * File: ReassignVehicleTripSiteCommandValidator.cs
 * Purpose: Validates reassign vehicle trip site command inputs before override processing.
 * Dependencies: ReassignVehicleTripSiteCommand, VehicleTripManualOverrideCommandBase.
 * Last Modified: 2026-03-17
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IReassignVehicleTripSiteCommandValidator
{
    List<string> Validate(ReassignVehicleTripSiteCommand request);
}

public class ReassignVehicleTripSiteCommandValidator : IReassignVehicleTripSiteCommandValidator
{
    public List<string> Validate(ReassignVehicleTripSiteCommand request)
    {
        var errors = new List<string>();

        if (request.VehicleTripGroupId <= 0)
            errors.Add("VehicleTripGroupId is required.");

        if (!request.OverrideOriginSiteId.HasValue && !request.OverrideDestinationSiteId.HasValue)
            errors.Add("At least one of OverrideOriginSiteId or OverrideDestinationSiteId must be provided.");

        if (request.OverrideOriginSiteId.HasValue && request.OverrideOriginSiteId.Value <= 0)
            errors.Add("OverrideOriginSiteId must be a valid site ID.");

        if (request.OverrideDestinationSiteId.HasValue && request.OverrideDestinationSiteId.Value <= 0)
            errors.Add("OverrideDestinationSiteId must be a valid site ID.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            errors.Add("Reason is required for all override actions.");

        if (string.IsNullOrWhiteSpace(request.RequestedByUserId))
            errors.Add("RequestedByUserId is required.");

        return errors;
    }
}
