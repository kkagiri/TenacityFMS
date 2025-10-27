using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Interfaces;
using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Providers
{
    /// <summary>
    /// GPSGate tracking provider implementation
    /// Integrates with GPSGate Vehicle Tracker API v.1
    /// </summary>
    [Provider("GPSGate",
        DisplayName = "GPSGate Vehicle Tracker",
        Description = "Integration with GPSGate Vehicle Tracker system for real-time vehicle location and tracking data",
        Version = "2.0.0"
    )]
    public class GPSGateProvider : IVehicleTrackingProvider, IDisposable
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateProvider> _logger;

        private string? _apiKey;
        private string? _baseUrl;
        private int _applicationId;
        private bool _initialized = false;

        #region Provider Metadata

        public string ProviderName => "GPSGate";

        public string ProviderVersion => "2.0.0";


        public ProviderCapabilities Capabilities => new ProviderCapabilities
        {
            SupportsRealTimeLocation = true,
            SupportsHistoricalData = true,
            SupportsGeofencing = true,
            SupportsEvents = false,
            SupportsOdometer = true
        }; public FMS.Infrastructure.VehicleTracking.Models.ProviderMetadata Metadata => new FMS.Infrastructure.VehicleTracking.Models.ProviderMetadata
        {
            Name = ProviderName,
            DisplayName = "GPSGate Vehicle Tracker",
            Description = "Integration with GPSGate Vehicle Tracker system for real-time vehicle location and tracking data",
            Version = ProviderVersion,
            Vendor = "GPSGate",
            SupportUrl = "https://gpsgate.com/support",
            ConfigurationRequirements = new List<ConfigurationRequirement>
            {
                new ConfigurationRequirement { Key = "ApiKey", DisplayName = "API Key", IsRequired = true, IsSecure = true },
                new ConfigurationRequirement { Key = "BaseUrl", DisplayName = "Base URL", IsRequired = true },
                new ConfigurationRequirement { Key = "ApplicationId", DisplayName = "Application ID", IsRequired = true, DataType = "int" }
            }
        };

        #endregion

        public GPSGateProvider(
            GpsdataContext context,
            HttpClient httpClient,
            ILogger<GPSGateProvider> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration)
        {
            try
            {
                _logger.LogInformation("Initializing GPSGate provider with configuration");

                // Extract configuration from JSON data
                var configData = configuration.GetAllValues();

                _apiKey = configuration.GetValue<string>("ApiKey");
                if (string.IsNullOrEmpty(_apiKey))
                {
                    return FMSResponse<bool>.Failed("ApiKey configuration is required");
                }

                _baseUrl = configuration.GetValue<string>("BaseUrl");
                if (string.IsNullOrEmpty(_baseUrl))
                {
                    return FMSResponse<bool>.Failed("BaseUrl configuration is required");
                }

                var appIdStr = configuration.GetValue<string>("ApplicationId");
                if (!string.IsNullOrEmpty(appIdStr) && int.TryParse(appIdStr, out var appId))
                {
                    _applicationId = appId;
                }
                else
                {
                    _logger.LogWarning("ApplicationId not configured, using default value of 1");
                    _applicationId = 1;
                }

                // Configure HttpClient
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", _apiKey);

                // Test connection
                var testResponse = await ValidateConnectionAsync();

                if (!testResponse.IsSuccess)
                {
                    _logger.LogError("GPSGate provider initialization failed: {Message}", testResponse.Message);
                    return FMSResponse<bool>.Failed($"Connection test failed: {testResponse.Message}");
                }

                _initialized = true;
                _logger.LogInformation("GPSGate provider initialized successfully");

                return FMSResponse<bool>.Success(true, "GPSGate provider initialized successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing GPSGate provider");
                return FMSResponse<bool>.Failed($"Initialization error: {ex.Message}");
            }
        }        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> ShutdownAsync()
        {
            try
            {
                _logger.LogInformation("Shutting down GPSGate provider");
                _initialized = false;
                _httpClient.DefaultRequestHeaders.Clear();
                return await Task.FromResult(FMSResponse<bool>.Success(true, "Provider shutdown successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during shutdown");
                return FMSResponse<bool>.Failed($"Shutdown error: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> ValidateConfigurationAsync(ProviderConfiguration configuration)
        {
            try
            {
                var apiKey = configuration.GetValue<string>("ApiKey");
                if (string.IsNullOrEmpty(apiKey))
                {
                    return FMSResponse<bool>.Failed("ApiKey is required");
                }

                var baseUrl = configuration.GetValue<string>("BaseUrl");
                if (string.IsNullOrEmpty(baseUrl))
                {
                    return FMSResponse<bool>.Failed("BaseUrl is required");
                }

                var appIdStr = configuration.GetValue<string>("ApplicationId");
                if (string.IsNullOrEmpty(appIdStr))
                {
                    return FMSResponse<bool>.Failed("ApplicationId is required");
                }

                if (!int.TryParse(appIdStr, out _))
                {
                    return FMSResponse<bool>.Failed("ApplicationId must be a valid integer");
                }

                return await Task.FromResult(FMSResponse<bool>.Success(true, "Configuration is valid"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating configuration");
                return FMSResponse<bool>.Failed($"Validation error: {ex.Message}");
            }
        }        /// <inheritdoc/>
        public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
        {
            if (!_initialized)
            {
                return FMSResponse<VehicleLocationDTO>.Failed("Provider not initialized");
            }

            try
            {
                _logger.LogDebug("Getting location for vehicle {VehicleId} from GPSGate", vehicleId);

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
                    _logger.LogWarning(
                        "Failed to get GPS data for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);

                    return FMSResponse<VehicleLocationDTO>.Failed(
                        $"GPS API returned status code: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsData = JsonSerializer.Deserialize<GPSGateUserStatus>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // Build response DTO
                var locationDto = new VehicleLocationDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate,
                    HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                    DeviceId = vehicle.DeviceId,
                    IsOnline = gpsData?.Position != null
                };

                if (gpsData?.Position != null)
                {
                    locationDto.Latitude = (decimal)gpsData.Position.Latitude;
                    locationDto.Longitude = (decimal)gpsData.Position.Longitude;
                    locationDto.Altitude = gpsData.Position.Altitude.HasValue
                        ? (decimal)gpsData.Position.Altitude
                        : null;
                    locationDto.LastUpdated = DateTime.TryParse(gpsData.UTC, out var lastUpdate)
                        ? lastUpdate
                        : DateTime.UtcNow;
                    locationDto.Speed = gpsData.Velocity?.GroundSpeed.HasValue == true
                        ? (decimal)gpsData.Velocity.GroundSpeed
                        : null;
                    locationDto.Heading = gpsData.Velocity?.Heading.HasValue == true
                        ? (decimal)gpsData.Velocity.Heading
                        : null;
                }
                else
                {
                    locationDto.LastUpdated = DateTime.UtcNow;
                }

                return FMSResponse<VehicleLocationDTO>.Success(locationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle location for {VehicleId}", vehicleId);
                return FMSResponse<VehicleLocationDTO>.Failed($"Error retrieving vehicle location: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
            int vehicleId,
            DateTime from,
            DateTime to)
        {
            if (!_initialized)
            {
                return FMSResponse<List<VehicleHistoryPoint>>.Failed("Provider not initialized");
            }

            try
            {
                _logger.LogDebug(
                    "Getting history for vehicle {VehicleId} from {From} to {To}",
                    vehicleId, from, to);

                // Get vehicle info from database
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId && v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                {
                    return FMSResponse<List<VehicleHistoryPoint>>.Failed(
                        "Vehicle not found or doesn't have GPS installed");
                }

                if (!vehicle.DeviceId.HasValue)
                {
                    return FMSResponse<List<VehicleHistoryPoint>>.Failed(
                        "Vehicle doesn't have a GPS device ID configured");
                }

                // Format dates for GPSGate API (yyyy-MM-dd format)
                var formattedDate = from.ToString("yyyy-MM-dd");
                var fromTime = from.ToString("HH:mm:ss");
                var toTime = to.ToString("HH:mm:ss");

                // Get tracks from GPSGate API
                var url = $"{_baseUrl}/applications/{_applicationId}/users/{vehicle.DeviceId}/tracks" +
                         $"?Date={formattedDate}&From={fromTime}&Until={toTime}&Filtered=true";

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "Failed to get history for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);

                    return FMSResponse<List<VehicleHistoryPoint>>.Failed(
                        $"GPS API returned status code: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var tracks = JsonSerializer.Deserialize<List<GPSGateTrack>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // Convert to VehicleHistoryPoint
                var history = tracks?.Select(t => new VehicleHistoryPoint
                {
                    Latitude = (decimal)(t.Position?.Latitude ?? 0),
                    Longitude = (decimal)(t.Position?.Longitude ?? 0),
                    Altitude = t.Position?.Altitude.HasValue == true ? (decimal)t.Position.Altitude : null,
                    Speed = t.Velocity?.GroundSpeed.HasValue == true ? (decimal)t.Velocity.GroundSpeed : null,
                    Heading = t.Velocity?.Heading.HasValue == true ? (decimal)t.Velocity.Heading : null,
                    Timestamp = DateTime.TryParse(t.UTC, out var timestamp) ? timestamp : DateTime.UtcNow
                }).ToList() ?? new List<VehicleHistoryPoint>();

                return FMSResponse<List<VehicleHistoryPoint>>.Success(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle history for {VehicleId}", vehicleId);
                return FMSResponse<List<VehicleHistoryPoint>>.Failed(
                    $"Error retrieving vehicle history: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync()
        {
            try
            {
                if (!_initialized)
                {
                    return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
                    {
                        Status = HealthStatus.Unhealthy,
                        Message = "Provider not initialized",
                        CheckedAt = DateTime.UtcNow
                    });
                }

                // Test connection to GPSGate API
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}",
                    new System.Threading.CancellationToken());

                var healthStatus = new ProviderHealthStatus
                {
                    Status = response.IsSuccessStatusCode ? HealthStatus.Healthy : HealthStatus.Unhealthy,
                    Message = response.IsSuccessStatusCode
                        ? "GPS Gate API is accessible"
                        : $"GPS Gate API returned {response.StatusCode}",
                    CheckedAt = DateTime.UtcNow,
                    ResponseTimeMs = 0 // Could add timing if needed
                };

                return FMSResponse<ProviderHealthStatus>.Success(healthStatus);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "GPSGate API health check failed");

                return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
                {
                    Status = HealthStatus.Unhealthy,
                    Message = $"API not accessible: {ex.Message}",
                    CheckedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking GPSGate provider health");

                return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
                {
                    Status = HealthStatus.Unhealthy,
                    Message = $"Health check error: {ex.Message}",
                    CheckedAt = DateTime.UtcNow
                });
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> ValidateConnectionAsync()
        {
            try
            {
                if (string.IsNullOrEmpty(_baseUrl) || _applicationId == 0)
                {
                    return FMSResponse<bool>.Failed("Provider configuration is incomplete");
                }

                var response = await _httpClient.GetAsync($"{_baseUrl}/applications/{_applicationId}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("GPSGate connection validated successfully");
                    return FMSResponse<bool>.Success(true, "Connection validated successfully");
                }
                else
                {
                    _logger.LogWarning("GPSGate connection validation failed with status: {StatusCode}",
                        response.StatusCode);
                    return FMSResponse<bool>.Failed($"Connection validation failed: HTTP {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating GPSGate connection");
                return FMSResponse<bool>.Failed($"Connection validation error: {ex.Message}");
            }
        }

        #region Advanced Features (Optional)

        /// <inheritdoc/>
        public async Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(
            bool onlineOnly = false,
            bool gpsEnabledOnly = true)
        {
            if (!_initialized)
            {
                return FMSResponse<List<VehicleLocationDTO>>.Failed("Provider not initialized");
            }

            try
            {
                _logger.LogDebug("Getting all vehicle locations. OnlineOnly: {OnlineOnly}, GPSEnabledOnly: {GPSEnabledOnly}",
                    onlineOnly, gpsEnabledOnly);

                // Get all GPS-enabled vehicles from database
                var vehicles = await _context.Vehicles
                    .Where(v => v.HasGPSInstalled == 1 && v.DeviceId.HasValue && v.IsActive == 1)
                    .ToListAsync();

                if (!vehicles.Any())
                {
                    return FMSResponse<List<VehicleLocationDTO>>.Success(new List<VehicleLocationDTO>());
                }

                // Get bulk location data from GPSGate
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/usersstatus?PageSize=1000");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get bulk GPS data. Status: {StatusCode}", response.StatusCode);
                    return FMSResponse<List<VehicleLocationDTO>>.Failed(
                        $"GPS API returned status code: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsUsers = JsonSerializer.Deserialize<List<GPSGateUserStatus>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // Match vehicles with GPS data
                var locationDtos = new List<VehicleLocationDTO>();

                foreach (var vehicle in vehicles)
                {
                    var gpsData = gpsUsers?.FirstOrDefault(u => u.Id == vehicle.DeviceId);
                    var isOnline = gpsData?.Position != null;

                    if (onlineOnly && !isOnline)
                        continue;

                    var dto = new VehicleLocationDTO
                    {
                        VehicleId = vehicle.VehicleId,
                        VehicleName = vehicle.HyoungNo ?? string.Empty,
                        NumberPlate = vehicle.NumberPlate,
                        HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                        DeviceId = vehicle.DeviceId,
                        IsOnline = isOnline,
                        LastUpdated = DateTime.UtcNow
                    };

                    if (gpsData?.Position != null)
                    {
                        dto.Latitude = (decimal)gpsData.Position.Latitude;
                        dto.Longitude = (decimal)gpsData.Position.Longitude;
                        dto.Altitude = gpsData.Position.Altitude.HasValue ? (decimal)gpsData.Position.Altitude : null;
                        dto.LastUpdated = DateTime.TryParse(gpsData.UTC, out var lastUpdate) ? lastUpdate : DateTime.UtcNow;
                        dto.Speed = gpsData.Velocity?.GroundSpeed.HasValue == true ? (decimal)gpsData.Velocity.GroundSpeed : null;
                        dto.Heading = gpsData.Velocity?.Heading.HasValue == true ? (decimal)gpsData.Velocity.Heading : null;
                    }

                    locationDtos.Add(dto);
                }

                return FMSResponse<List<VehicleLocationDTO>>.Success(locationDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all vehicle locations");
                return FMSResponse<List<VehicleLocationDTO>>.Failed($"Error retrieving locations: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId)
        {
            if (!_initialized)
            {
                return FMSResponse<VehicleOdometerDTO>.Failed("Provider not initialized");
            }

            try
            {
                _logger.LogDebug("Getting odometer for vehicle {VehicleId} from GPSGate", vehicleId);

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

                // Get accumulator data from GPSGate API
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/accumulators?UserId={vehicle.DeviceId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get odometer for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);
                    return FMSResponse<VehicleOdometerDTO>.Failed(
                        $"GPS API returned status code: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var accumulators = JsonSerializer.Deserialize<List<GPSGateAccumulator>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // AccumulatorTypeId 1 is distance/odometer in GPSGate
                var odometerData = accumulators?.FirstOrDefault(a => a.AccumulatorTypeId == 1);

                if (odometerData == null || !odometerData.Value.HasValue)
                {
                    return FMSResponse<VehicleOdometerDTO>.Failed("No odometer data available");
                }

                // Convert from meters to kilometers
                var odometerKm = (decimal)odometerData.Value.Value / 1000;

                var odometerDto = new VehicleOdometerDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    CurrentOdometer = odometerKm,
                    TotalDistance = odometerKm,
                    LastUpdated = DateTime.TryParse(odometerData.Timestamp, out var timestamp)
                        ? timestamp
                        : DateTime.UtcNow
                };

                return FMSResponse<VehicleOdometerDTO>.Success(odometerDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving odometer for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleOdometerDTO>.Failed($"Error retrieving odometer: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId)
        {
            var locationResult = await GetVehicleLocationAsync(vehicleId);

            if (!locationResult.IsSuccess)
            {
                return FMSResponse<bool>.Failed(locationResult.Message);
            }

            return FMSResponse<bool>.Success(locationResult.Data?.IsOnline ?? false);
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync()
        {
            // GPSGate supports geofences, but not implemented in this initial version
            // TODO: Implement geofence retrieval from GPSGate API
            _logger.LogWarning("GetGeofencesAsync not implemented yet");
            return await Task.FromResult(
                FMSResponse<List<GeofenceDTO>>.Success(new List<GeofenceDTO>(),
                    "Geofence support not implemented yet"));
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> SubscribeToEventsAsync(IEventHandler eventHandler)
        {
            // GPSGate event subscription not implemented in this version
            _logger.LogWarning("SubscribeToEventsAsync not implemented");
            return await Task.FromResult(FMSResponse<bool>.Failed("Event subscription not supported"));
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> UnsubscribeFromEventsAsync()
        {
            // GPSGate event subscription not implemented in this version
            return await Task.FromResult(FMSResponse<bool>.Success(true, "No active subscriptions"));
        }

        #endregion

        public void Dispose()
        {
            // HttpClient disposal is handled by the DI container (registered as typed client)
            // No manual disposal needed
            _initialized = false;
        }
    }

    #region GPSGate API Response Models

    /// <summary>
    /// GPSGate user status response model
    /// </summary>
    public class GPSGateUserStatus
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? UTC { get; set; }
        public GPSGatePosition? Position { get; set; }
        public GPSGateVelocity? Velocity { get; set; }
    }

    /// <summary>
    /// GPSGate position data
    /// </summary>
    public class GPSGatePosition
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Altitude { get; set; }
    }

    /// <summary>
    /// GPSGate velocity data
    /// </summary>
    public class GPSGateVelocity
    {
        public double? GroundSpeed { get; set; }
        public double? Heading { get; set; }
    }

    /// <summary>
    /// GPSGate track point from history
    /// </summary>
    public class GPSGateTrack
    {
        public string? UTC { get; set; }
        public GPSGatePosition? Position { get; set; }
        public GPSGateVelocity? Velocity { get; set; }
        public bool Valid { get; set; }
        public string? ServerUtc { get; set; }
        public int TrackInfoId { get; set; }
    }

    /// <summary>
    /// GPSGate accumulator data for odometer
    /// </summary>
    public class GPSGateAccumulator
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int AccumulatorTypeId { get; set; }
        public double? Value { get; set; }
        public string? Timestamp { get; set; }
    }

    #endregion
}
