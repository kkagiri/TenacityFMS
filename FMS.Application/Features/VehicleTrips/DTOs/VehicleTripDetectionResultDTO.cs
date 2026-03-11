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
    public VehicleMovementProfile MovementProfile { get; set; } = VehicleMovementProfile.Geofence;
    public string DetectionMode { get; set; } = "Geofence";
}
