/**
 * File: IssueTemplateAction.cs
 * Purpose: Admin-configurable completion actions linked to issue templates
 * Dependencies: FMS.Domain.Entities
 * Last Modified: 2026-02-21
 *
 * Key Properties:
 * - IssueTemplateId: Which template this action belongs to
 * - Name: Display name ("Replace Sensor", "Transfer Device", etc.)
 * - ActionType: General, DeviceChange, or CameraInstall — controls which UI fields appear
 * - RequiresDeviceDetails/RequiresSourceVehicle/RequiresCameraDetails: field visibility flags
 */
using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

/// <summary>
/// Defines a configurable completion action for an issue template.
/// Admins create these per-template so technicians pick relevant actions at completion time.
/// </summary>
public class IssueTemplateAction
{
    public int Id { get; set; }

    /// <summary>
    /// Parent template this action belongs to
    /// </summary>
    public int IssueTemplateId { get; set; }

    /// <summary>
    /// Display name (e.g., "Replace Sensor", "Reconnect Wire", "Transfer Device")
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Action type controls which extra fields appear in the completion form.
    /// Values: General, DeviceChange, CameraInstall
    /// </summary>
    public string ActionType { get; set; } = "General";

    /// <summary>
    /// Help text shown to user when selecting this action
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// If true, old/new device IMEI + type + phone number fields are shown
    /// </summary>
    [Obsolete("Use ActionType-driven workflow rendering instead.")]
    public bool RequiresDeviceDetails { get; set; }

    /// <summary>
    /// If true, a vehicle picker is shown for "device removed from" vehicle
    /// </summary>
    [Obsolete("Use ActionType-driven workflow rendering instead.")]
    public bool RequiresSourceVehicle { get; set; }

    /// <summary>
    /// If true, camera IMEI, SIM, and position fields are shown
    /// </summary>
    [Obsolete("Use ActionType-driven workflow rendering instead.")]
    public bool RequiresCameraDetails { get; set; }

    /// <summary>
    /// Optional workflow stage for the future staged workflow model.
    /// </summary>
    public int? StageId { get; set; }

    /// <summary>
    /// Canvas X position for workflow editing surfaces.
    /// </summary>
    public double? PositionX { get; set; }

    /// <summary>
    /// Canvas Y position for workflow editing surfaces.
    /// </summary>
    public double? PositionY { get; set; }

    /// <summary>
    /// Display ordering within the template's action list
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Soft-disable without deleting — admin can reactivate later
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Issuetemplate IssueTemplate { get; set; } = null!;

    public virtual IssueTemplateWorkflowStage? Stage { get; set; }

    public virtual ICollection<IssueCompletionRecord> CompletionRecords { get; set; } = new List<IssueCompletionRecord>();
}
