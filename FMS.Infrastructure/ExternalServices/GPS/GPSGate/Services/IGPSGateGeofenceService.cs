using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Service for handling geofence operations
    /// </summary>
    public interface IGPSGateGeofenceService
    {
        /// <summary>
        /// Get all geofences from GPSGate
        /// </summary>
        Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync();

        /// <summary>
        /// Get a specific geofence by ID
        /// </summary>
        Task<FMSResponse<GeofenceDTO>> GetGeofenceByIdAsync(int geofenceId);

        /// <summary>
        /// Check if a vehicle is currently inside a geofence
        /// </summary>
        Task<FMSResponse<bool>> IsVehicleInGeofenceAsync(int vehicleId, int geofenceId);

        /// <summary>
        /// Get all geofences that a vehicle is currently in
        /// </summary>
        Task<FMSResponse<List<GeofenceDTO>>> GetVehicleGeofencesAsync(int vehicleId);
    }
}
