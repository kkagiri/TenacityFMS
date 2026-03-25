using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleComplianceRequirementDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public VehicleComplianceCategory ComplianceCategory { get; set; }
    public string ComplianceCategoryName { get; set; } = string.Empty;
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentTypeName { get; set; } = string.Empty;
    public VehicleComplianceTargetType TargetType { get; set; }
    public string TargetTypeName { get; set; } = string.Empty;
    public int? SiteId { get; set; }
    public string? SiteName { get; set; }
    public int? VehicleTypeId { get; set; }
    public string? VehicleTypeName { get; set; }
    public int AlertLeadDays { get; set; }
    public string DefaultIssuingAuthority { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
