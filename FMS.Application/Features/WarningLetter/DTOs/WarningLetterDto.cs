/**
 * File: WarningLetterDto.cs
 * Purpose: Represents a detailed warning letter payload for API responses.
 * Dependencies: WarningLetterStatus, WarningLetterType
 * Last Modified: 2026-04-11
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Application.Features.WarningLetter;

namespace FMS.Application.Features.WarningLetter.DTOs;

public class WarningLetterDto
{
    public int Id { get; set; }
    public WarningLetterType LetterType { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string? EmployeeWorkNo { get; set; }
    public string? EmployeeEmail { get; set; }
    public string? Position { get; set; }
    public int VehicleId { get; set; }
    public string VehicleHyoungNo { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public DateTime LetterDate { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string ViolationSummary { get; set; } = string.Empty;
    public decimal? ExpectedValue { get; set; }
    public decimal? ActualValue { get; set; }
    public decimal? ExcessValue { get; set; }
    public decimal? FuelPrice { get; set; }
    public decimal? ExcessCost { get; set; }
    public string IssuedByUserId { get; set; } = string.Empty;
    public string IssuedByName { get; set; } = string.Empty;
    public string? IssuedByTitle { get; set; }
    public string? PdfFilePath { get; set; }
    public DateTime? EmailSentAt { get; set; }
    public string? EmailRecipient { get; set; }
    public string? SignatureRequestRecipientUserId { get; set; }
    public string? SignatureRequestRecipient { get; set; }
    public List<string> SignatureRequestCcUserIds { get; set; } = new();
    public List<string> SignatureRequestCcRecipients { get; set; } = new();
    public DateTime? SignatureRequestedAt { get; set; }
    public string? SignatureRequestedBy { get; set; }
    public string? ApproveLetterFileName { get; set; }
    public string? ApproveLetterStoredFileName { get; set; }
    public string? ApproveLetterFilePath { get; set; }
    public string? ApproveLetterContentType { get; set; }
    public long? ApproveLetterFileSize { get; set; }
    public DateTime? ApproveLetterUploadedAt { get; set; }
    public string? ApproveLetterUploadedBy { get; set; }
    public string? SignedCopyFileName { get; set; }
    public string? SignedCopyStoredFileName { get; set; }
    public string? SignedCopyFilePath { get; set; }
    public string? SignedCopyContentType { get; set; }
    public long? SignedCopyFileSize { get; set; }
    public DateTime? SignedCopyUploadedAt { get; set; }
    public string? SignedCopyUploadedBy { get; set; }
    public WarningLetterStatus Status { get; set; }
    public WarningLetterWorkflowStage WorkflowStage { get; set; }
    public DateTime? EmployeeAcknowledgedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? ModifiedBy { get; set; }
}