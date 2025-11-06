using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate
{
    /// <summary>
    /// GPSGate implementation of IGPSService for vehicle tracking
    /// This service acts as a facade that delegates to domain-specific services
    /// for better organization and separation of concerns.
    ///
    /// Architecture:
    /// - GPSGateLocationService: Handles location tracking, routes, and distance calculations
    /// - GPSGateSensorService: Handles sensor data (fuel, temperature, battery, etc.)
    /// - GPSGateGeofenceService: Handles geofencing and boundary detection
    /// - GPSGateEventService: Handles GPS events and alerts
    /// - GPSGateHealthService: Handles system health monitoring
    /// </summary>
    public class GPSGateService : IGPSService
    {
        private readonly IGPSGateLocationService _locationService;
        private readonly IGPSGateSensorService _sensorService;
        private readonly IGPSGateGeofenceService _geofenceService;
        private readonly IGPSGateEventService _eventService;
        private readonly IGPSGateHealthService _healthService;
        private readonly ILogger<GPSGateService> _logger;

        public GPSGateService(
            IGPSGateLocationService locationService,
            IGPSGateSensorService sensorService,
            IGPSGateGeofenceService geofenceService,
            IGPSGateEventService eventService,
            IGPSGateHealthService healthService,
            ILogger<GPSGateService> logger)
        {
            _locationService = locationService ?? throw new ArgumentNullException(nameof(locationService));
            _sensorService = sensorService ?? throw new ArgumentNullException(nameof(sensorService));
            _geofenceService = geofenceService ?? throw new ArgumentNullException(nameof(geofenceService));
            _eventService = eventService ?? throw new ArgumentNullException(nameof(eventService));
            _healthService = healthService ?? throw new ArgumentNullException(nameof(healthService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        #region IGPSService Implementation (Backward Compatibility)

        /// <summary>
        /// Get current location for a specific vehicle
        /// Delegates to LocationService
        /// </summary>
        public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
        {
            try
            {
                return await _locationService.GetVehicleLocationAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetVehicleLocationAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleLocationDTO>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get vehicle odometer reading
        /// Delegates to LocationService
        /// </summary>
        public async Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId)
        {
            try
            {
                var odometerResult = await _locationService.GetVehicleOdometerAsync(vehicleId);
                if (odometerResult.IsSuccess)
                {
                    var odometerDto = new VehicleOdometerDTO
                    {
                        VehicleId = vehicleId,
                        CurrentOdometer = odometerResult.Data,
                        TotalDistance = odometerResult.Data,
                        LastUpdated = DateTime.UtcNow,
                        Unit = "km"
                    };
                    return FMSResponse<VehicleOdometerDTO>.Success(odometerDto);
                }
                return FMSResponse<VehicleOdometerDTO>.Failed(odometerResult.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetVehicleOdometerAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleOdometerDTO>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get locations for all vehicles
        /// Delegates to LocationService
        /// </summary>
        public async Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(bool onlineOnly = false, bool gpsEnabledOnly = true)
        {
            try
            {
                return await _locationService.GetAllVehicleLocationsAsync(onlineOnly, gpsEnabledOnly);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetAllVehicleLocationsAsync");
                return FMSResponse<List<VehicleLocationDTO>>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Check if a vehicle is currently online
        /// Delegates to LocationService
        /// </summary>
        public async Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId)
        {
            try
            {
                var location = await _locationService.GetVehicleLocationAsync(vehicleId);
                return FMSResponse<bool>.Success(location.IsSuccess && location.Data?.IsOnline == true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.IsVehicleOnlineAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Validate GPS provider connection
        /// Delegates to HealthService
        /// </summary>
        public async Task<FMSResponse<bool>> ValidateConnectionAsync()
        {
            try
            {
                var health = await _healthService.CheckHealthAsync();
                return FMSResponse<bool>.Success(health.IsSuccess && health.Data != null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.ValidateConnectionAsync");
                return FMSResponse<bool>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get comprehensive GPS information for a vehicle including sensors
        /// Delegates to SensorService
        /// </summary>
        public async Task<FMSResponse<VehicleGPSInformationDTO>> GetVehicleGPSInformationAsync(int vehicleId)
        {
            try
            {
                return await _sensorService.GetVehicleGPSInformationAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetVehicleGPSInformationAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleGPSInformationDTO>.Failed($"Service error: {ex.Message}");
            }
        }

        #endregion

        #region Location & Tracking Services

        /// <summary>
        /// Get historical track data for a vehicle with distance calculations and stop detection
        /// </summary>
        public async Task<FMSResponse<VehicleTrackHistoryDTO>> GetTrackHistoryAsync(
            int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
        {
            try
            {
                return await _locationService.GetTrackHistoryAsync(vehicleId, from, to, maxPoints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetTrackHistoryAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleTrackHistoryDTO>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get track points for a vehicle within a time range
        /// </summary>
        public async Task<FMSResponse<List<TrackPointDTO>>> GetTrackPointsAsync(
            int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
        {
            try
            {
                return await _locationService.GetTrackPointsAsync(vehicleId, from, to, maxPoints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetTrackPointsAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<TrackPointDTO>>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Calculate distance between two GPS coordinates using Haversine formula
        /// </summary>
        public decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            try
            {
                return _locationService.CalculateDistance(lat1, lon1, lat2, lon2);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.CalculateDistance");
                return 0;
            }
        }

        #endregion

        #region Sensor Services

        /// <summary>
        /// Get current fuel level for a vehicle
        /// </summary>
        public async Task<FMSResponse<decimal?>> GetFuelLevelAsync(int vehicleId)
        {
            try
            {
                return await _sensorService.GetFuelLevelAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetFuelLevelAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<decimal?>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get current engine temperature for a vehicle
        /// </summary>
        public async Task<FMSResponse<decimal?>> GetEngineTemperatureAsync(int vehicleId)
        {
            try
            {
                return await _sensorService.GetEngineTemperatureAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetEngineTemperatureAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<decimal?>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get current battery voltage for a vehicle
        /// </summary>
        public async Task<FMSResponse<decimal?>> GetBatteryVoltageAsync(int vehicleId)
        {
            try
            {
                return await _sensorService.GetBatteryVoltageAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetBatteryVoltageAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<decimal?>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get ignition status for a vehicle
        /// </summary>
        public async Task<FMSResponse<bool?>> GetIgnitionStatusAsync(int vehicleId)
        {
            try
            {
                return await _sensorService.GetIgnitionStatusAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetIgnitionStatusAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool?>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get engine status for a vehicle
        /// </summary>
        public async Task<FMSResponse<bool?>> GetEngineStatusAsync(int vehicleId)
        {
            try
            {
                return await _sensorService.GetEngineStatusAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetEngineStatusAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool?>.Failed($"Service error: {ex.Message}");
            }
        }

        #endregion

        #region Geofence Services

        /// <summary>
        /// Get all geofences for a vehicle
        /// </summary>
        public async Task<FMSResponse<List<GeofenceDTO>>> GetVehicleGeofencesAsync(int vehicleId)
        {
            try
            {
                return await _geofenceService.GetVehicleGeofencesAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetVehicleGeofencesAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<GeofenceDTO>>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Check if a vehicle is currently within a specific geofence
        /// </summary>
        public async Task<FMSResponse<bool>> IsVehicleInGeofenceAsync(int vehicleId, int geofenceId)
        {
            try
            {
                return await _geofenceService.IsVehicleInGeofenceAsync(vehicleId, geofenceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.IsVehicleInGeofenceAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get all active geofences
        /// </summary>
        public async Task<FMSResponse<List<GeofenceDTO>>> GetAllGeofencesAsync()
        {
            try
            {
                return await _geofenceService.GetAllGeofencesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetAllGeofencesAsync");
                return FMSResponse<List<GeofenceDTO>>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Check if a point is within a geofence
        /// </summary>
        public async Task<FMSResponse<bool>> IsPointInGeofenceAsync(decimal latitude, decimal longitude, int geofenceId)
        {
            try
            {
                return await _geofenceService.IsPointInGeofenceAsync(latitude, longitude, geofenceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.IsPointInGeofenceAsync");
                return FMSResponse<bool>.Failed($"Service error: {ex.Message}");
            }
        }

        #endregion

        #region Event Services

        /// <summary>
        /// Get GPS events for a specific vehicle within a time range
        /// </summary>
        public async Task<FMSResponse<List<GPSEventDTO>>> GetVehicleEventsAsync(int vehicleId, DateTime from, DateTime to)
        {
            try
            {
                return await _eventService.GetVehicleEventsAsync(vehicleId, from, to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetVehicleEventsAsync for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<GPSEventDTO>>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get all GPS events within a time range
        /// </summary>
        public async Task<FMSResponse<List<GPSEventDTO>>> GetAllEventsAsync(DateTime from, DateTime to)
        {
            try
            {
                return await _eventService.GetAllEventsAsync(from, to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetAllEventsAsync");
                return FMSResponse<List<GPSEventDTO>>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get critical unacknowledged events (last 24 hours)
        /// </summary>
        public async Task<FMSResponse<List<GPSEventDTO>>> GetCriticalUnacknowledgedEventsAsync()
        {
            try
            {
                return await _eventService.GetCriticalUnacknowledgedEventsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.GetCriticalUnacknowledgedEventsAsync");
                return FMSResponse<List<GPSEventDTO>>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Acknowledge a GPS event
        /// </summary>
        public async Task<FMSResponse<bool>> AcknowledgeEventAsync(int eventId, string acknowledgedBy)
        {
            try
            {
                return await _eventService.AcknowledgeEventAsync(eventId, acknowledgedBy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.AcknowledgeEventAsync for event {EventId}", eventId);
                return FMSResponse<bool>.Failed($"Service error: {ex.Message}");
            }
        }

        #endregion

        #region Health & System Services

        /// <summary>
        /// Check overall health of GPS provider system
        /// </summary>
        public async Task<FMSResponse<GPSHealthStatusDTO>> CheckHealthAsync()
        {
            try
            {
                return await _healthService.CheckHealthAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.CheckHealthAsync");
                return FMSResponse<GPSHealthStatusDTO>.Failed($"Service error: {ex.Message}");
            }
        }

        /// <summary>
        /// Ping GPS provider to check connectivity
        /// </summary>
        public async Task<FMSResponse<bool>> PingAsync()
        {
            try
            {
                var pingResult = await _healthService.PingAsync();
                if (pingResult.IsSuccess)
                {
                    return FMSResponse<bool>.Success(true, $"Ping successful: {pingResult.Data}ms");
                }
                return FMSResponse<bool>.Failed(pingResult.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPSGateService.PingAsync");
                return FMSResponse<bool>.Failed($"Service error: {ex.Message}");
            }
        }

        #endregion
    }
}
