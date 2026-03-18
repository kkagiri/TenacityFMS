/**
 * File: VehicleTripSettingsDTO.cs
 * Purpose: Represents configurable runtime settings for the VehicleTrips feature.
 * Dependencies: System.
 * Last Modified: 2026-03-14
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripSettingsDTO
{
    public bool EnableRealtimeStateMachineExecution { get; set; } = true;
    public bool DefaultEnableRealtimeStateMachineExecution { get; set; } = true;
    public bool EnableScheduledReconciliation { get; set; } = true;
    public bool DefaultEnableScheduledReconciliation { get; set; } = true;
    public string ReconciliationDailyRunTimeLocal { get; set; } = "00:30";
    public string DefaultReconciliationDailyRunTimeLocal { get; set; } = "00:30";
    public int ReconciliationLookbackDays { get; set; } = 1;
    public int DefaultReconciliationLookbackDays { get; set; } = 1;
    public bool EnableFuelContextEnrichment { get; set; } = true;
    public bool DefaultEnableFuelContextEnrichment { get; set; } = true;
    public decimal FuelLookupWindowHours { get; set; } = 2.0m;
    public decimal DefaultFuelLookupWindowHours { get; set; } = 2.0m;
    public decimal ConfidenceUnknownEndpointPenalty { get; set; } = 0.25m;
    public decimal DefaultConfidenceUnknownEndpointPenalty { get; set; } = 0.25m;
    public decimal ConfidenceShortTripPenalty { get; set; } = 0.10m;
    public decimal DefaultConfidenceShortTripPenalty { get; set; } = 0.10m;
    public decimal ConfidenceHighSpeedPenalty { get; set; } = 0.20m;
    public decimal DefaultConfidenceHighSpeedPenalty { get; set; } = 0.20m;
    public decimal ConfidenceMissingFuelPenalty { get; set; } = 0.10m;
    public decimal DefaultConfidenceMissingFuelPenalty { get; set; } = 0.10m;
    public decimal ConfidenceWeakFuelPenalty { get; set; } = 0.05m;
    public decimal DefaultConfidenceWeakFuelPenalty { get; set; } = 0.05m;
    public decimal ConfidenceMinimumScore { get; set; } = 0.10m;
    public decimal DefaultConfidenceMinimumScore { get; set; } = 0.10m;
    public decimal ConfidenceHighBandThreshold { get; set; } = 0.85m;
    public decimal DefaultConfidenceHighBandThreshold { get; set; } = 0.85m;
    public decimal ConfidenceMediumBandThreshold { get; set; } = 0.60m;
    public decimal DefaultConfidenceMediumBandThreshold { get; set; } = 0.60m;
    public decimal ConfidenceHighSpeedThresholdKph { get; set; } = 120m;
    public decimal DefaultConfidenceHighSpeedThresholdKph { get; set; } = 120m;
    public decimal ConfidenceShortTripDistanceThresholdKm { get; set; } = 1.00m;
    public decimal DefaultConfidenceShortTripDistanceThresholdKm { get; set; } = 1.00m;
    public decimal ConfidenceShortTripDurationThresholdMinutes { get; set; } = 5.00m;
    public decimal DefaultConfidenceShortTripDurationThresholdMinutes { get; set; } = 5.00m;
    public decimal ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter { get; set; } = 3.00m;
    public decimal DefaultConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter { get; set; } = 3.00m;
    public decimal ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter { get; set; } = 3.50m;
    public decimal DefaultConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter { get; set; } = 3.50m;
    public decimal ClusterBatchStopSpeedThresholdKph { get; set; } = 3m;
    public decimal DefaultClusterBatchStopSpeedThresholdKph { get; set; } = 3m;
    public decimal ClusterBatchMinimumStopDurationMinutes { get; set; } = 1.5m;
    public decimal DefaultClusterBatchMinimumStopDurationMinutes { get; set; } = 1.5m;
    public decimal ClusterBatchMinimumTripDistanceKm { get; set; } = 0.50m;
    public decimal DefaultClusterBatchMinimumTripDistanceKm { get; set; } = 0.50m;
    public decimal ClusterBatchMinimumTripDurationMinutes { get; set; } = 2m;
    public decimal DefaultClusterBatchMinimumTripDurationMinutes { get; set; } = 2m;
    public decimal ClusterBatchClusterRadiusMeters { get; set; } = 150m;
    public decimal DefaultClusterBatchClusterRadiusMeters { get; set; } = 150m;
    public int ClusterBatchMaxTrackPoints { get; set; } = 5000;
    public int DefaultClusterBatchMaxTrackPoints { get; set; } = 5000;
    public decimal ClusterRealtimeStopSpeedThresholdKph { get; set; } = 5m;
    public decimal DefaultClusterRealtimeStopSpeedThresholdKph { get; set; } = 5m;
    public int ClusterRealtimeStopDurationPoints { get; set; } = 3;
    public int DefaultClusterRealtimeStopDurationPoints { get; set; } = 3;
    public int ClusterRealtimeMovingDurationPoints { get; set; } = 2;
    public int DefaultClusterRealtimeMovingDurationPoints { get; set; } = 2;
    public decimal ClusterRealtimeClusterMatchRadiusKm { get; set; } = 0.15m;
    public decimal DefaultClusterRealtimeClusterMatchRadiusKm { get; set; } = 0.15m;
    public string ConfigurationKey { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime UpdatedAtUtc { get; set; }
    public string? UpdatedBy { get; set; }
}