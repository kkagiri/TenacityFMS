/**
 * File: VehicleTripConfidenceScoringService.cs
 * Purpose: Assigns baseline confidence and anomaly scaffolding to trips and grouped trips.
 * Dependencies: Vehicle trip detection/grouped DTOs.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripConfidenceScoringService : IVehicleTripConfidenceScoringService
{
    private readonly IVehicleTripSettingsService _vehicleTripSettingsService;

    public VehicleTripConfidenceScoringService(IVehicleTripSettingsService vehicleTripSettingsService)
    {
        _vehicleTripSettingsService = vehicleTripSettingsService;
    }

    public async Task ScoreTripsAsync(List<VehicleTripDetectionResultDTO> detectedTrips, CancellationToken cancellationToken = default)
    {
        var settings = await _vehicleTripSettingsService.GetSettingsAsync(cancellationToken);

        foreach (var trip in detectedTrips)
        {
            decimal score = 1.00m;
            var anomalies = VehicleTripAnomalyType.None;

            if (!trip.OriginSiteId.HasValue || !trip.DestinationSiteId.HasValue)
            {
                score -= settings.ConfidenceUnknownEndpointPenalty;
                anomalies |= VehicleTripAnomalyType.UnknownOriginOrDestination;
            }

            if (trip.DistanceKm < settings.ConfidenceShortTripDistanceThresholdKm
                || trip.DurationMinutes < settings.ConfidenceShortTripDurationThresholdMinutes)
            {
                score -= settings.ConfidenceShortTripPenalty;
            }

            if (trip.MaxSpeedKph.HasValue && trip.MaxSpeedKph.Value > settings.ConfidenceHighSpeedThresholdKph)
            {
                score -= settings.ConfidenceHighSpeedPenalty;
                anomalies |= VehicleTripAnomalyType.GpsGapSuspected;
            }

            if (!trip.HasFuelData)
            {
                score -= settings.ConfidenceMissingFuelPenalty;
                anomalies |= VehicleTripAnomalyType.MissingFuelData;
            }
            else if (string.Equals(trip.FuelDataQuality, "Weak", System.StringComparison.OrdinalIgnoreCase)
                     || string.Equals(trip.FuelDataQuality, "Derived", System.StringComparison.OrdinalIgnoreCase))
            {
                score -= settings.ConfidenceWeakFuelPenalty;
                anomalies |= VehicleTripAnomalyType.WeakFuelData;
            }

            if (trip.FuelConsumed.HasValue && trip.FuelConsumed.Value < 0m)
            {
                anomalies |= VehicleTripAnomalyType.NegativeFuelConsumption;
            }

            if (trip.FuelRateKmPerLiter.HasValue
                && trip.GroupingType == VehicleTripGroupingType.LoadCycle
                && trip.FuelRateKmPerLiter.Value < settings.ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter)
            {
                anomalies |= VehicleTripAnomalyType.SuspiciousFuelRate;
            }

            score = score < settings.ConfidenceMinimumScore ? settings.ConfidenceMinimumScore : score;
            trip.ConfidenceScore = score;
            trip.ConfidenceBand = ResolveConfidenceBand(score, settings);
            trip.AnomalyFlags = anomalies;
            trip.ReconciliationStatus = anomalies == VehicleTripAnomalyType.None
                ? VehicleTripReconciliationStatus.Pending
                : VehicleTripReconciliationStatus.Anomaly;
            trip.IsLowConfidence = score < settings.ConfidenceMediumBandThreshold;
            if (trip.IsLowConfidence)
            {
                trip.AnomalyFlags |= VehicleTripAnomalyType.LowConfidence;
            }
        }
    }

    public async Task ScoreGroupsAsync(List<VehicleTripGroupedDetectionDTO> groupedTrips, CancellationToken cancellationToken = default)
    {
        var settings = await _vehicleTripSettingsService.GetSettingsAsync(cancellationToken);

        foreach (var group in groupedTrips)
        {
            if (group.GroupingType == VehicleTripGroupingType.LoadCycle)
            {
                FlagLoadCycleFuelAnomalies(group.Trips, settings);
            }

            group.ConfidenceScore = group.Trips.Count == 0
                ? settings.ConfidenceMinimumScore
                : group.Trips.Average(t => t.ConfidenceScore);
            group.ConfidenceBand = ResolveConfidenceBand(group.ConfidenceScore, settings);
            group.AnomalyFlags = group.Trips.Aggregate(VehicleTripAnomalyType.None, (current, trip) => current | trip.AnomalyFlags);
            group.ReconciliationStatus = group.AnomalyFlags == VehicleTripAnomalyType.None
                ? VehicleTripReconciliationStatus.Pending
                : VehicleTripReconciliationStatus.Anomaly;
        }
    }

    private static void FlagLoadCycleFuelAnomalies(List<VehicleTripDetectionResultDTO> trips, VehicleTripSettingsDTO settings)
    {
        var orderedTrips = trips.OrderBy(t => t.StartTimeUtc).ToList();
        for (var index = 0; index < orderedTrips.Count - 1; index += 2)
        {
            var loadedTrip = orderedTrips[index];
            var emptyTrip = orderedTrips[index + 1];

            if (!loadedTrip.FuelRateKmPerLiter.HasValue || !emptyTrip.FuelRateKmPerLiter.HasValue)
            {
                continue;
            }

            if (loadedTrip.FuelRateKmPerLiter.Value <= settings.ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter
                && emptyTrip.FuelRateKmPerLiter.Value >= settings.ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter
                && emptyTrip.FuelRateKmPerLiter.Value > loadedTrip.FuelRateKmPerLiter.Value)
            {
                loadedTrip.AnomalyFlags |= VehicleTripAnomalyType.SuspiciousFuelRate;
                emptyTrip.AnomalyFlags |= VehicleTripAnomalyType.SuspiciousFuelRate;
            }
        }
    }

    private static string ResolveConfidenceBand(decimal score, VehicleTripSettingsDTO settings)
    {
        return score >= settings.ConfidenceHighBandThreshold
            ? "High"
            : score >= settings.ConfidenceMediumBandThreshold
                ? "Medium"
                : "Low";
    }
}