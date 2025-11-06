using System;

namespace FMS.Application.Features.VehicleMaintenance.DTOs;

/// <summary>
/// Data Transfer Object for Maintenance Schedule Configuration
/// </summary>
public class MaintenanceScheduleDTO
{
    public int ScheduleId { get; set; }
    public string MaintenanceType { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? IntervalKilometers { get; set; }
    public int? IntervalDays { get; set; }
    public decimal? WarningThresholdKm { get; set; }
    public int? WarningThresholdDays { get; set; }
    public decimal? EstimatedCost { get; set; }
    public int? VehicleTypeId { get; set; }
    public string? VehicleTypeName { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ApplyToAllVehicles { get; set; } = true;
    public int? VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public int DefaultPriority { get; set; } = 2;
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
}
