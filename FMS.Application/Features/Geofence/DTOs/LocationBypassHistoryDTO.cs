using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Geofence.DTOs;

/// <summary>
/// DTO for location bypass history record
/// </summary>
public class LocationBypassHistoryDTO
{
    public int Id { get; set; }

    /// <summary>
    /// Type of bypass: 'All', 'Vehicle', 'User'
    /// </summary>
    public string BypassType { get; set; } = string.Empty;

    /// <summary>
    /// Vehicle ID if bypass was for a specific vehicle
    /// </summary>
    public int? VehicleId { get; set; }

    /// <summary>
    /// Vehicle display name
    /// </summary>
    public string? VehicleName { get; set; }

    /// <summary>
    /// Vehicle VehicleCode
    /// </summary>
    public string? VehicleCode { get; set; }

    /// <summary>
    /// User ID if bypass was for a specific user
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// User display name
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// Whether this bypass is currently active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// When the bypass expires (null for permanent)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Reason for the bypass
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Who enabled this bypass
    /// </summary>
    public string? EnabledBy { get; set; }

    /// <summary>
    /// When the bypass was enabled
    /// </summary>
    public DateTime EnabledAt { get; set; }

    /// <summary>
    /// Who cancelled this bypass (if cancelled)
    /// </summary>
    public string? CancelledBy { get; set; }

    /// <summary>
    /// When the bypass was cancelled (if cancelled)
    /// </summary>
    public DateTime? CancelledAt { get; set; }

    /// <summary>
    /// Status of the bypass: Active, Expired, Cancelled
    /// </summary>
    public string Status
    {
        get
        {
            if (CancelledAt.HasValue)
                return "Cancelled";
            if (!IsActive)
                return "Inactive";
            if (ExpiresAt.HasValue && ExpiresAt.Value <= DateTime.UtcNow)
                return "Expired";
            return "Active";
        }
    }

    /// <summary>
    /// Duration in minutes (calculated from EnabledAt to ExpiresAt or CancelledAt)
    /// </summary>
    public int? DurationMinutes
    {
        get
        {
            if (!ExpiresAt.HasValue) return null;
            return (int)(ExpiresAt.Value - EnabledAt).TotalMinutes;
        }
    }

    /// <summary>
    /// Actual duration the bypass was active (until cancelled or expired)
    /// </summary>
    public int? ActualDurationMinutes
    {
        get
        {
            var endTime = CancelledAt ?? ExpiresAt ?? DateTime.UtcNow;
            if (endTime < EnabledAt) return 0;
            return (int)(endTime - EnabledAt).TotalMinutes;
        }
    }

    /// <summary>
    /// Additional notes
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Response DTO for paginated bypass history
/// </summary>
public class LocationBypassHistoryResponseDTO
{
    public List<LocationBypassHistoryDTO> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
