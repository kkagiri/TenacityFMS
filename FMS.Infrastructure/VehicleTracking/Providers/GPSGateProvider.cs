using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Infrastructure.VehicleTracking.Interfaces;
using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
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

        private string? _username;
        private string? _password;
        private string? _apiToken;
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
                new ConfigurationRequirement { Key = "Username", DisplayName = "Username", IsRequired = true, IsSecure = false },
                new ConfigurationRequirement { Key = "Password", DisplayName = "Password", IsRequired = true, IsSecure = true },
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

                // Extract configuration values
                _username = configuration.GetValue<string>("Username");
                if (string.IsNullOrEmpty(_username))
                {
                    return FMSResponse<bool>.Failed("Username configuration is required");
                }

                _password = configuration.GetValue<string>("Password");
                if (string.IsNullOrEmpty(_password))
                {
                    return FMSResponse<bool>.Failed("Password configuration is required");
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
                    return FMSResponse<bool>.Failed("ApplicationId is required and must be a valid integer");
                }

                // Authenticate and get API token from GPSGate
                var authResult = await AuthenticateAsync();
                if (!authResult.IsSuccess)
                {
                    _logger.LogError("GPSGate authentication failed: {Message}", authResult.Message);
                    return FMSResponse<bool>.Failed($"Authentication failed: {authResult.Message}");
                }

                // Test connection with the token
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
        }

        /// <summary>
        /// Authenticate with GPSGate API and get access token
        /// </summary>
        private async Task<FMSResponse<bool>> AuthenticateAsync()
        {
            try
            {
                _logger.LogInformation("Authenticating with GPSGate API for user {Username}", _username);

                // Build the authentication request URL
                var tokenUrl = $"{_baseUrl}/applications/{_applicationId}/tokens";

                // Create the authentication payload
                var authPayload = new
                {
                    username = _username,
                    password = _password
                };

                var jsonContent = JsonSerializer.Serialize(authPayload);
                var httpContent = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                // Make the authentication request
                var response = await _httpClient.PostAsync(tokenUrl, httpContent);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("GPSGate authentication failed. Status: {StatusCode}, Response: {Response}",
                        response.StatusCode, errorContent);
                    return FMSResponse<bool>.Failed($"Authentication failed: {response.StatusCode} - {errorContent}");
                }

                // Parse the token response
                var responseContent = await response.Content.ReadAsStringAsync();
                var tokenResponse = JsonSerializer.Deserialize<GPSGateTokenResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.Token))
                {
                    _logger.LogError("Failed to parse GPSGate token response");
                    return FMSResponse<bool>.Failed("Failed to obtain authentication token");
                }

                _apiToken = tokenResponse.Token;

                // Configure HttpClient with the token
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", _apiToken);

                _logger.LogInformation("Successfully authenticated with GPSGate.");

                return FMSResponse<bool>.Success(true, "Authentication successful");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate authentication");
                return FMSResponse<bool>.Failed($"Authentication error: {ex.Message}");
            }
        }

        /// <inheritdoc/>
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
                var username = configuration.GetValue<string>("Username");
                if (string.IsNullOrEmpty(username))
                {
                    return FMSResponse<bool>.Failed("Username is required");
                }

                var password = configuration.GetValue<string>("Password");
                if (string.IsNullOrEmpty(password))
                {
                    return FMSResponse<bool>.Failed("Password is required");
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
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
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

                // Re-authenticate if no token is set (provider instance may have been reloaded)
                if (string.IsNullOrEmpty(_apiToken))
                {
                    _logger.LogWarning("API token not found during health check, attempting re-authentication");
                    var authResult = await AuthenticateAsync();
                    if (!authResult.IsSuccess)
                    {
                        _logger.LogWarning("Failed to re-authenticate during health check: {Message}", authResult.Message);
                        return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
                        {
                            Status = HealthStatus.Unhealthy,
                            Message = $"Authentication failed: {authResult.Message}",
                            CheckedAt = DateTime.UtcNow,
                            ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                        });
                    }
                }

                // Test connection to GPSGate API using /views endpoint (requires authentication)
                var healthCheckUrl = $"{_baseUrl}/applications/{_applicationId}/views";
                _logger.LogDebug("Performing health check to {HealthCheckUrl} with token {TokenLength} chars",
                    healthCheckUrl, _apiToken?.Length ?? 0);

                var response = await _httpClient.GetAsync(healthCheckUrl, new System.Threading.CancellationToken());

                stopwatch.Stop();

                var healthStatus = new ProviderHealthStatus
                {
                    Status = response.IsSuccessStatusCode ? HealthStatus.Healthy : HealthStatus.Unhealthy,
                    Message = response.IsSuccessStatusCode
                        ? "GPS Gate API is accessible"
                        : $"GPS Gate API returned {response.StatusCode}",
                    CheckedAt = DateTime.UtcNow,
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                };

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("GPSGate health check failed with status {StatusCode}: {ErrorContent}",
                        response.StatusCode, errorContent);
                }

                return FMSResponse<ProviderHealthStatus>.Success(healthStatus);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "GPSGate API health check failed - HTTP error");

                return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
                {
                    Status = HealthStatus.Unhealthy,
                    Message = $"API not accessible: {ex.Message}",
                    CheckedAt = DateTime.UtcNow,
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking GPSGate provider health");

                return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
                {
                    Status = HealthStatus.Unhealthy,
                    Message = $"Health check error: {ex.Message}",
                    CheckedAt = DateTime.UtcNow,
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
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

                // Test with /views endpoint which requires authentication
                var response = await _httpClient.GetAsync($"{_baseUrl}/applications/{_applicationId}/views");

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
            // TODO: GPSGate event subscription not implemented in this version
            _logger.LogWarning("SubscribeToEventsAsync not implemented");
            return await Task.FromResult(FMSResponse<bool>.Failed("Event subscription not supported"));
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<bool>> UnsubscribeFromEventsAsync()
        {
            // TODO: GPSGate event subscription not implemented in this version
            return await Task.FromResult(FMSResponse<bool>.Success(true, "No active subscriptions"));
        }

        /// <inheritdoc/>
        public async Task<FMSResponse<List<GPSDeviceDTO>>> GetAllDevicesAsync()
        {
            if (!_initialized)
            {
                return FMSResponse<List<GPSDeviceDTO>>.Failed("Provider not initialized");
            }

            try
            {
                _logger.LogInformation("Fetching all devices from GPSGate for application {ApplicationId}", _applicationId);

                // Call GPSGate API to get all users with pagination
                var response = await _httpClient.GetAsync(
                    $"{_baseUrl}/applications/{_applicationId}/users?FromIndex=0&PageSize=5000");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "Failed to get users from GPSGate. Status: {StatusCode}",
                        response.StatusCode);

                    return FMSResponse<List<GPSDeviceDTO>>.Failed(
                        $"GPS API returned status code: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var gpsUsers = JsonSerializer.Deserialize<List<GPSGateUser>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (gpsUsers == null || !gpsUsers.Any())
                {
                    _logger.LogInformation("No users found in GPSGate system");
                    return FMSResponse<List<GPSDeviceDTO>>.Success(new List<GPSDeviceDTO>());
                }

                _logger.LogInformation("Retrieved {Count} users from GPSGate", gpsUsers.Count);

                // Get all current vehicle-to-provider mappings
                var mappings = await _context.VehicleProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .Where(m => m.IsActive && m.ProviderConfiguration.Name == ProviderName)
                    .Include(m => m.Vehicle)
                    .ToListAsync();

                // Convert to DTOs
                var devices = new List<GPSDeviceDTO>();
                foreach (var user in gpsUsers)
                {
                    var device = user.Devices?.FirstOrDefault();
                    var trackPoint = user.TrackPoint;

                    // Check if this device is mapped to a vehicle
                    var mapping = mappings.FirstOrDefault(m =>
                        m.ExternalDeviceId == user.Id.ToString());

                    var dto = new GPSDeviceDTO
                    {
                        Id = user.Id,
                        Username = user.Username ?? string.Empty,
                        Name = user.Name ?? string.Empty,
                        Surname = user.Surname,
                        Email = user.Email,
                        IMEI = device?.IMEI,
                        PhoneNumber = device?.Msisdn?.Raw,
                        DeviceType = device?.Name,
                        Protocol = device?.ProtocolID,
                        ProviderName = ProviderName,

                        // Position data from trackPoint
                        Latitude = trackPoint?.Position != null ? (decimal)trackPoint.Position.Latitude : null,
                        Longitude = trackPoint?.Position != null ? (decimal)trackPoint.Position.Longitude : null,
                        Altitude = trackPoint?.Position?.Altitude.HasValue == true ? (decimal)trackPoint.Position.Altitude : null,
                        Speed = trackPoint?.Velocity?.GroundSpeed.HasValue == true ? (decimal)trackPoint.Velocity.GroundSpeed : null,
                        Heading = trackPoint?.Velocity?.Heading.HasValue == true ? (decimal)trackPoint.Velocity.Heading : null,

                        // Timestamps
                        LastPositionUpdate = DateTime.TryParse(trackPoint?.UTC, out var posTime) ? posTime : null,
                        LastDeviceActivity = DateTime.TryParse(user.DeviceActivity, out var actTime) ? actTime : null,

                        // Status
                        IsOnline = trackPoint?.Valid ?? false,
                        IsPositionValid = trackPoint?.Valid ?? false,

                        // Mapping info
                        IsMapped = mapping != null,
                        MappedVehicleId = mapping?.VehicleId,
                        MappedVehicleName = mapping?.Vehicle?.HyoungNo,
                        MappedVehicleNumberPlate = mapping?.Vehicle?.NumberPlate,

                        // Additional metadata
                        AdditionalData = new Dictionary<string, object>
                        {
                            { "UserTemplateID", user.UserTemplateID },
                            { "CalculatedSpeed", user.CalculatedSpeed },
                            { "DeviceId", device?.Id ?? 0 },
                            { "DeviceDefinitionID", device?.DeviceDefinitionID ?? 0 }
                        }
                    };

                    devices.Add(dto);
                }

                _logger.LogInformation(
                    "Converted {Total} GPSGate users to devices. Mapped: {Mapped}, Unmapped: {Unmapped}",
                    devices.Count,
                    devices.Count(d => d.IsMapped),
                    devices.Count(d => !d.IsMapped));

                return FMSResponse<List<GPSDeviceDTO>>.Success(devices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving devices from GPSGate");
                return FMSResponse<List<GPSDeviceDTO>>.Failed($"Error retrieving devices: {ex.Message}");
            }
        }

        #endregion

        public void Dispose()
        {
            // HttpClient disposal is handled by the DI container (registered as typed client)
            // No manual disposal needed
            _initialized = false;
        }
    }
}
