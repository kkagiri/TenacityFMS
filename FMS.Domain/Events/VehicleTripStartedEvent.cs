/**
 * File: VehicleTripStartedEvent.cs
 * Purpose: Domain event raised when a vehicle trip is first detected (departure from origin site).
 * Dependencies: MediatR.INotification.
 * Last Modified: 2026-03-17
 */
using System;
using MediatR;

namespace FMS.Domain.Events;

public class VehicleTripStartedEvent : INotification
{
    public int? VehicleTripGroupId { get; set; }
    public int VehicleId { get; set; }
    public int? OriginSiteId { get; set; }
    public string OriginSiteName { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public decimal StartLatitude { get; set; }
    public decimal StartLongitude { get; set; }
}
