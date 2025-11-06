using System;

namespace FMS.Application.Features.VehicleMaintenance.DTOs;

/// <summary>
/// Data Transfer Object for Maintenance Issue
/// </summary>
public class MaintenanceIssueDTO
{
    public int IssueId { get; set; }
    public int MaintenanceId { get; set; }
    public string IssueType { get; set; } = null!;
    public string Severity { get; set; } = "Medium";
    public string Description { get; set; } = null!;
    public string Status { get; set; } = "Open";
    public string? ResponsiblePerson { get; set; }
    public string? ReportedBy { get; set; }
    public DateTime DateReported { get; set; }
    public DateTime? DateResolved { get; set; }
    public string? ResolutionNotes { get; set; }
    public decimal? AdditionalCost { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
}
