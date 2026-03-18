/**
 * File: VehicleTripStartedEventDTO.cs
 * Purpose: Defines the real-time payload published when a vehicle trip starts.
 * Dependencies: VehicleTripStatus.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripStartedEventDTO
{
    public int VehicleId { get; set; }
    public string? VehicleLabel { get; set; }
    public int? VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public int? OriginSiteId { get; set; }
    public string? OriginSiteName { get; set; }
    public string? EstimatedDestinationName { get; set; }
    public decimal StartLatitude { get; set; }
    public decimal StartLongitude { get; set; }
    public VehicleTripStatus Status { get; set; } = VehicleTripStatus.InProgress;
}
