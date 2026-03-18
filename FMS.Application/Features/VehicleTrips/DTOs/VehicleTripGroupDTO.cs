/**
 * File: VehicleTripGroupDTO.cs
 * Purpose: Read model for persisted vehicle trip group history.
 * Dependencies: Vehicle movement profile enum.
 * Last Modified: 2026-03-11
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripGroupDTO
{
    public int VehicleTripGroupId { get; set; }
    public int VehicleId { get; set; }
    public DateTime TripDate { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public int? OriginSiteId { get; set; }
    public string? OriginSiteName { get; set; }
    public string? OriginDisplayName { get; set; }
    public int? DestinationSiteId { get; set; }
    public string? DestinationSiteName { get; set; }
    public string? DestinationDisplayName { get; set; }
    public int TripCount { get; set; }
    public decimal TotalDistanceKm { get; set; }
    public decimal TotalDurationMinutes { get; set; }
    public VehicleTripStatus Status { get; set; } = VehicleTripStatus.Completed;
    public decimal? TotalFuelConsumed { get; set; }
    public decimal? FuelRateKmPerLiter { get; set; }
    public bool HasFuelData { get; set; }
    public string FuelDataQuality { get; set; } = "Missing";
    public decimal? ExpectedFuelRateKmPerLiter { get; set; }
    public decimal? FuelVarianceKmPerLiter { get; set; }
    public decimal? FuelVariancePercent { get; set; }
    public VehicleMovementProfile MovementProfile { get; set; }
    public string DetectionMode { get; set; } = "Geofence";
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
