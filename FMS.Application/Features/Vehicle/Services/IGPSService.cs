using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.Vehicle.Services
{
    /// <summary>
    /// GPS Service interface for vehicle tracking and monitoring
    /// Provides comprehensive GPS functionality including location tracking, sensors, geofencing, and events
    /// </summary>
    public interface IGPSService
    {
        #region Core Location & Status Methods (Original Interface)

        /// <summary>
        /// Get current location for a specific vehicle
        /// </summary>
        Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId);

        /// <summary>
        /// Get odometer reading for a specific vehicle
        /// </summary>
        Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId);

        /// <summary>
        /// Get locations for all vehicles
        /// </summary>
        Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(bool onlineOnly = false, bool gpsEnabledOnly = true);

        /// <summary>
        /// Check if a vehicle is currently online
        /// </summary>
        Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId);

        /// <summary>
        /// Validate GPS provider connection
        /// </summary>
        Task<FMSResponse<bool>> ValidateConnectionAsync();

        /// <summary>
        /// Get comprehensive GPS information for a vehicle including sensors
        /// </summary>
        Task<FMSResponse<VehicleGPSInformationDTO>> GetVehicleGPSInformationAsync(int vehicleId);

        #endregion

        #region Location & Tracking Services

        /// <summary>
        /// Get historical track data for a vehicle with distance calculations and stop detection
        /// </summary>
        Task<FMSResponse<VehicleTrackHistoryDTO>> GetTrackHistoryAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000);

        /// <summary>
        /// Get track points for a vehicle within a time range
        /// </summary>
        Task<FMSResponse<List<TrackPointDTO>>> GetTrackPointsAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000);

        /// <summary>
        /// Calculate distance between two GPS coordinates using Haversine formula
        /// </summary>
        decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2);

        #endregion

        #region Sensor Services

        /// <summary>
        /// Get current fuel level for a vehicle
        /// </summary>
        Task<FMSResponse<decimal?>> GetFuelLevelAsync(int vehicleId);

        /// <summary>
        /// Get current engine temperature for a vehicle
        /// </summary>
        Task<FMSResponse<decimal?>> GetEngineTemperatureAsync(int vehicleId);

        /// <summary>
        /// Get current battery voltage for a vehicle
        /// </summary>
        Task<FMSResponse<decimal?>> GetBatteryVoltageAsync(int vehicleId);

        /// <summary>
        /// Get ignition status for a vehicle
        /// </summary>
        Task<FMSResponse<bool?>> GetIgnitionStatusAsync(int vehicleId);

        /// <summary>
        /// Get engine status for a vehicle
        /// </summary>
        Task<FMSResponse<bool?>> GetEngineStatusAsync(int vehicleId);

        #endregion

        #region Geofence Services

        /// <summary>
        /// Get all geofences for a vehicle
        /// </summary>
        Task<FMSResponse<List<GeofenceDTO>>> GetVehicleGeofencesAsync(int vehicleId);

        /// <summary>
        /// Check if a vehicle is currently within a specific geofence
        /// </summary>
        Task<FMSResponse<bool>> IsVehicleInGeofenceAsync(int vehicleId, int geofenceId);

        /// <summary>
        /// Get all active geofences
        /// </summary>
        Task<FMSResponse<List<GeofenceDTO>>> GetAllGeofencesAsync();

        /// <summary>
        /// Check if a point is within a geofence
        /// </summary>
        Task<FMSResponse<bool>> IsPointInGeofenceAsync(decimal latitude, decimal longitude, int geofenceId);

        #endregion

        #region Event Services

        /// <summary>
        /// Get GPS events for a specific vehicle within a time range
        /// </summary>
        Task<FMSResponse<List<GPSEventDTO>>> GetVehicleEventsAsync(int vehicleId, DateTime from, DateTime to);

        /// <summary>
        /// Get all GPS events within a time range
        /// </summary>
        Task<FMSResponse<List<GPSEventDTO>>> GetAllEventsAsync(DateTime from, DateTime to);

        /// <summary>
        /// Get critical unacknowledged events (last 24 hours)
        /// </summary>
        Task<FMSResponse<List<GPSEventDTO>>> GetCriticalUnacknowledgedEventsAsync();

        /// <summary>
        /// Acknowledge a GPS event
        /// </summary>
        Task<FMSResponse<bool>> AcknowledgeEventAsync(int eventId, string acknowledgedBy);

        #endregion

        #region Health & System Services

        /// <summary>
        /// Check overall health of GPS provider system
        /// </summary>
        Task<FMSResponse<GPSHealthStatusDTO>> CheckHealthAsync();

        /// <summary>
        /// Ping GPS provider to check connectivity
        /// </summary>
        Task<FMSResponse<bool>> PingAsync();

        #endregion
    }
}