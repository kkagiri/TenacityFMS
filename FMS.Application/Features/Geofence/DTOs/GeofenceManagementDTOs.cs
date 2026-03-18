using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Geofence.DTOs;

/// <summary>
/// DTO for GPS Geofence cached from GPSGate
/// </summary>
public class GpsGeofenceDTO
{
    public int Id { get; set; }
    public int ExternalGeofenceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string GeofenceType { get; set; } = "Circle";
    public string? GeometryJson { get; set; }
    public decimal? CenterLatitude { get; set; }
    public decimal? CenterLongitude { get; set; }
    public decimal? RadiusMeters { get; set; }
    public string Classification { get; set; } = "Unknown";
    public bool IsActive { get; set; } = true;
    public bool IsAssignedToSite { get; set; }
    public int? SiteId { get; set; }
    public string? SiteName { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO for GPS Geofence Group cached from GPSGate
/// </summary>
public class GpsGeofenceGroupDTO
{
    public int Id { get; set; }
    public int ExternalGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Colour { get; set; }
    public bool IsPinned { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>
    /// When true, fueling is allowed within geofences of this group (global policy)
    /// </summary>
    public bool IsAllowedForFueling { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<GpsGeofenceDTO> Geofences { get; set; } = new();
    public int GeofenceCount { get; set; }
}

/// <summary>
/// DTO for assigning a geofence to a fueling rule set
/// </summary>
public class FuelingRuleSetGeofenceAssignmentDTO
{
    public int Id { get; set; }
    public int FuelingRuleSetId { get; set; }
    public int GeofenceId { get; set; }
    public string? GeofenceName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

/// <summary>
/// DTO for assigning a geofence group to a fueling rule set
/// </summary>
public class FuelingRuleSetGeofenceGroupAssignmentDTO
{
    public int Id { get; set; }
    public int FuelingRuleSetId { get; set; }
    public int GeofenceGroupId { get; set; }
    public string? GeofenceGroupName { get; set; }
    public int GeofenceCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

/// <summary>
/// DTO for fueling rule set geofence configuration
/// </summary>
public class FuelingRuleSetGeofenceConfigDTO
{
    public int FuelingRuleSetId { get; set; }
    public string FuelingRuleSetName { get; set; } = string.Empty;
    public bool IsGeofenceValidationEnabled { get; set; }
    public bool RequireTankerInGeofence { get; set; }
    public bool RequireOperatorInGeofence { get; set; }
    public bool RequireVehicleInGeofence { get; set; }
    public List<FuelingRuleSetGeofenceAssignmentDTO> GeofenceAssignments { get; set; } = new();
    public List<FuelingRuleSetGeofenceGroupAssignmentDTO> GeofenceGroupAssignments { get; set; } = new();
}

/// <summary>
/// Request DTO for syncing geofences from GPSGate
/// </summary>
public class SyncGeofencesRequestDTO
{
    /// <summary>
    /// Whether to force a full sync (delete and re-sync all)
    /// </summary>
    public bool ForceFullSync { get; set; }

    /// <summary>
    /// Specific group IDs to sync. If null or empty, syncs all groups.
    /// </summary>
    public List<int>? GroupIds { get; set; }
}

/// <summary>
/// DTO for a GPSGate group available for sync (lightweight, from GPSGate API)
/// </summary>
public class AvailableGeofenceGroupDTO
{
    public int ExternalGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Colour { get; set; }
    public int GeofenceCount { get; set; }
    /// <summary>
    /// Whether this group is already synced to the local database
    /// </summary>
    public bool IsSynced { get; set; }
    /// <summary>
    /// Local database ID if synced
    /// </summary>
    public int? LocalId { get; set; }
    /// <summary>
    /// Whether this group is allowed for fueling (only applicable if synced)
    /// </summary>
    public bool IsAllowedForFueling { get; set; }
    /// <summary>
    /// Last sync time (only applicable if synced)
    /// </summary>
    public DateTime? LastSyncedAt { get; set; }
}

/// <summary>
/// Response DTO for sync operation
/// </summary>
public class SyncGeofencesResponseDTO
{
    /// <summary>
    /// Unique job ID for tracking the background sync operation
    /// </summary>
    public string? JobId { get; set; }

    /// <summary>
    /// Current job status: Queued, Running, Completed, Failed, Cancelled
    /// </summary>
    public string Status { get; set; } = "Queued";

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public int ProgressPercent { get; set; }

    /// <summary>
    /// Human-readable status message
    /// </summary>
    public string? StatusMessage { get; set; }

    public int GeofencesSynced { get; set; }
    public int GroupsSynced { get; set; }
    public int TotalGeofences { get; set; }
    public int TotalGroups { get; set; }
    public int FailedCount { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime SyncedAt { get; set; }
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Estimated time remaining in seconds (only during running state)
    /// </summary>
    public double? EstimatedSecondsRemaining { get; set; }
}

/// <summary>
/// Request DTO for updating fueling rule set geofence configuration
/// </summary>
public class UpdateRuleSetGeofenceConfigRequestDTO
{
    public int FuelingRuleSetId { get; set; }
    public bool IsGeofenceValidationEnabled { get; set; }
    public bool RequireTankerInGeofence { get; set; }
    public bool RequireOperatorInGeofence { get; set; }
    public bool RequireVehicleInGeofence { get; set; }
    public List<int> GeofenceIds { get; set; } = new();
    public List<int> GeofenceGroupIds { get; set; } = new();
}

/// <summary>
/// DTO for fixed location vehicle configuration
/// </summary>
public class FixedLocationVehicleDTO
{
    public int VehicleId { get; set; }
    public string HyoungNo { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public bool IsFixedLocation { get; set; }
    public decimal? FixedLatitude { get; set; }
    public decimal? FixedLongitude { get; set; }
    public decimal? FixedLocationRadiusMeters { get; set; }
    public string? FixedLocationName { get; set; }
    public DateTime? FixedLocationLastVerifiedAt { get; set; }
    public string? FixedLocationVerifiedBy { get; set; }
    public bool RequireProximityValidation { get; set; }
}

/// <summary>
/// Request DTO for updating fixed location vehicle
/// </summary>
public class UpdateFixedLocationVehicleRequestDTO
{
    public int VehicleId { get; set; }
    public bool IsFixedLocation { get; set; }
    public decimal? FixedLatitude { get; set; }
    public decimal? FixedLongitude { get; set; }
    public decimal? FixedLocationRadiusMeters { get; set; }
    public string? FixedLocationName { get; set; }
    public bool RequireProximityValidation { get; set; } = true;
}

/// <summary>
/// Request DTO for enabling temporary location validation bypass
/// </summary>
public class EnableTemporaryBypassRequestDTO
{
    /// <summary>
    /// Duration of the bypass in minutes (default: 5, null for permanent until cancelled)
    /// </summary>
    public int? DurationMinutes { get; set; } = 5;

    /// <summary>
    /// Optional reason for enabling the bypass
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Type of bypass: 'All', 'Vehicle', 'User' (default: 'All')
    /// </summary>
    public string BypassType { get; set; } = "All";

    /// <summary>
    /// Vehicle ID(s) for vehicle-specific bypass (required when BypassType = 'Vehicle')
    /// </summary>
    public List<int>? VehicleIds { get; set; }

    /// <summary>
    /// User ID(s) for user-specific bypass (required when BypassType = 'User')
    /// </summary>
    public List<string>? UserIds { get; set; }
}

/// <summary>
/// Response DTO for temporary bypass status
/// </summary>
public class TemporaryBypassStatusDTO
{
    /// <summary>
    /// Whether a system-wide temporary bypass is currently active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// When the system-wide bypass will expire (null if not active)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Who enabled the bypass
    /// </summary>
    public string? EnabledBy { get; set; }

    /// <summary>
    /// When the bypass was enabled
    /// </summary>
    public DateTime? EnabledAt { get; set; }

    /// <summary>
    /// Reason for the bypass
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// List of active vehicle-specific bypasses
    /// </summary>
    public List<VehicleBypassDTO>? VehicleBypasses { get; set; }

    /// <summary>
    /// List of active user-specific bypasses
    /// </summary>
    public List<UserBypassDTO>? UserBypasses { get; set; }

    /// <summary>
    /// Total count of active bypasses (system + vehicle + user)
    /// </summary>
    public int ActiveBypassCount =>
        (IsActive ? 1 : 0) +
        (VehicleBypasses?.Count ?? 0) +
        (UserBypasses?.Count ?? 0);

    /// <summary>
    /// Remaining time in minutes (calculated)
    /// </summary>
    public int? RemainingMinutes
    {
        get
        {
            if (!IsActive || !ExpiresAt.HasValue) return null;
            var remaining = (ExpiresAt.Value - DateTime.UtcNow).TotalMinutes;
            return remaining > 0 ? (int)Math.Ceiling(remaining) : 0;
        }
    }
}

/// <summary>
/// DTO for vehicle-specific bypass
/// </summary>
public class VehicleBypassDTO
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public string? VehicleHyoungNo { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? Reason { get; set; }
    public string? EnabledBy { get; set; }
    public DateTime EnabledAt { get; set; }

    public int? RemainingMinutes
    {
        get
        {
            if (!IsActive || !ExpiresAt.HasValue) return null;
            var remaining = (ExpiresAt.Value - DateTime.UtcNow).TotalMinutes;
            return remaining > 0 ? (int)Math.Ceiling(remaining) : 0;
        }
    }
}

/// <summary>
/// DTO for user-specific bypass
/// </summary>
public class UserBypassDTO
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? FullName { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? Reason { get; set; }
    public string? EnabledBy { get; set; }
    public DateTime EnabledAt { get; set; }

    public int? RemainingMinutes
    {
        get
        {
            if (!IsActive || !ExpiresAt.HasValue) return null;
            var remaining = (ExpiresAt.Value - DateTime.UtcNow).TotalMinutes;
            return remaining > 0 ? (int)Math.Ceiling(remaining) : 0;
        }
    }
}

/// <summary>
/// Request DTO for cancelling specific bypasses
/// </summary>
public class CancelBypassRequestDTO
{
    /// <summary>
    /// Cancel system-wide bypass
    /// </summary>
    public bool CancelSystemBypass { get; set; }

    /// <summary>
    /// Specific bypass IDs to cancel
    /// </summary>
    public List<int>? BypassIds { get; set; }

    /// <summary>
    /// Vehicle IDs to cancel bypasses for
    /// </summary>
    public List<int>? VehicleIds { get; set; }

    /// <summary>
    /// User IDs to cancel bypasses for
    /// </summary>
    public List<string>? UserIds { get; set; }
}

/// <summary>
/// Request DTO for updating a geofence group's IsAllowedForFueling flag
/// </summary>
public class UpdateGroupAllowedForFuelingRequestDTO
{
    /// <summary>
    /// Optional - GroupId is taken from the URL path parameter
    /// </summary>
    public int? GroupId { get; set; }

    /// <summary>
    /// Whether this group should be allowed for fueling operations
    /// </summary>
    public bool IsAllowedForFueling { get; set; }
}
