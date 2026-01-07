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
    public bool IsActive { get; set; } = true;
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
    public bool ForceFullSync { get; set; }
}

/// <summary>
/// Response DTO for sync operation
/// </summary>
public class SyncGeofencesResponseDTO
{
    public int GeofencesSynced { get; set; }
    public int GroupsSynced { get; set; }
    public DateTime SyncedAt { get; set; }
    public string Message { get; set; } = string.Empty;
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
    /// Duration of the bypass in minutes (default: 5)
    /// </summary>
    public int DurationMinutes { get; set; } = 5;

    /// <summary>
    /// Optional reason for enabling the bypass
    /// </summary>
    public string? Reason { get; set; }
}

/// <summary>
/// Response DTO for temporary bypass status
/// </summary>
public class TemporaryBypassStatusDTO
{
    /// <summary>
    /// Whether a temporary bypass is currently active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// When the bypass will expire (null if not active)
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
