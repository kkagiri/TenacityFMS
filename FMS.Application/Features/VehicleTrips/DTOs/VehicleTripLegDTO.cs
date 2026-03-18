/**
 * File: VehicleTripLegDTO.cs
 * Purpose: Read model for an individual persisted vehicle trip leg inside a trip group.
 * Dependencies: Vehicle movement profile enum.
 * Last Modified: 2026-03-11
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripLegDTO
{
    public int VehicleTripId { get; set; }
    public int SequenceNo { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public int? OriginSiteId { get; set; }
    public string? OriginSiteName { get; set; }
    public string OriginDisplayName { get; set; } = "Unknown";
    public int? DestinationSiteId { get; set; }
    public string? DestinationSiteName { get; set; }
    public string DestinationDisplayName { get; set; } = "Unknown";
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
    public VehicleMovementProfile MovementProfile { get; set; }
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
    public bool IsManualOverride { get; set; }
    public VehicleTripGroupingType GroupingType { get; set; } = VehicleTripGroupingType.SingleLeg;
    public decimal ConfidenceScore { get; set; } = 1.00m;
    public string ConfidenceBand { get; set; } = "High";
    public VehicleTripAnomalyType AnomalyFlags { get; set; } = VehicleTripAnomalyType.None;
    public VehicleTripReconciliationStatus ReconciliationStatus { get; set; } = VehicleTripReconciliationStatus.Pending;
    public bool? IsOutOfBounds { get; set; }
    public bool? IsProductiveMovement { get; set; }
    public string? PlanningMatchStatus { get; set; }
}
