/**
 * File: IssueAttachment.cs
 * Purpose: Domain entity for issue tracker file attachments (installation photos, calibration docs, general files)
 * Dependencies: None
 * Last Modified: 2026-02-06
 *
 * Key Properties:
 * - AttachmentCategory: "Installation" | "Calibration" | "General"
 * - StoredFileName: Unique filename on disk to avoid collisions
 */
using System;

namespace FMS.Domain.Entities;

/// <summary>
/// Represents a file attachment linked to an issue (photo, document, spreadsheet, etc.)
/// </summary>
public class IssueAttachment
{
    public int Id { get; set; }

    /// <summary>
    /// FK to the parent issue
    /// </summary>
    public int IssueId { get; set; }

    /// <summary>
    /// Original file name as uploaded by the user
    /// </summary>
    public string FileName { get; set; } = null!;

    /// <summary>
    /// Unique filename stored on disk (GUID-based to prevent collisions)
    /// </summary>
    public string StoredFileName { get; set; } = null!;

    /// <summary>
    /// Relative path to the stored file (e.g. "issues/42/abc123.jpg")
    /// </summary>
    public string FilePath { get; set; } = null!;

    /// <summary>
    /// MIME content type (e.g. "image/jpeg", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    /// </summary>
    public string ContentType { get; set; } = null!;

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// Classification of the attachment:
    /// - "Installation" : installation photos
    /// - "Calibration"  : calibration documents (photos or Excel)
    /// - "General"      : any other supporting document
    /// </summary>
    public string AttachmentCategory { get; set; } = "General";

    /// <summary>
    /// Optional description or note about the attachment
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// User ID who uploaded the attachment
    /// </summary>
    public string UploadedBy { get; set; } = null!;

    /// <summary>
    /// Timestamp when the file was uploaded (UTC)
    /// </summary>
    public DateTime UploadedAt { get; set; }

    // ========== Navigation ==========
    public virtual Issuetracker Issue { get; set; } = null!;
}
