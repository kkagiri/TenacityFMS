using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleMaintenance.DTOs;

/// <summary>
/// Data Transfer Object for Vehicle Maintenance
/// </summary>
public class VehicleMaintenanceDTO
{
    public int MaintenanceId { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public string? NumberPlate { get; set; }
    public string MaintenanceType { get; set; } = null!;
    public string Status { get; set; } = "Scheduled";
    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal? OdometerAtSchedule { get; set; }
    public decimal? OdometerAtCompletion { get; set; }
    public decimal? NextDueOdometer { get; set; }
    public DateTime? NextDueDate { get; set; }
    public decimal? Cost { get; set; }
    public string? ServiceProvider { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public string? IssueNote { get; set; }
    public int Priority { get; set; } = 2;
    public bool IsOverdue { get; set; } = false;
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public string? ResponsiblePerson { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
    public int? MaintenanceScheduleId { get; set; }
    public string? MaintenanceScheduleName { get; set; }

    // Related data
    public List<MaintenanceIssueDTO>? Issues { get; set; }
}
