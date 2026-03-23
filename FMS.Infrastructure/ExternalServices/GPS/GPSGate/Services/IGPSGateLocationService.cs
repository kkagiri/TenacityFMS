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
        /// Check if a vehicle is currently online
        /// </summary>
        Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId);

        /// <summary>
        /// Get real-time location updates for a vehicle (placeholder for SignalR/WebSocket)
        /// </summary>
        Task<FMSResponse<bool>> SubscribeToLocationUpdatesAsync(int vehicleId);

        /// <summary>
        /// Get vehicle odometer reading
        /// </summary>
        Task<FMSResponse<decimal>> GetVehicleOdometerAsync(int vehicleId);

        /// <summary>
        /// Calculate distance between two GPS coordinates
        /// </summary>
        decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2);
    }
}
