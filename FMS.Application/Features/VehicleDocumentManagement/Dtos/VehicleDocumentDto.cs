using FMS.Domain.Entities;
using System;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleDocumentDto
{
    public Guid Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleRegistration { get; set; }
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentTypeName { get; set; }
    public VehicleComplianceCategory ComplianceCategory { get; set; }
    public string ComplianceCategoryName { get; set; }
    public string DocumentNumber { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int AlertLeadDays { get; set; }
    public string IssuingAuthority { get; set; }
    public string Notes { get; set; }
    public string DocumentFileName { get; set; }
    public string DocumentFileUrl { get; set; }
    public DocumentStatus Status { get; set; }
    public int DaysUntilExpiry { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
}
