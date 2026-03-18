/**
 * File: UpdateVehicleTripSettingsCommandValidator.cs
 * Purpose: Validates update vehicle trip settings command inputs before settings persistence.
 * Dependencies: UpdateVehicleTripSettingsCommand.
 * Last Modified: 2026-03-17
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.Commands;

namespace FMS.Application.Features.VehicleTrips.Validators;

public interface IUpdateVehicleTripSettingsCommandValidator
{
    List<string> Validate(UpdateVehicleTripSettingsCommand request);
}

public class UpdateVehicleTripSettingsCommandValidator : IUpdateVehicleTripSettingsCommandValidator
{
    public List<string> Validate(UpdateVehicleTripSettingsCommand request)
    {
        var errors = new List<string>();

        if (request.ReconciliationLookbackDays < 1)
            errors.Add("ReconciliationLookbackDays must be at least 1.");

        if (request.FuelLookupWindowHours < 0)
            errors.Add("FuelLookupWindowHours cannot be negative.");

        if (request.ConfidenceMinimumScore < 0 || request.ConfidenceMinimumScore > 100)
            errors.Add("ConfidenceMinimumScore must be between 0 and 100.");

        if (request.ConfidenceHighBandThreshold < 0 || request.ConfidenceHighBandThreshold > 100)
            errors.Add("ConfidenceHighBandThreshold must be between 0 and 100.");

        if (request.ConfidenceMediumBandThreshold < 0 || request.ConfidenceMediumBandThreshold > 100)
            errors.Add("ConfidenceMediumBandThreshold must be between 0 and 100.");

        if (request.ConfidenceHighBandThreshold > 0 && request.ConfidenceMediumBandThreshold > 0
            && request.ConfidenceMediumBandThreshold >= request.ConfidenceHighBandThreshold)
            errors.Add("ConfidenceMediumBandThreshold must be less than ConfidenceHighBandThreshold.");

        if (request.ConfidenceHighSpeedThresholdKph < 0)
            errors.Add("ConfidenceHighSpeedThresholdKph cannot be negative.");

        if (request.ConfidenceShortTripDistanceThresholdKm < 0)
            errors.Add("ConfidenceShortTripDistanceThresholdKm cannot be negative.");

        if (request.ConfidenceShortTripDurationThresholdMinutes < 0)
            errors.Add("ConfidenceShortTripDurationThresholdMinutes cannot be negative.");

        if (request.ClusterBatchStopSpeedThresholdKph < 0)
            errors.Add("ClusterBatchStopSpeedThresholdKph cannot be negative.");

        if (request.ClusterBatchMinimumStopDurationMinutes < 0)
            errors.Add("ClusterBatchMinimumStopDurationMinutes cannot be negative.");

        if (request.ClusterBatchMinimumTripDistanceKm < 0)
            errors.Add("ClusterBatchMinimumTripDistanceKm cannot be negative.");

        if (request.ClusterBatchClusterRadiusMeters < 0)
            errors.Add("ClusterBatchClusterRadiusMeters cannot be negative.");

        if (request.ClusterBatchMaxTrackPoints < 1)
            errors.Add("ClusterBatchMaxTrackPoints must be at least 1.");

        if (request.ClusterRealtimeStopSpeedThresholdKph < 0)
            errors.Add("ClusterRealtimeStopSpeedThresholdKph cannot be negative.");

        if (request.ClusterRealtimeStopDurationPoints < 1)
            errors.Add("ClusterRealtimeStopDurationPoints must be at least 1.");

        if (request.ClusterRealtimeMovingDurationPoints < 1)
            errors.Add("ClusterRealtimeMovingDurationPoints must be at least 1.");

        if (request.ClusterRealtimeClusterMatchRadiusKm < 0)
            errors.Add("ClusterRealtimeClusterMatchRadiusKm cannot be negative.");

        return errors;
    }
}
