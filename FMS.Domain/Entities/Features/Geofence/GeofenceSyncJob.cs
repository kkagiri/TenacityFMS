using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.Geofence;

/// <summary>
/// Entity to track long-running geofence sync jobs
/// </summary>
[Table("geofence_sync_jobs")]
public class GeofenceSyncJob
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Unique job identifier (GUID) returned to caller
    /// </summary>
    [Required]
    [StringLength(64)]
    public string JobId { get; set; } = null!;

    /// <summary>
    /// Job status: Queued, Running, Completed, Failed, Cancelled
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Queued";

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public int ProgressPercent { get; set; } = 0;

    /// <summary>
    /// Current status message for display
    /// </summary>
    [StringLength(500)]
    public string? StatusMessage { get; set; }

    /// <summary>
    /// Number of geofences synced
    /// </summary>
    public int GeofencesSynced { get; set; } = 0;

    /// <summary>
    /// Number of groups synced
    /// </summary>
    public int GroupsSynced { get; set; } = 0;

    /// <summary>
    /// Total geofences to process (for progress calculation)
    /// </summary>
    public int TotalGeofences { get; set; } = 0;

    /// <summary>
    /// Total groups to process (for progress calculation)
    /// </summary>
    public int TotalGroups { get; set; } = 0;

    /// <summary>
    /// Number of items that failed to sync
    /// </summary>
    public int FailedCount { get; set; } = 0;

    /// <summary>
    /// Whether this was a force full sync
    /// </summary>
    public bool ForceFullSync { get; set; } = false;

    /// <summary>
    /// Error message if job failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// User who initiated the sync
    /// </summary>
    [StringLength(450)]
    public string? InitiatedBy { get; set; }

    /// <summary>
    /// When the job was created/queued
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the job started processing
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When the job completed (success or failure)
    /// </summary>
    public DateTime? CompletedAt { get; set; }
}

/// <summary>
/// Job status constants
/// </summary>
public static class SyncJobStatus
{
    public const string Queued = "Queued";
    public const string Running = "Running";
    public const string Completed = "Completed";
    public const string Failed = "Failed";
    public const string Cancelled = "Cancelled";
}
