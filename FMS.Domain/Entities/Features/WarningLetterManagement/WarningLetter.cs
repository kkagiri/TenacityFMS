/**
 * File: WarningLetter.cs
 * Purpose: Stores draft and issued employee warning letters for fleet compliance violations.
 * Dependencies: Employee, Vehicle, Site, User, WarningLetterType, WarningLetterStatus
 * Last Modified: 2026-04-11
 */
using System;

namespace FMS.Domain.Entities.Features.WarningLetterManagement;

public class WarningLetter
{
    public int Id { get; set; }
    public WarningLetterType LetterType { get; set; }
    public int EmployeeId { get; set; }
    public int VehicleId { get; set; }
    public int SiteId { get; set; }
    public DateTime LetterDate { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string ViolationSummary { get; set; } = null!;
    public decimal? ExpectedValue { get; set; }
    public decimal? ActualValue { get; set; }
    public decimal? ExcessValue { get; set; }
    public decimal? FuelPrice { get; set; }
    public decimal? ExcessCost { get; set; }
    public string IssuedByUserId { get; set; } = null!;
    public string IssuedByName { get; set; } = null!;
    public string? IssuedByTitle { get; set; }
    public bool HideWarningCountInSubject { get; set; }
    public string? PdfFilePath { get; set; }
    public DateTime? EmailSentAt { get; set; }
    public string? EmailRecipient { get; set; }
    public string? SignatureRequestRecipientUserId { get; set; }
    public string? SignatureRequestRecipient { get; set; }
    public string? SignatureRequestCcUserIds { get; set; }
    public string? SignatureRequestCcRecipients { get; set; }
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
    public WarningLetterStatus Status { get; set; } = WarningLetterStatus.Draft;
    public DateTime? EmployeeAcknowledgedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
    public string CreatedBy { get; set; } = null!;
    public string? ModifiedBy { get; set; }

    public virtual Employee Employee { get; set; } = null!;
    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual Site Site { get; set; } = null!;
    public virtual User IssuedByUser { get; set; } = null!;
    public virtual User CreatedByNavigation { get; set; } = null!;
    public virtual User? ModifiedByNavigation { get; set; }
}