/**
 * File: VehicleTripGroupedDetectionDTO.cs
 * Purpose: Internal grouped representation of detected trip legs before persistence.
 * Dependencies: Vehicle trip detection DTO, grouping/anomaly enums.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripGroupedDetectionDTO
{
    public DateTime TripDate { get; set; }
    public int? OriginSiteId { get; set; }
    public int? DestinationSiteId { get; set; }
    public decimal TotalDistanceKm { get; set; }
    public decimal TotalDurationMinutes { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public VehicleMovementProfile MovementProfile { get; set; }
    public string DetectionMode { get; set; } = "Geofence";
    public VehicleTripGroupingType GroupingType { get; set; } = VehicleTripGroupingType.SingleLeg;
    public decimal ConfidenceScore { get; set; } = 1.00m;
    public string ConfidenceBand { get; set; } = "High";
    public VehicleTripAnomalyType AnomalyFlags { get; set; } = VehicleTripAnomalyType.None;
    public VehicleTripReconciliationStatus ReconciliationStatus { get; set; } = VehicleTripReconciliationStatus.Pending;
    public int? ProjectPlanId { get; set; }
    public int? WorkShiftId { get; set; }
    public int? PlannedHaulRouteId { get; set; }
    public int? PlannedOriginZoneId { get; set; }
    public int? PlannedDestinationZoneId { get; set; }
    public string? PlanningMatchStatus { get; set; }
    public bool? IsOutOfBounds { get; set; }
    public bool? IsProductiveMovement { get; set; }
    public List<VehicleTripDetectionResultDTO> Trips { get; set; } = new();
}
