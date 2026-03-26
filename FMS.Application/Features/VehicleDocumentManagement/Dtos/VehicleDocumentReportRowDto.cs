/**
 * File: VehicleDocumentReportRowDto.cs
 * Purpose: Defines flattened rows returned by the vehicle document compliance report endpoint.
 * Dependencies: Domain enums.
 * Last Modified: 2026-03-25
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleDocumentReportRowDto
{
    public Guid Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleRegistration { get; set; } = string.Empty;
    public int? SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public int? VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public VehicleComplianceCategory ComplianceCategory { get; set; }
    public string ComplianceCategoryName { get; set; } = string.Empty;
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentTypeName { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public string IssuingAuthority { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int AlertLeadDays { get; set; }
    public DocumentStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int DaysUntilExpiry { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}