/**
 * File: VehicleTripDetectionResultDTO.cs
 * Purpose: Carries internally detected geofence trip-leg data before persistence.
 * Dependencies: Vehicle movement profile enum.
 * Last Modified: 2026-03-10
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripDetectionResultDTO
{
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public int? OriginSiteId { get; set; }
    public int? DestinationSiteId { get; set; }
    public int? OriginGeofenceId { get; set; }
    public int? DestinationGeofenceId { get; set; }
    public decimal StartLatitude { get; set; }
    public decimal StartLongitude { get; set; }
    public decimal EndLatitude { get; set; }
    public decimal EndLongitude { get; set; }
    public decimal DistanceKm { get; set; }
    public decimal DurationMinutes { get; set; }
    public decimal? MaxSpeedKph { get; set; }
    public VehicleTripStatus Status { get; set; } = VehicleTripStatus.Completed;
    public VehicleMovementProfile MovementProfile { get; set; } = VehicleMovementProfile.Geofence;
    public string DetectionMode { get; set; } = "Geofence";
    public int? StartTrackInfoId { get; set; }
    public int? EndTrackInfoId { get; set; }
    public decimal? FuelAtDeparture { get; set; }
    public decimal? FuelAtArrival { get; set; }
    public decimal? FuelConsumed { get; set; }
    public decimal? FuelRateKmPerLiter { get; set; }
    public bool HasFuelData { get; set; }
    public string FuelDataQuality { get; set; } = "Missing";
    public decimal? ExpectedFuelRateKmPerLiter { get; set; }
    public decimal? FuelVarianceKmPerLiter { get; set; }
    public decimal? FuelVariancePercent { get; set; }
    public VehicleTripGroupingType GroupingType { get; set; } = VehicleTripGroupingType.SingleLeg;
    public decimal ConfidenceScore { get; set; } = 1.00m;
    public string ConfidenceBand { get; set; } = "High";
    public VehicleTripAnomalyType AnomalyFlags { get; set; } = VehicleTripAnomalyType.None;
    public VehicleTripReconciliationStatus ReconciliationStatus { get; set; } = VehicleTripReconciliationStatus.Pending;
    public bool IsLowConfidence { get; set; }
    public int? ProjectPlanId { get; set; }
    public int? WorkShiftId { get; set; }
    public int? PlannedHaulRouteId { get; set; }
    public int? PlannedOriginZoneId { get; set; }
    public int? PlannedDestinationZoneId { get; set; }
    public string? PlanningMatchStatus { get; set; }
    public bool? IsOutOfBounds { get; set; }
    public bool? IsProductiveMovement { get; set; }
}
