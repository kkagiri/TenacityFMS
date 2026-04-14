using FMS.Domain.Entities;
using System;

#nullable disable

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleDocumentDto
{
    public Guid Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleRegistration { get; set; } = string.Empty;
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentTypeName { get; set; } = string.Empty;
    public VehicleComplianceCategory ComplianceCategory { get; set; }
    public string ComplianceCategoryName { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int AlertLeadDays { get; set; }
    public string IssuingAuthority { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string DocumentFileName { get; set; } = string.Empty;
    public string DocumentFileUrl { get; set; } = string.Empty;
    public DocumentStatus Status { get; set; }
    public int DaysUntilExpiry { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string CreatedByDisplay { get; set; } = string.Empty;
}
