/**
 * File: VehicleTripInProgressEvent.cs
 * Purpose: Domain event raised when a vehicle trip receives in-progress tracking updates.
 * Dependencies: MediatR.INotification.
 * Last Modified: 2026-03-17
 */
using System;
using MediatR;

namespace FMS.Domain.Events;

public class VehicleTripInProgressEvent : INotification
{
    public int? VehicleTripGroupId { get; set; }
    public int VehicleId { get; set; }
    public decimal CurrentLatitude { get; set; }
    public decimal CurrentLongitude { get; set; }
    public decimal DistanceSoFarKm { get; set; }
    public decimal CurrentSpeedKph { get; set; }
    public DateTime TimestampUtc { get; set; }
}
