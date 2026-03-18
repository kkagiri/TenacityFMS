/**
 * File: VehicleTripCompletedEventDTO.cs
 * Purpose: Defines the real-time payload published when a vehicle trip completes.
 * Dependencies: VehicleTripStatus.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripCompletedEventDTO
{
    public int VehicleId { get; set; }
    public string? VehicleLabel { get; set; }
    public int? VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public DateTime CompletedAtUtc { get; set; }
    public int? DestinationSiteId { get; set; }
    public string? DestinationSiteName { get; set; }
    public decimal EndLatitude { get; set; }
    public decimal EndLongitude { get; set; }
    public decimal? DistanceKm { get; set; }
    public decimal? DurationMinutes { get; set; }
    public decimal? FuelConsumed { get; set; }
    public VehicleTripStatus Status { get; set; } = VehicleTripStatus.Completed;
}
