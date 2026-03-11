/**
 * File: VehicleTripGroupDTO.cs
 * Purpose: Read model for persisted vehicle trip group history.
 * Dependencies: Vehicle movement profile enum.
 * Last Modified: 2026-03-10
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
    public VehicleMovementProfile MovementProfile { get; set; }
    public string DetectionMode { get; set; } = "Geofence";
}
