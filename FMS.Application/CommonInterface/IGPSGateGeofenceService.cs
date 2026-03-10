using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.CommonInterface;

/// <summary>
/// Interface for handling geofence operations with GPSGate.
/// This abstraction allows the Application layer to work with geofences
/// without depending on the Infrastructure layer.
/// </summary>
public interface IGPSGateGeofenceService
{
    #region Geofence Operations

    /// <summary>
    /// Get all geofences from GPSGate
    /// </summary>
    Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync();

    /// <summary>
    /// Get all geofences from GPSGate
    /// </summary>
    Task<FMSResponse<List<GeofenceDTO>>> GetAllGeofencesAsync();

    /// <summary>
    /// Get a specific geofence by ID
    /// </summary>
    Task<FMSResponse<GeofenceDTO>> GetGeofenceByIdAsync(int geofenceId);

    /// <summary>
    /// Check if a vehicle is currently inside a geofence
    /// </summary>
    Task<FMSResponse<bool>> IsVehicleInGeofenceAsync(int vehicleId, int geofenceId);

    /// <summary>
    /// Check if a point is inside a geofence
    /// </summary>
    Task<FMSResponse<bool>> IsPointInGeofenceAsync(decimal latitude, decimal longitude, int geofenceId);

    /// <summary>
    /// Get all geofences that a vehicle is currently in
    /// </summary>
    Task<FMSResponse<List<GeofenceDTO>>> GetVehicleGeofencesAsync(int vehicleId);

    /// <summary>
    /// Create a new geofence in GPSGate.
    /// </summary>
    Task<FMSResponse<GeofenceDTO>> CreateGeofenceAsync(CreateGeofenceRequestDTO request);

    /// <summary>
    /// Delete a geofence in GPSGate.
    /// </summary>
    Task<FMSResponse<bool>> DeleteGeofenceAsync(int geofenceId);

    #endregion

    #region Geofence Group Operations

    /// <summary>
    /// Get all geofence groups from GPSGate
    /// </summary>
    Task<FMSResponse<List<GeofenceGroupDTO>>> GetGeofenceGroupsAsync();

    /// <summary>
    /// Get a specific geofence group by ID
    /// </summary>
    Task<FMSResponse<GeofenceGroupDTO>> GetGeofenceGroupByIdAsync(int groupId);

    /// <summary>
    /// Get all geofences that belong to a specific group
    /// </summary>
    Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesInGroupAsync(int groupId);

    /// <summary>
    /// Check if a point is inside any geofence within a group
    /// </summary>
    /// <param name="latitude">Point latitude</param>
    /// <param name="longitude">Point longitude</param>
    /// <param name="groupId">The geofence group ID to check</param>
    /// <returns>True if point is inside any geofence in the group</returns>
    Task<FMSResponse<bool>> IsPointInAnyGroupGeofenceAsync(decimal latitude, decimal longitude, int groupId);

    /// <summary>
    /// Check if a point is inside any of the specified geofences
    /// </summary>
    /// <param name="latitude">Point latitude</param>
    /// <param name="longitude">Point longitude</param>
    /// <param name="geofenceIds">List of geofence IDs to check</param>
    /// <returns>True if point is inside any of the specified geofences</returns>
    Task<FMSResponse<bool>> IsPointInAnyGeofenceAsync(decimal latitude, decimal longitude, List<int> geofenceIds);

    /// <summary>
    /// Get all geofence groups that a vehicle is currently in
    /// </summary>
    Task<FMSResponse<List<GeofenceGroupDTO>>> GetVehicleGeofenceGroupsAsync(int vehicleId);

    /// <summary>
    /// Create a geofence group in GPSGate.
    /// </summary>
    Task<FMSResponse<GeofenceGroupDTO>> CreateGeofenceGroupAsync(CreateGeofenceGroupRequestDTO request);

    /// <summary>
    /// Update a geofence group in GPSGate.
    /// </summary>
    Task<FMSResponse<GeofenceGroupDTO>> UpdateGeofenceGroupAsync(int groupId, UpdateGeofenceGroupRequestDTO request);

    /// <summary>
    /// Delete a geofence group in GPSGate.
    /// </summary>
    Task<FMSResponse<bool>> DeleteGeofenceGroupAsync(int groupId);

    /// <summary>
    /// Add a geofence to a group in GPSGate.
    /// </summary>
    Task<FMSResponse<bool>> AddGeofenceToGroupAsync(int groupId, int geofenceId);

    /// <summary>
    /// Remove a geofence from a group in GPSGate.
    /// </summary>
    Task<FMSResponse<bool>> RemoveGeofenceFromGroupAsync(int groupId, int geofenceId);

    #endregion
}
