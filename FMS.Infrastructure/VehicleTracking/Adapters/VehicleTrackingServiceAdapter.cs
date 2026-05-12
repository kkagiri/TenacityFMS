using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Infrastructure.VehicleTracking.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Adapters
{
    /// <summary>
    /// Adapter that bridges the new IVehicleTrackingService to the legacy IGPSService interface
    /// This allows gradual migration from the old GPS service to the new provider-based system
    /// while maintaining backward compatibility with existing application code
    /// </summary>
    public class VehicleTrackingServiceAdapter : IGPSService
    {
        private readonly IVehicleTrackingService _trackingService;
        private readonly IProviderFactory _providerFactory;
        private readonly GpsdataContext _context;
        private readonly ILogger<VehicleTrackingServiceAdapter> _logger;
        private readonly GPSGateService _gpsGateService;

        public VehicleTrackingServiceAdapter(
            IVehicleTrackingService trackingService,
            IProviderFactory providerFactory,
            GpsdataContext context,
            GPSGateService gpsGateService,
            ILogger<VehicleTrackingServiceAdapter> logger)
        {
            _trackingService = trackingService;
            _providerFactory = providerFactory ?? throw new ArgumentNullException(nameof(providerFactory));
            _context = context;
            _gpsGateService = gpsGateService;
            _logger = logger;
        }

        /// <summary>
        /// Get vehicle location by vehicle ID
        /// CRITICAL: Uses provider directly to preserve ValidationStatus, IsGPSValid, and other validation fields
        /// that are needed for stale GPS detection and location validation
        /// </summary>
        public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting location for vehicle {VehicleId} via provider factory", vehicleId);

                // Get the provider for this vehicle - this gives us the full DTO with validation status
                var provider = await _providerFactory.GetProviderForVehicleAsync(vehicleId);

                if (provider == null)
                {
                    _logger.LogWarning("No provider available for vehicle {VehicleId}", vehicleId);
                    return FMSResponse<VehicleLocationDTO>.Failed($"No GPS provider available for vehicle {vehicleId}");
                }

                // Call provider directly to get the full DTO with ValidationStatus
                var locationResult = await provider.GetVehicleLocationAsync(vehicleId);

                if (!locationResult.IsSuccess || locationResult.Data == null)
                {
                    _logger.LogWarning("Provider returned no location for vehicle {VehicleId}: {Message}",
                        vehicleId, locationResult.Message);
                    return locationResult;
                }

                var dto = locationResult.Data;

                _logger.LogDebug("Successfully retrieved location for vehicle {VehicleId} from provider {Provider}. " +
                    "ValidationStatus: {Status}, IsGPSValid: {IsValid}, CanFuel: {CanFuel}",
                    vehicleId, provider.ProviderName, dto.ValidationStatus, dto.IsGPSValid, dto.CanFuel);

                return locationResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle location for {VehicleId}", vehicleId);
                return FMSResponse<VehicleLocationDTO>.Failed($"Failed to get vehicle location: {ex.Message}");
            }
        }

        /// <summary>
        /// Get all vehicle locations using efficient bulk API.
        /// Delegates to GPSGateService which makes a single HTTP call to /usersstatus
        /// instead of N individual GetVehicleLocationAsync calls (N HTTP + 2N DB queries).
        /// </summary>
        public async Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(
            bool onlineOnly = false,
            bool gpsEnabledOnly = true)
        {
            try
            {
                _logger.LogDebug("Getting all vehicle locations via bulk API (OnlineOnly: {OnlineOnly}, GPSEnabledOnly: {GPSEnabledOnly})",
                    onlineOnly, gpsEnabledOnly);

                // Use GPSGateService's efficient bulk API (single HTTP call to /usersstatus)
                // instead of N individual calls via tracking service.
                // This reduces N HTTP calls + 2N DB queries down to 1 HTTP call + 2 DB queries.
                return await _gpsGateService.GetAllVehicleLocationsAsync(onlineOnly, gpsEnabledOnly);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all vehicle locations");
                return FMSResponse<List<VehicleLocationDTO>>.Failed($"Failed to get vehicle locations: {ex.Message}");
            }
        }

        /// <summary>
        /// Get vehicle odometer reading
        /// </summary>
        public async Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting odometer for vehicle {VehicleId}", vehicleId);

                // For now, return a placeholder response
                // The new provider system doesn't have a direct odometer method yet
                // This would need to be implemented in the provider interface or handled differently

                _logger.LogWarning("Odometer functionality not yet implemented in new tracking service");

                return FMSResponse<VehicleOdometerDTO>.Failed(
                    "Odometer functionality is being migrated to the new provider system");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle odometer for {VehicleId}", vehicleId);
                return FMSResponse<VehicleOdometerDTO>.Failed($"Failed to get vehicle odometer: {ex.Message}");
            }
        }

        /// <summary>
        /// Check if vehicle is online
        /// </summary>
        public async Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Checking online status for vehicle {VehicleId}", vehicleId);

                var location = await _trackingService.GetVehicleLocationAsync(vehicleId);

                if (location == null)
                {
                    _logger.LogDebug("No location data for vehicle {VehicleId}, considering offline", vehicleId);
                    return FMSResponse<bool>.Success(false);
                }

                var isOnline = IsLocationRecent(location.Timestamp);
                _logger.LogDebug("Vehicle {VehicleId} is {Status} (last updated: {LastUpdated})",
                    vehicleId, isOnline ? "online" : "offline", location.Timestamp);

                return FMSResponse<bool>.Success(isOnline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking online status for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Failed to check vehicle status: {ex.Message}");
            }
        }

        /// <summary>
        /// Validate GPS connection
        /// </summary>
        public async Task<FMSResponse<bool>> ValidateConnectionAsync()
        {
            try
            {
                _logger.LogDebug("Validating GPS connection via tracking service");

                // Test provider health
                var healthStatuses = await _trackingService.GetProvidersHealthAsync();

                if (!healthStatuses.Any())
                {
                    _logger.LogWarning("No providers are configured");
                    return FMSResponse<bool>.Failed("No GPS tracking providers are configured");
                }

                var healthyProviders = healthStatuses.Values
                    .Count(h => h.Status == Models.HealthStatus.Healthy);

                if (healthyProviders == 0)
                {
                    _logger.LogWarning("No healthy providers found");
                    return FMSResponse<bool>.Failed("All GPS tracking providers are unhealthy");
                }

                _logger.LogInformation("{HealthyCount} of {TotalCount} providers are healthy",
                    healthyProviders, healthStatuses.Count);

                return FMSResponse<bool>.Success(true,
                    $"{healthyProviders} of {healthStatuses.Count} provider(s) are healthy");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating GPS connection");
                return FMSResponse<bool>.Failed($"Failed to validate connection: {ex.Message}");
            }
        }

        /// <summary>
        /// Get comprehensive GPS information including location and sensor data
        /// </summary>
        public async Task<FMSResponse<VehicleGPSInformationDTO>> GetVehicleGPSInformationAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting GPS information for vehicle {VehicleId}", vehicleId);

                // Delegate to GPSGateService for GPS information as it contains provider-specific sensor data
                // This method requires parsing variables from the GPSGate API response
                return await _gpsGateService.GetVehicleGPSInformationAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GPS information for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleGPSInformationDTO>.Failed($"Failed to get GPS information: {ex.Message}");
            }
        }

        /// <summary>
        /// Get historical track data for a vehicle
        /// </summary>
        public async Task<FMSResponse<VehicleTrackHistoryDTO>> GetTrackHistoryAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
        {
            try
            {
                _logger.LogDebug("Getting track history for vehicle {VehicleId} from {From} to {To}", vehicleId, from, to);
                return await _gpsGateService.GetTrackHistoryAsync(vehicleId, from, to, maxPoints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting track history for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleTrackHistoryDTO>.Failed($"Failed to get track history: {ex.Message}");
            }
        }

        /// <summary>
        /// Get track points for a vehicle
        /// </summary>
        public async Task<FMSResponse<List<TrackPointDTO>>> GetTrackPointsAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
        {
            try
            {
                _logger.LogDebug("Getting track points for vehicle {VehicleId} from {From} to {To}", vehicleId, from, to);
                return await _gpsGateService.GetTrackPointsAsync(vehicleId, from, to, maxPoints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting track points for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<TrackPointDTO>>.Failed($"Failed to get track points: {ex.Message}");
            }
        }

        /// <summary>
        /// Calculate distance between two GPS coordinates
        /// </summary>
        public decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double EarthRadiusKm = 6371.0;

            var dLat = DegreesToRadians((double)(lat2 - lat1));
            var dLon = DegreesToRadians((double)(lon2 - lon1));

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(DegreesToRadians((double)lat1)) * Math.Cos(DegreesToRadians((double)lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return (decimal)(EarthRadiusKm * c);
        }

        /// <summary>
        /// Get fuel level for a vehicle
        /// </summary>
        public async Task<FMSResponse<decimal?>> GetFuelLevelAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting fuel level for vehicle {VehicleId}", vehicleId);
                return await _gpsGateService.GetFuelLevelAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fuel level for vehicle {VehicleId}", vehicleId);
                return FMSResponse<decimal?>.Failed($"Failed to get fuel level: {ex.Message}");
            }
        }

        /// <summary>
        /// Get engine temperature for a vehicle
        /// </summary>
        public async Task<FMSResponse<decimal?>> GetEngineTemperatureAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting engine temperature for vehicle {VehicleId}", vehicleId);
                return await _gpsGateService.GetEngineTemperatureAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting engine temperature for vehicle {VehicleId}", vehicleId);
                return FMSResponse<decimal?>.Failed($"Failed to get engine temperature: {ex.Message}");
            }
        }

        /// <summary>
        /// Get battery voltage for a vehicle
        /// </summary>
        public async Task<FMSResponse<decimal?>> GetBatteryVoltageAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting battery voltage for vehicle {VehicleId}", vehicleId);
                return await _gpsGateService.GetBatteryVoltageAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting battery voltage for vehicle {VehicleId}", vehicleId);
                return FMSResponse<decimal?>.Failed($"Failed to get battery voltage: {ex.Message}");
            }
        }

        /// <summary>
        /// Get ignition status for a vehicle
        /// </summary>
        public async Task<FMSResponse<bool?>> GetIgnitionStatusAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting ignition status for vehicle {VehicleId}", vehicleId);
                return await _gpsGateService.GetIgnitionStatusAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting ignition status for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool?>.Failed($"Failed to get ignition status: {ex.Message}");
            }
        }

        /// <summary>
        /// Get engine status for a vehicle
        /// </summary>
        public async Task<FMSResponse<bool?>> GetEngineStatusAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting engine status for vehicle {VehicleId}", vehicleId);
                return await _gpsGateService.GetEngineStatusAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting engine status for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool?>.Failed($"Failed to get engine status: {ex.Message}");
            }
        }

        /// <summary>
        /// Get geofences for a vehicle
        /// </summary>
        public async Task<FMSResponse<List<GeofenceDTO>>> GetVehicleGeofencesAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting geofences for vehicle {VehicleId}", vehicleId);
                return await _gpsGateService.GetVehicleGeofencesAsync(vehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting geofences for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<GeofenceDTO>>.Failed($"Failed to get geofences: {ex.Message}");
            }
        }

        /// <summary>
        /// Check if vehicle is in geofence
        /// </summary>
        public async Task<FMSResponse<bool>> IsVehicleInGeofenceAsync(int vehicleId, int geofenceId)
        {
            try
            {
                _logger.LogDebug("Checking if vehicle {VehicleId} is in geofence {GeofenceId}", vehicleId, geofenceId);
                return await _gpsGateService.IsVehicleInGeofenceAsync(vehicleId, geofenceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking geofence status for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Failed to check geofence: {ex.Message}");
            }
        }

        /// <summary>
        /// Get all geofences
        /// </summary>
        public async Task<FMSResponse<List<GeofenceDTO>>> GetAllGeofencesAsync()
        {
            try
            {
                _logger.LogDebug("Getting all geofences");
                return await _gpsGateService.GetAllGeofencesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all geofences");
                return FMSResponse<List<GeofenceDTO>>.Failed($"Failed to get geofences: {ex.Message}");
            }
        }

        /// <summary>
        /// Check if point is in geofence
        /// </summary>
        public async Task<FMSResponse<bool>> IsPointInGeofenceAsync(decimal latitude, decimal longitude, int geofenceId)
        {
            try
            {
                _logger.LogDebug("Checking if point ({Lat}, {Lon}) is in geofence {GeofenceId}", latitude, longitude, geofenceId);
                return await _gpsGateService.IsPointInGeofenceAsync(latitude, longitude, geofenceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking point in geofence");
                return FMSResponse<bool>.Failed($"Failed to check point in geofence: {ex.Message}");
            }
        }

        /// <summary>
        /// Get GPS events for a vehicle
        /// </summary>
        public async Task<FMSResponse<List<GPSEventDTO>>> GetVehicleEventsAsync(int vehicleId, DateTime from, DateTime to)
        {
            try
            {
                _logger.LogDebug("Getting events for vehicle {VehicleId} from {From} to {To}", vehicleId, from, to);
                return await _gpsGateService.GetVehicleEventsAsync(vehicleId, from, to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting events for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<GPSEventDTO>>.Failed($"Failed to get events: {ex.Message}");
            }
        }

        /// <summary>
        /// Get all GPS events
        /// </summary>
        public async Task<FMSResponse<List<GPSEventDTO>>> GetAllEventsAsync(DateTime from, DateTime to)
        {
            try
            {
                _logger.LogDebug("Getting all events from {From} to {To}", from, to);
                return await _gpsGateService.GetAllEventsAsync(from, to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all events");
                return FMSResponse<List<GPSEventDTO>>.Failed($"Failed to get events: {ex.Message}");
            }
        }

        /// <summary>
        /// Get critical unacknowledged events
        /// </summary>
        public async Task<FMSResponse<List<GPSEventDTO>>> GetCriticalUnacknowledgedEventsAsync()
        {
            try
            {
                _logger.LogDebug("Getting critical unacknowledged events");
                return await _gpsGateService.GetCriticalUnacknowledgedEventsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting critical events");
                return FMSResponse<List<GPSEventDTO>>.Failed($"Failed to get critical events: {ex.Message}");
            }
        }

        /// <summary>
        /// Acknowledge a GPS event
        /// </summary>
        public async Task<FMSResponse<bool>> AcknowledgeEventAsync(int eventId, string acknowledgedBy)
        {
            try
            {
                _logger.LogDebug("Acknowledging event {EventId} by {User}", eventId, acknowledgedBy);
                return await _gpsGateService.AcknowledgeEventAsync(eventId, acknowledgedBy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging event {EventId}", eventId);
                return FMSResponse<bool>.Failed($"Failed to acknowledge event: {ex.Message}");
            }
        }

        /// <summary>
        /// Check GPS system health
        /// </summary>
        public async Task<FMSResponse<GPSHealthStatusDTO>> CheckHealthAsync()
        {
            try
            {
                _logger.LogDebug("Checking GPS system health");

                var healthStatuses = await _trackingService.GetProvidersHealthAsync();

                var healthyCount = healthStatuses.Values.Count(h => h.Status == Models.HealthStatus.Healthy);
                var degradedCount = healthStatuses.Values.Count(h => h.Status == Models.HealthStatus.Degraded);
                var unhealthyCount = healthStatuses.Values.Count(h => h.Status == Models.HealthStatus.Unhealthy);

                var overallStatus = healthyCount > 0 ? "Healthy" :
                                   degradedCount > 0 ? "Degraded" : "Unhealthy";

                var healthDto = new GPSHealthStatusDTO
                {
                    IsHealthy = healthyCount > 0,
                    Status = overallStatus,
                    TotalProviders = healthStatuses.Count,
                    HealthyProviders = healthyCount,
                    DegradedProviders = degradedCount,
                    UnhealthyProviders = unhealthyCount,
                    LastChecked = DateTime.UtcNow,
                    Message = $"{healthyCount} of {healthStatuses.Count} provider(s) healthy"
                };

                return FMSResponse<GPSHealthStatusDTO>.Success(healthDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking GPS health");
                return FMSResponse<GPSHealthStatusDTO>.Failed($"Failed to check health: {ex.Message}");
            }
        }

        /// <summary>
        /// Ping GPS provider
        /// </summary>
        public async Task<FMSResponse<bool>> PingAsync()
        {
            try
            {
                _logger.LogDebug("Pinging GPS provider");
                return await _gpsGateService.PingAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pinging GPS provider");
                return FMSResponse<bool>.Failed($"Failed to ping: {ex.Message}");
            }
        }

        /// <summary>
        /// Helper method to convert degrees to radians
        /// </summary>
        private double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180.0;
        }

        /// <summary>
        /// Helper method to determine if a location is recent (online)
        /// </summary>
        private bool IsLocationRecent(DateTime timestamp)
        {
            // Consider a vehicle online if location was updated in the last 15 minutes
            var threshold = TimeSpan.FromMinutes(15);
            return (DateTime.UtcNow - timestamp) < threshold;
        }
    }
}
