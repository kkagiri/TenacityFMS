/**
 * File:          BulkDocumentSaveDto.cs
 * Purpose:       DTO for saving user-verified bulk document uploads.
 * Dependencies:  None
 * Last Modified: 2025-07-14
 *
 * Key Properties:
 * - Documents: List of verified document items to save
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class BulkDocumentSaveDto
{
    public List<BulkDocumentSaveItemDto> Documents { get; set; } = new();
    public string? UserId { get; set; }
}

public class BulkDocumentSaveItemDto
{
    public string FileToken { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string IssuingAuthority { get; set; } = string.Empty;
    public int AlertLeadDays { get; set; } = 30;
    public string? Notes { get; set; }
}

public class BulkDocumentSaveResultDto
{
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
