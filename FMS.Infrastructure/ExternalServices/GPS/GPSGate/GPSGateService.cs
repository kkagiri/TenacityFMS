using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate
{
    /// <summary>
    /// GPSGate implementation of IGPSService for vehicle tracking
    /// This service communicates with GPSGate API to retrieve real-time vehicle location,
    /// odometer, and status information.
    /// </summary>
    public class GPSGateService : IGPSService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateService> _logger;
        private readonly string _apiKey;
        private readonly string _baseUrl;
        private readonly int _applicationId;

        public GPSGateService(
            GpsdataContext context,
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GPSGateService> logger)
        {
            _context = context;
            _httpClient = httpClient;
            _logger = logger;

            _apiKey = configuration["GPSGate:ApiKey"] ??
                throw new ArgumentNullException("GPSGate:ApiKey not configured");
            _baseUrl = configuration["GPSGate:BaseUrl"] ??
                throw new ArgumentNullException("GPSGate:BaseUrl not configured");
            _applicationId = int.Parse(configuration["GPSGate:ApplicationId"] ?? "1");

            _httpClient.DefaultRequestHeaders.Add("Authorization", _apiKey);
        }

        public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
        {
            try
            {
                // Get vehicle info from database first
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId && v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                {
                    return FMSResponse<VehicleLocationDTO>.Failed("Vehicle not found or doesn't have GPS installed");
                }

                if (!vehicle.DeviceId.HasValue)
                {
                    return FMSResponse<VehicleLocationDTO>.Failed("Vehicle doesn't have a GPS device ID configured");
                }

                // Get user status from GPSGate API
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/users/{vehicle.DeviceId}/status");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get GPS data for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);

                    return FMSResponse<VehicleLocationDTO>.Failed("Failed to retrieve vehicle location from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsData = JsonSerializer.Deserialize<GPSGateUserStatus>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (gpsData?.Position == null)
                {
                    return FMSResponse<VehicleLocationDTO>.Success(new VehicleLocationDTO
                    {
                        VehicleId = vehicleId,
                        VehicleName = vehicle.HyoungNo ?? string.Empty,
                        NumberPlate = vehicle.NumberPlate,
                        HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                        DeviceId = vehicle.DeviceId,
                        IsOnline = false,
                        LastUpdated = DateTime.UtcNow
                    });
                }

                var locationDto = new VehicleLocationDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate,
                    Latitude = (decimal)gpsData.Position.Latitude,
                    Longitude = (decimal)gpsData.Position.Longitude,
                    Altitude = gpsData.Position.Altitude.HasValue ? (decimal)gpsData.Position.Altitude : null,
                    LastUpdated = DateTime.TryParse(gpsData.UTC, out var lastUpdate) ? lastUpdate : DateTime.UtcNow,
                    Speed = gpsData.Velocity?.GroundSpeed.HasValue == true ? (decimal)gpsData.Velocity.GroundSpeed : null,
                    Heading = gpsData.Velocity?.Heading.HasValue == true ? (decimal)gpsData.Velocity.Heading : null,
                    IsOnline = true,
                    HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                    DeviceId = vehicle.DeviceId
                };

                return FMSResponse<VehicleLocationDTO>.Success(locationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle location for {VehicleId}", vehicleId);
                return FMSResponse<VehicleLocationDTO>.Failed($"Error retrieving vehicle location: {ex.Message}");
            }
        }

        public async Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId)
        {
            try
            {
                // Get vehicle info from database
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId && v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                {
                    return FMSResponse<VehicleOdometerDTO>.Failed("Vehicle not found or doesn't have GPS installed");
                }

                if (!vehicle.DeviceId.HasValue)
                {
                    return FMSResponse<VehicleOdometerDTO>.Failed("Vehicle doesn't have a GPS device ID configured");
                }

                // Get accumulator data for odometer from GPSGate
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/accumulators?UserId={vehicle.DeviceId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get odometer data for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);

                    return FMSResponse<VehicleOdometerDTO>.Failed("Failed to retrieve odometer data from GPS provider");
                }

                var content = await response.Content.ReadAsStringAsync();
                var accumulators = JsonSerializer.Deserialize<List<GPSGateAccumulator>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // Find odometer accumulator (usually type 1 for distance)
                var odometerData = accumulators?.FirstOrDefault(a => a.AccumulatorTypeId == 1);

                var odometerDto = new VehicleOdometerDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate,
                    CurrentOdometer = odometerData?.Value.HasValue == true ? (decimal)odometerData.Value / 1000 : 0, // Convert meters to km
                    TotalDistance = odometerData?.Value.HasValue == true ? (decimal)odometerData.Value / 1000 : 0,
                    LastUpdated = DateTime.TryParse(odometerData?.Timestamp, out var lastUpdate) ? lastUpdate : DateTime.UtcNow,
                    Unit = "km",
                    HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                    DeviceId = vehicle.DeviceId
                };

                return FMSResponse<VehicleOdometerDTO>.Success(odometerDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving odometer data for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleOdometerDTO>.Failed($"Error retrieving odometer data: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(bool onlineOnly = false, bool gpsEnabledOnly = true)
        {
            try
            {
                // Get vehicles from database
                var vehiclesQuery = _context.Vehicles.AsQueryable();

                if (gpsEnabledOnly)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.HasGPSInstalled == 1 && v.DeviceId.HasValue);
                }

                var vehicles = await vehiclesQuery
                    .Where(v => v.IsActive == 1)
                    .ToListAsync();

                if (!vehicles.Any())
                {
                    return FMSResponse<List<VehicleLocationDTO>>.Success(new List<VehicleLocationDTO>());
                }

                // Get all users status from GPSGate
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/usersstatus?PageSize=1000");

                var locations = new List<VehicleLocationDTO>();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get GPS data for multiple vehicles. Status: {StatusCode}", response.StatusCode);

                    // Return offline vehicles if GPS service is down
                    foreach (var vehicle in vehicles)
                    {
                        locations.Add(new VehicleLocationDTO
                        {
                            VehicleId = vehicle.VehicleId,
                            VehicleName = vehicle.HyoungNo ?? string.Empty,
                            NumberPlate = vehicle.NumberPlate,
                            HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                            DeviceId = vehicle.DeviceId,
                            IsOnline = false,
                            LastUpdated = DateTime.UtcNow
                        });
                    }
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var usersStatus = JsonSerializer.Deserialize<List<GPSGateUserStatus>>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    foreach (var vehicle in vehicles)
                    {
                        var userStatus = usersStatus?.FirstOrDefault(u => u.Id == vehicle.DeviceId);

                        var location = new VehicleLocationDTO
                        {
                            VehicleId = vehicle.VehicleId,
                            VehicleName = vehicle.HyoungNo ?? string.Empty,
                            NumberPlate = vehicle.NumberPlate,
                            HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                            DeviceId = vehicle.DeviceId,
                            IsOnline = userStatus?.Position != null
                        };

                        if (userStatus?.Position != null)
                        {
                            location.Latitude = (decimal)userStatus.Position.Latitude;
                            location.Longitude = (decimal)userStatus.Position.Longitude;
                            location.Altitude = userStatus.Position.Altitude.HasValue ? (decimal)userStatus.Position.Altitude : null;
                            location.Speed = userStatus.Velocity?.GroundSpeed.HasValue == true ? (decimal)userStatus.Velocity.GroundSpeed : null;
                            location.Heading = userStatus.Velocity?.Heading.HasValue == true ? (decimal)userStatus.Velocity.Heading : null;
                            location.LastUpdated = DateTime.TryParse(userStatus.UTC, out var lastUpdate) ? lastUpdate : DateTime.UtcNow;
                        }
                        else
                        {
                            location.LastUpdated = DateTime.UtcNow;
                        }

                        // Filter online only if requested
                        if (!onlineOnly || location.IsOnline)
                        {
                            locations.Add(location);
                        }
                    }
                }

                return FMSResponse<List<VehicleLocationDTO>>.Success(locations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all vehicle locations");
                return FMSResponse<List<VehicleLocationDTO>>.Failed($"Error retrieving vehicle locations: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId)
        {
            try
            {
                var location = await GetVehicleLocationAsync(vehicleId);
                return FMSResponse<bool>.Success(location.IsSuccess && location.Data?.IsOnline == true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking vehicle online status for {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Error checking vehicle status: {ex.Message}");
            }
        }

        public async Task<FMSResponse<bool>> ValidateConnectionAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/applications/{_applicationId}");
                return FMSResponse<bool>.Success(response.IsSuccessStatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating GPS connection");
                return FMSResponse<bool>.Failed($"Connection validation failed: {ex.Message}");
            }
        }
    }
}
