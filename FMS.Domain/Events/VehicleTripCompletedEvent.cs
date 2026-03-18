/**
 * File: VehicleTripCompletedEvent.cs
 * Purpose: Domain event raised when a vehicle trip is completed (arrival at destination site).
 * Dependencies: MediatR.INotification.
 * Last Modified: 2026-03-17
 */
using System;
using MediatR;

namespace FMS.Domain.Events;

public class VehicleTripCompletedEvent : INotification
{
    public int? VehicleTripGroupId { get; set; }
    public int VehicleId { get; set; }
    public int? OriginSiteId { get; set; }
    public int? DestinationSiteId { get; set; }
    public string OriginSiteName { get; set; }
    public string DestinationSiteName { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public decimal DistanceKm { get; set; }
    public decimal? MaxSpeedKph { get; set; }
    public TimeSpan Duration { get; set; }
}
