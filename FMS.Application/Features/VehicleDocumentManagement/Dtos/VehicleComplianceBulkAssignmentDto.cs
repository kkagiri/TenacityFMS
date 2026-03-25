using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleComplianceBulkAssignmentDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public VehicleComplianceCategory ComplianceCategory { get; set; }

    [Required]
    public VehicleDocumentType DocumentType { get; set; }

    [Required]
    public VehicleComplianceTargetType TargetType { get; set; }

    [Required]
    [MinLength(1)]
    public List<int> TargetIds { get; set; } = new();

    [Range(0, 365)]
    public int AlertLeadDays { get; set; } = 30;

    [MaxLength(200)]
    public string? DefaultIssuingAuthority { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public string? UserId { get; set; }
}

public class VehicleComplianceBulkAssignmentResultDto
{
    public int TotalRequested { get; set; }
    public int SuccessCount { get; set; }
    public int SkippedCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> CreatedRequirementIds { get; set; } = new();
}
