/**
 * File: VehicleTripListItemDTO.cs
 * Purpose: Read model for trip management lists across vehicles.
 * Dependencies: Vehicle movement profile enum.
 * Last Modified: 2026-03-10
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripListItemDTO
{
    public int VehicleTripGroupId { get; set; }
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public DateTime TripDate { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public string OriginDisplayName { get; set; } = "Unknown";
    public string DestinationDisplayName { get; set; } = "Unknown";
    public int TripCount { get; set; }
    public decimal TotalDistanceKm { get; set; }
    public decimal TotalDurationMinutes { get; set; }
    public VehicleMovementProfile MovementProfile { get; set; }
    public string DetectionMode { get; set; } = "Geofence";
}