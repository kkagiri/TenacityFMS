/**
 * File: UpdateEmployeeDocumentDto.cs
 * Purpose: Form-bound payload for updating employee documents.
 * Dependencies: IFormFile, EmployeeDocumentType
 * Last Modified: 2026-03-25
 */
using System;
using FMS.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace FMS.Application.Features.Employee.DTOs;

public class UpdateEmployeeDocumentDto
{
    public Guid Id { get; set; }
    public int EmployeeId { get; set; }
    public EmployeeDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int AlertLeadDays { get; set; } = 30;
    public string? IssuingAuthority { get; set; }
    public string? Notes { get; set; }
    public IFormFile? DocumentFile { get; set; }
    public string? UserId { get; set; }
}