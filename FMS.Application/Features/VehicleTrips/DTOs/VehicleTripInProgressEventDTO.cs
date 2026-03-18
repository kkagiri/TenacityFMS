/**
 * File: VehicleTripInProgressEventDTO.cs
 * Purpose: Defines the real-time payload published while a vehicle trip is in progress.
 * Dependencies: VehicleTripStatus.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripInProgressEventDTO
{
    public int VehicleId { get; set; }
    public string? VehicleLabel { get; set; }
    public int? VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public DateTime EventTimeUtc { get; set; }
    public int? OriginSiteId { get; set; }
    public string? OriginSiteName { get; set; }
    public int? EstimatedDestinationSiteId { get; set; }
    public string? EstimatedDestinationName { get; set; }
    public decimal CurrentLatitude { get; set; }
    public decimal CurrentLongitude { get; set; }
    public decimal? DistanceKm { get; set; }
    public decimal? DurationMinutes { get; set; }
    public VehicleTripStatus Status { get; set; } = VehicleTripStatus.InProgress;
}
