/**
 * File: WarningLetterListDto.cs
 * Purpose: Represents the lightweight warning letter payload used in list endpoints.
 * Dependencies: WarningLetterStatus, WarningLetterType
 * Last Modified: 2026-04-09
 */
using System;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Application.Features.WarningLetter;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterListDto
{
    public int Id { get; set; }
    public WarningLetterType LetterType { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string VehicleHyoungNo { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public DateTime LetterDate { get; set; }
    public DateTime PeriodStart { get; set; }
    public WarningLetterStatus Status { get; set; }
    public WarningLetterWorkflowStage WorkflowStage { get; set; }
    public DateTime? EmailSentAt { get; set; }
    public string? EmailRecipient { get; set; }
    public string? SignatureRequestRecipient { get; set; }
    public string? SignatureRequestCcRecipients { get; set; }
    public DateTime? ApproveLetterUploadedAt { get; set; }
    public DateTime? SignatureRequestedAt { get; set; }
    public DateTime? SignedCopyUploadedAt { get; set; }
    public DateTime? EmployeeAcknowledgedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}