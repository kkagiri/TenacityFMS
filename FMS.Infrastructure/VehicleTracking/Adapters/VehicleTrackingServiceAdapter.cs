using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate;
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
        private readonly GpsdataContext _context;
        private readonly ILogger<VehicleTrackingServiceAdapter> _logger;
        private readonly GPSGateService _gpsGateService;

        public VehicleTrackingServiceAdapter(
            IVehicleTrackingService trackingService,
            GpsdataContext context,
            GPSGateService gpsGateService,
            ILogger<VehicleTrackingServiceAdapter> logger)
        {
            _trackingService = trackingService;
            _context = context;
            _gpsGateService = gpsGateService;
            _logger = logger;
        }

        /// <summary>
        /// Get vehicle location by vehicle ID
        /// </summary>
        public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
        {
            try
            {
                _logger.LogDebug("Getting location for vehicle {VehicleId} via tracking service", vehicleId);

                // Get location from tracking service
                var location = await _trackingService.GetVehicleLocationAsync(vehicleId);

                if (location == null)
                {
                    _logger.LogWarning("No location data found for vehicle {VehicleId}", vehicleId);
                    return FMSResponse<VehicleLocationDTO>.Failed($"No location data available for vehicle {vehicleId}");
                }

                // Get vehicle details from database
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .Select(v => new
                    {
                        v.VehicleId,
                        v.HyoungNo,
                        v.NumberPlate,
                        v.HasGPSInstalled,
                        v.DeviceId
                    })
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                {
                    _logger.LogWarning("Vehicle {VehicleId} not found in database", vehicleId);
                    return FMSResponse<VehicleLocationDTO>.Failed($"Vehicle {vehicleId} not found");
                }

                // Map to DTO
                var dto = new VehicleLocationDTO
                {
                    VehicleId = location.VehicleId,
                    VehicleName = vehicle.HyoungNo ?? "Unknown",
                    NumberPlate = vehicle.NumberPlate,
                    Latitude = (decimal)location.Latitude,
                    Longitude = (decimal)location.Longitude,
                    LastUpdated = location.Timestamp,
                    Speed = location.Speed.HasValue ? (decimal)location.Speed.Value : null,
                    Heading = location.Heading.HasValue ? (decimal)location.Heading.Value : null,
                    Altitude = location.Altitude.HasValue ? (decimal)location.Altitude.Value : null,
                    IsOnline = IsLocationRecent(location.Timestamp),
                    Address = location.Address,
                    HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                    DeviceId = vehicle.DeviceId
                };

                _logger.LogDebug("Successfully retrieved location for vehicle {VehicleId} from provider {Provider}",
                    vehicleId, location.ProviderName ?? "Unknown");

                return FMSResponse<VehicleLocationDTO>.Success(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle location for {VehicleId}", vehicleId);
                return FMSResponse<VehicleLocationDTO>.Failed($"Failed to get vehicle location: {ex.Message}");
            }
        }

        /// <summary>
        /// Get all vehicle locations
        /// </summary>
        public async Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(
            bool onlineOnly = false,
            bool gpsEnabledOnly = true)
        {
            try
            {
                _logger.LogDebug("Getting all vehicle locations (OnlineOnly: {OnlineOnly}, GPSEnabledOnly: {GPSEnabledOnly})",
                    onlineOnly, gpsEnabledOnly);

                // Get vehicles from database
                var vehiclesQuery = _context.Vehicles.AsQueryable();

                if (gpsEnabledOnly)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.HasGPSInstalled == 1);
                }

                var vehicles = await vehiclesQuery
                    .Select(v => new
                    {
                        v.VehicleId,
                        v.HyoungNo,
                        v.NumberPlate,
                        v.HasGPSInstalled,
                        v.DeviceId
                    })
                    .ToListAsync();

                if (!vehicles.Any())
                {
                    _logger.LogInformation("No vehicles found matching criteria");
                    return FMSResponse<List<VehicleLocationDTO>>.Success(new List<VehicleLocationDTO>());
                }

                // Get locations from tracking service
                var vehicleIds = vehicles.Select(v => v.VehicleId);
                var locations = await _trackingService.GetVehicleLocationsAsync(vehicleIds);

                // Map to DTOs
                var dtos = new List<VehicleLocationDTO>();

                foreach (var vehicle in vehicles)
                {
                    if (locations.TryGetValue(vehicle.VehicleId, out var location))
                    {
                        var isOnline = IsLocationRecent(location.Timestamp);

                        // Apply online filter if requested
                        if (onlineOnly && !isOnline)
                            continue;

                        var dto = new VehicleLocationDTO
                        {
                            VehicleId = location.VehicleId,
                            VehicleName = vehicle.HyoungNo ?? "Unknown",
                            NumberPlate = vehicle.NumberPlate,
                            Latitude = (decimal)location.Latitude,
                            Longitude = (decimal)location.Longitude,
                            LastUpdated = location.Timestamp,
                            Speed = location.Speed.HasValue ? (decimal)location.Speed.Value : null,
                            Heading = location.Heading.HasValue ? (decimal)location.Heading.Value : null,
                            Altitude = location.Altitude.HasValue ? (decimal)location.Altitude.Value : null,
                            IsOnline = isOnline,
                            Address = location.Address,
                            HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                            DeviceId = vehicle.DeviceId
                        };

                        dtos.Add(dto);
                    }
                    else
                    {
                        _logger.LogDebug("No location data for vehicle {VehicleId}", vehicle.VehicleId);

                        // If not filtering for online only, include offline vehicles
                        if (!onlineOnly)
                        {
                            dtos.Add(new VehicleLocationDTO
                            {
                                VehicleId = vehicle.VehicleId,
                                VehicleName = vehicle.HyoungNo ?? "Unknown",
                                NumberPlate = vehicle.NumberPlate,
                                Latitude = 0,
                                Longitude = 0,
                                LastUpdated = DateTime.MinValue,
                                IsOnline = false,
                                HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                                DeviceId = vehicle.DeviceId
                            });
                        }
                    }
                }

                _logger.LogInformation("Retrieved {Count} vehicle locations", dtos.Count);
                return FMSResponse<List<VehicleLocationDTO>>.Success(dtos);
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
