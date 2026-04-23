/**
 * File: IssueCompletionRecord.cs
 * Purpose: Stores structured completion data captured when a technician marks an issue complete
 * Dependencies: FMS.Domain.Entities
 * Last Modified: 2026-02-21
 *
 * Key Properties:
 * - IssueId: The issue being completed
 * - TemplateActionId: Which action was taken (nullable for "Other")
 * - ActionName: Denormalized action name — survives if action is later deleted
 * - RootCause: Free text root cause description
 * - Device fields: Old/new device type, IMEI, phone number, source vehicle
 * - Camera fields: Camera IMEI, position (Front/Rear/Both), SIM card number
 */
using System;

namespace FMS.Domain.Entities;

/// <summary>
/// Structured completion record — one per action taken during issue completion.
/// Multiple records can exist per issue (e.g., replaced device AND installed camera).
/// </summary>
public class IssueCompletionRecord
{
    public int Id { get; set; }

    /// <summary>
    /// The issue this completion record belongs to
    /// </summary>
    public int IssueId { get; set; }

    /// <summary>
    /// The template action selected (null when "Other" is chosen)
    /// </summary>
    public int? TemplateActionId { get; set; }

    /// <summary>
    /// Denormalized action name — preserved even if the template action is later deleted
    /// </summary>
    public string ActionName { get; set; } = null!;

    /// <summary>
    /// Root cause description (e.g., "Battery cable disconnected due to rusted terminal")
    /// </summary>
    public string? RootCause { get; set; }

    /// <summary>
    /// Action-specific notes
    /// </summary>
    public string? Notes { get; set; }

    // ===== Device Change Fields =====

    /// <summary>
    /// Old device type name (e.g., "FMB630", "ES2 Sensor", "Ligo Sensor")
    /// </summary>
    public string? OldDeviceType { get; set; }

    /// <summary>
    /// IMEI of the old/removed device
    /// </summary>
    public string? OldDeviceImei { get; set; }

    /// <summary>
    /// New/replacement device type name
    /// </summary>
    public string? NewDeviceType { get; set; }

    /// <summary>
    /// IMEI of the new/replacement device
    /// </summary>
    public string? NewDeviceImei { get; set; }

    /// <summary>
    /// Phone/SIM number for the new device
    /// </summary>
    public string? DevicePhoneNumber { get; set; }

    /// <summary>
    /// Vehicle ID the replacement device was removed from (e.g., "removed from BD06")
    /// </summary>
    public int? SourceVehicleId { get; set; }

    // ===== Camera Installation Fields =====

    /// <summary>
    /// Camera IMEI number (e.g., "900000400094")
    /// </summary>
    public string? CameraImei { get; set; }

    /// <summary>
    /// Camera position: Front, Rear, Both
    /// </summary>
    public string? CameraPosition { get; set; }

    /// <summary>
    /// Camera SIM card number
    /// </summary>
    public string? CameraSimNumber { get; set; }

    // ===== Sensor Replacement Fields =====

    /// <summary>
    /// Old sensor type removed (e.g., "ES2", "Ligo", "Capacitive", "DUT-E")
    /// </summary>
    public string? OldSensorType { get; set; }

    /// <summary>
    /// New sensor type installed (e.g., "Ligo", "ES2", "Omnicomm")
    /// </summary>
    public string? NewSensorType { get; set; }

    /// <summary>
    /// Reason for sensor replacement (e.g., "Faulty", "Upgrade", "Missing", "Other")
    /// </summary>
    public string? SensorReason { get; set; }

    // ===== Sensor Calibration Fields =====

    /// <summary>
    /// Calibration outcome (e.g., "Pass", "Fail", "Partial")
    /// </summary>
    public string? CalibrationResult { get; set; }

    /// <summary>
    /// Free text catch-all for anything that doesn't fit the structured fields
    /// </summary>
    public string? AdditionalNotes { get; set; }

    /// <summary>
    /// User ID who completed the action
    /// </summary>
    public string CompletedByUserId { get; set; } = null!;

    /// <summary>
    /// Username (denormalized for display)
    /// </summary>
    public string? CompletedByUserName { get; set; }

    /// <summary>
    /// When this completion record was created (UTC)
    /// </summary>
    public DateTime CompletedAt { get; set; }

    // Navigation properties
    public virtual Issuetracker Issue { get; set; } = null!;
    public virtual IssueTemplateAction? TemplateAction { get; set; }
    public virtual Vehicle? SourceVehicle { get; set; }
}
