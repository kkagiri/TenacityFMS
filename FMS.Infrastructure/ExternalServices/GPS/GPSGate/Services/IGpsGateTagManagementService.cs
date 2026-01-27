using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;

/// <summary>
/// Result of a tag transfer operation
/// </summary>
public class TagTransferResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? FromTagId { get; set; }
    public int? ToTagId { get; set; }
    public string? FromTagName { get; set; }
    public string? ToTagName { get; set; }
    public int GpsGateUserId { get; set; }
    public string? VehicleHyoungNo { get; set; }
    public bool AddedToNewTag { get; set; }
    public bool RemovedFromOldTag { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Service for managing GPSGate tag assignments for vehicles
/// Handles adding, removing, and moving vehicles between tags
/// </summary>
public interface IGpsGateTagManagementService
{
    /// <summary>
    /// Add a vehicle/user to a GPSGate tag
    /// </summary>
    /// <param name="gpsGateUserId">The GPSGate user ID (vehicle ID in GPSGate)</param>
    /// <param name="tagId">The GPSGate tag ID to add to</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success/failure result</returns>
    Task<FMSResponse<bool>> AddUserToTagAsync(int gpsGateUserId, int tagId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove a vehicle/user from a GPSGate tag
    /// </summary>
    /// <param name="gpsGateUserId">The GPSGate user ID (vehicle ID in GPSGate)</param>
    /// <param name="tagId">The GPSGate tag ID to remove from</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success/failure result</returns>
    Task<FMSResponse<bool>> RemoveUserFromTagAsync(int gpsGateUserId, int tagId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Move a vehicle/user from one tag to another
    /// </summary>
    /// <param name="gpsGateUserId">The GPSGate user ID (vehicle ID in GPSGate)</param>
    /// <param name="fromTagId">The GPSGate tag ID to remove from (null to skip removal)</param>
    /// <param name="toTagId">The GPSGate tag ID to add to</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Transfer result with details</returns>
    Task<FMSResponse<TagTransferResult>> MoveUserBetweenTagsAsync(
        int gpsGateUserId,
        int? fromTagId,
        int toTagId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Move a vehicle between site tags based on site configuration
    /// </summary>
    /// <param name="vehicleId">The FMS Vehicle ID</param>
    /// <param name="fromSiteId">The source site ID</param>
    /// <param name="toSiteId">The destination site ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Transfer result with details</returns>
    Task<FMSResponse<TagTransferResult>> MoveVehicleBetweenSiteTagsAsync(
        int vehicleId,
        int fromSiteId,
        int toSiteId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the GPSGate user ID for a vehicle by HyoungNo
    /// </summary>
    /// <param name="hyoungNo">The vehicle's Hyoung number</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>GPSGate user ID if found</returns>
    Task<FMSResponse<int>> GetGpsGateUserIdByHyoungNoAsync(string hyoungNo, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get current tags assigned to a GPSGate user
    /// </summary>
    /// <param name="gpsGateUserId">The GPSGate user ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of tag IDs the user is assigned to</returns>
    Task<FMSResponse<System.Collections.Generic.List<int>>> GetUserTagsAsync(int gpsGateUserId, CancellationToken cancellationToken = default);
}
