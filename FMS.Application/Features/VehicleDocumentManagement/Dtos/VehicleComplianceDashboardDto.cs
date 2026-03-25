using System.Collections.Generic;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleComplianceDashboardDto
{
    public int TotalApplicableRequirements { get; set; }
    public int CompletedCount { get; set; }
    public int DueCount { get; set; }
    public int ExpiringSoonCount { get; set; }
    public int ExpiredCount { get; set; }
    public int MissingCount { get; set; }
    public List<VehicleComplianceGroupSummaryDto> BySite { get; set; } = new();
    public List<VehicleComplianceGroupSummaryDto> ByVehicleType { get; set; } = new();
    public List<VehicleComplianceGroupSummaryDto> ByDocumentType { get; set; } = new();
}

public class VehicleComplianceGroupSummaryDto
{
    public string GroupName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int CompletedCount { get; set; }
    public int DueCount { get; set; }
    public int ExpiringSoonCount { get; set; }
    public int ExpiredCount { get; set; }
    public int MissingCount { get; set; }
}
