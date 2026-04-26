using System;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleMaintenance.Events;

/// <summary>
/// Domain event raised when a vehicle's odometer reading is updated
/// Can be triggered by:
/// - GPS accumulator sync
/// - FuelRefill entry
/// - PumpTransaction completion
/// - Manual update
/// </summary>
public class VehicleOdometerUpdatedEvent : INotification
{
    public int VehicleId { get; set; }
    public string? VehicleCode { get; set; }
    public decimal OldReading { get; set; }
    public decimal NewReading { get; set; }
    public OdometerSource Source { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? UserId { get; set; }

    /// <summary>
    /// If true, this update should trigger a GPS sync
    /// </summary>
    public bool ShouldSyncToGPS { get; set; } = false;
}
