using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Service for handling vehicle location and tracking operations
    /// </summary>
    public interface IGPSGateLocationService
    {
        /// <summary>
        /// Get current location for a single vehicle
        /// </summary>
        Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId);

        /// <summary>
        /// Get current locations for all vehicles
        /// </summary>
        Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(bool onlineOnly = false, bool gpsEnabledOnly = true);

        /// <summary>
        /// Get historical track data for a vehicle
        /// </summary>
        Task<FMSResponse<VehicleTrackHistoryDTO>> GetTrackHistoryAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000);

        /// <summary>
        /// Get track points for a vehicle within a time range
        /// </summary>
        Task<FMSResponse<List<TrackPointDTO>>> GetTrackPointsAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000);

        /// <summary>
        /// Check if a vehicle is currently online
        /// </summary>
        Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId);

        /// <summary>
        /// Get real-time location updates for a vehicle (placeholder for SignalR/WebSocket)
        /// </summary>
        Task<FMSResponse<bool>> SubscribeToLocationUpdatesAsync(int vehicleId);
    }
}
