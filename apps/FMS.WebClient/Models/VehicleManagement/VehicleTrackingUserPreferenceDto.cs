using System;

namespace FMS.WebClient.Models.VehicleManagement;

/// <summary>
/// File: VehicleTrackingUserPreferenceDto.cs
/// Purpose: Represents persisted user preferences for the vehicle tracking page.
/// Dependencies: None
/// Last Modified: 2026-03-09
///
/// Key Properties:
/// - SelectedTagId: Last selected tracking tag or view identifier.
/// - WorkspaceLayoutMode: Saved panel arrangement mode.
/// - WorkspaceHorizontalSplit: Saved horizontal split percentage.
/// </summary>
public class VehicleTrackingUserPreferenceDto
{
    public int? SelectedTagId { get; set; }
    public string? SelectedTagName { get; set; }
    public string? WorkspaceLayoutMode { get; set; }
    public double? WorkspaceHorizontalSplit { get; set; }
    public double? WorkspaceVerticalSplit { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}
