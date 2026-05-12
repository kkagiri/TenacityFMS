using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Infrastructure.VehicleTracking.Models;

namespace FMS.Infrastructure.VehicleTracking.Interfaces
{
    /// <summary>
    /// Core interface that all vehicle tracking providers must implement
    /// This enables the plugin architecture for GPS/tracking providers
    /// </summary>
    public interface IVehicleTrackingProvider
    {
        #region Provider Metadata

        /// <summary>
        /// Unique identifier for this provider (e.g., "GPSGate", "Geotab", "Traccar")
        /// </summary>
        string ProviderName { get; }

        /// <summary>
        /// Provider version number
        /// </summary>
        string ProviderVersion { get; }

        /// <summary>
        /// Provider capabilities and supported features
        /// </summary>
        ProviderCapabilities Capabilities { get; }

        /// <summary>
        /// Provider metadata and information
        /// </summary>
        ProviderMetadata Metadata { get; }

        #endregion

        #region Lifecycle Management

        /// <summary>
        /// Initialize the provider with configuration
        /// </summary>
        /// <param name="configuration">Provider-specific configuration</param>
        /// <returns>Success or failure response</returns>
        Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration);

        /// <summary>
        /// Gracefully shutdown the provider
        /// </summary>
        /// <returns>Success or failure response</returns>
        Task<FMSResponse<bool>> ShutdownAsync();

        /// <summary>
        /// Validate provider configuration without initializing
        /// </summary>
        /// <param name="configuration">Configuration to validate</param>
        /// <returns>Validation result</returns>
        Task<FMSResponse<bool>> ValidateConfigurationAsync(ProviderConfiguration configuration);

        #endregion

        #region Core Vehicle Tracking Operations

        /// <summary>
        /// Get current location for a specific vehicle
        /// </summary>
        /// <param name="vehicleId">FMS vehicle ID</param>
        /// <returns>Vehicle location data</returns>
        Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId);

        /// <summary>
        /// Get current locations for all vehicles
        /// </summary>
        /// <param name="onlineOnly">Only return vehicles currently online</param>
        /// <param name="gpsEnabledOnly">Only return vehicles with GPS enabled</param>
        /// <returns>List of vehicle locations</returns>
        Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(
            bool onlineOnly = false,
            bool gpsEnabledOnly = true);

        /// <summary>
        /// Get odometer/mileage data for a specific vehicle
        /// </summary>
        /// <param name="vehicleId">FMS vehicle ID</param>
        /// <returns>Odometer data</returns>
        Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId);

        /// <summary>
        /// Check if a vehicle is currently online
        /// </summary>
        /// <param name="vehicleId">FMS vehicle ID</param>
        /// <returns>True if vehicle is online, false otherwise</returns>
        Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId);

        /// <summary>
        /// Get all GPS devices/users from the provider system
        /// Used for mapping devices to FMS vehicles
        /// </summary>
        /// <returns>List of GPS devices with current status and mapping information</returns>
        Task<FMSResponse<List<GPSDeviceDTO>>> GetAllDevicesAsync();

        #endregion

        #region Advanced Features (Optional - check Capabilities)

        /// <summary>
        /// Get historical location data for a vehicle
        /// </summary>
        /// <param name="vehicleId">FMS vehicle ID</param>
        /// <param name="from">Start date/time</param>
        /// <param name="to">End date/time</param>
        /// <returns>List of historical location points</returns>
        Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
            int vehicleId,
            DateTime from,
            DateTime to);

        /// <summary>
        /// Get all geofences from the provider
        /// </summary>
        /// <returns>List of geofences</returns>
        Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync();

        /// <summary>
        /// Subscribe to real-time events from the provider
        /// </summary>
        /// <param name="eventHandler">Event handler to process events</param>
        /// <returns>Success or failure</returns>
        Task<FMSResponse<bool>> SubscribeToEventsAsync(IEventHandler eventHandler);

        /// <summary>
        /// Unsubscribe from real-time events
        /// </summary>
        /// <returns>Success or failure</returns>
        Task<FMSResponse<bool>> UnsubscribeFromEventsAsync();

        #endregion

        #region Health & Monitoring

        /// <summary>
        /// Get current health status of the provider
        /// </summary>
        /// <returns>Health status information</returns>
        Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync();

        /// <summary>
        /// Test connectivity to the provider
        /// </summary>
        /// <returns>True if connection successful, false otherwise</returns>
        Task<FMSResponse<bool>> ValidateConnectionAsync();

        #endregion
    }

    /// <summary>
    /// Historical location point data
    /// </summary>
    public class VehicleHistoryPoint
    {
        public DateTime Timestamp { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal? Altitude { get; set; }
        public decimal? Speed { get; set; }
        public decimal? Heading { get; set; }
        public Dictionary<string, object>? AdditionalData { get; set; }
    }

    /// <summary>
    /// Geographic point
    /// </summary>
    public class GeoPoint
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }

    /// <summary>
    /// Event handler interface for real-time events
    /// </summary>
    public interface IEventHandler
    {
        Task HandleEventAsync(string eventType, object eventData);
    }
}
