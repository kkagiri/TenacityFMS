/**
 * File: EmployeeDocumentDto.cs
 * Purpose: DTO returned to the frontend for employee documents and compliance state.
 * Dependencies: EmployeeDocumentType, DocumentStatus
 * Last Modified: 2026-03-25
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.Employee.DTOs;

public class EmployeeDocumentDto
{
    public Guid Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeWorkNo { get; set; } = string.Empty;
    public EmployeeDocumentType DocumentType { get; set; }
    public string DocumentTypeName { get; set; } = string.Empty;
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
}