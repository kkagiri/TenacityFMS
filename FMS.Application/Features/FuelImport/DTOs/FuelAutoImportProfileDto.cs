/**
 * File: FuelAutoImportProfileDto.cs
 * Purpose: DTO representing a single scan-path profile with independent import settings
 * Dependencies: None
 * Last Modified: 2026-03-03
 *
 * Key Properties:
 * - Id: Unique profile identifier (e.g., "heavy_report")
 * - Name: Display name (e.g., "Heavy Report")
 * - ScanPath: Single directory path to scan
 * - Per-profile schedule, batch, retry, and notification settings
 */
namespace FMS.Application.Features.FuelImport.DTOs;

/// <summary>
/// A single import profile — one scan path with its own independent settings.
/// Stored as part of a JSON array in the FuelAutoImport.Profiles config key.
/// </summary>
public class FuelAutoImportProfileDto
{
    /// <summary>Unique identifier for this profile (e.g., "heavy_report")</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Human-readable display name (e.g., "Heavy Report")</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Network share path to scan for Excel report files</summary>
    public string ScanPath { get; set; } = string.Empty;

    /// <summary>Whether this profile is active</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Interval in minutes between auto-import scan cycles (0 = manual only)</summary>
    public int IntervalMinutes { get; set; }

    /// <summary>Scheduled time for daily run (HH:mm, 24-hour). Empty = no schedule.</summary>
    public string ScheduleTime { get; set; } = string.Empty;

    /// <summary>Maximum files to process per batch (0 = unlimited)</summary>
    public int BatchSize { get; set; } = 50;

    /// <summary>Whether to auto-include failed/skipped files for retry</summary>
    public bool IncludeRetries { get; set; } = true;

    /// <summary>Whether notifications are enabled for this profile</summary>
    public bool NotificationsEnabled { get; set; }

    /// <summary>Notify on successful import completion</summary>
    public bool NotifyOnSuccess { get; set; }

    /// <summary>Notify on import failure</summary>
    public bool NotifyOnFailure { get; set; } = true;
}
