using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Implementation of location and tracking services for GPSGate.
    ///
    /// IMPORTANT: This service uses VehicleProviderMapping.ExternalDeviceId to query the GPS provider,
    /// NOT the legacy Vehicle.DeviceId field.
    ///
    /// GPS Validation Rules for Fueling:
    /// - If TrackPoint.Valid = true AND DeviceActivity within 1 month → Allow fueling (Valid)
    /// - If TrackPoint.Valid = false BUT DeviceActivity within 2 hours → Allow fueling (InvalidButRecentActivity)
    /// - If TrackPoint.Valid = true BUT DeviceActivity older than 1 month → Block fueling + Create notification (ValidButStaleDevice)
    /// - If TrackPoint.Valid = false AND DeviceActivity older than 2 hours → Block fueling (InvalidAndStale)
    /// </summary>
    public class GPSGateLocationService : IGPSGateLocationService
    {
        private sealed class StalePositionLogState
        {
            public DateTime LastLoggedAtUtc { get; set; }
            public int SuppressedCount { get; set; }
        }

        private readonly IDbContextFactory<GpsdataContext> _contextFactory;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateLocationService> _logger;
        private readonly IGPSGateConfigurationProvider _configurationProvider;

        // Per-vehicle stale-position warning throttling state (shared across service instances)
        private static readonly ConcurrentDictionary<int, StalePositionLogState> StalePositionLogStates = new();

        // Configuration thresholds
        private static readonly TimeSpan InvalidGpsActivityThreshold = TimeSpan.FromHours(2);
        private static readonly TimeSpan StaleDeviceThreshold = TimeSpan.FromDays(30); // 1 month
        private static readonly TimeSpan StalePositionThreshold = TimeSpan.FromHours(24); // Position older than 24 hours is stale
        private static readonly TimeSpan StalePositionLogThrottleWindow = TimeSpan.FromMinutes(30);
        private static readonly TimeSpan StalePositionLogStateRetention = TimeSpan.FromHours(12);

        public GPSGateLocationService(
            IDbContextFactory<GpsdataContext> contextFactory,
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<GPSGateLocationService> logger)
        {
            _contextFactory = contextFactory;
            _httpClient = httpClient;
            _configurationProvider = configurationProvider;
            _logger = logger;
        }

        public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();

                // Step 1: Get vehicle info
                var vehicle = await context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<VehicleLocationDTO>.Failed("Vehicle not found");

                // Step 2: Check if vehicle has GPS installed
                if (vehicle.HasGPSInstalled != 1)
                {
                    _logger.LogDebug("Vehicle {VehicleId} does not have GPS installed - returning NoGPSInstalled status", vehicleId);
                    return FMSResponse<VehicleLocationDTO>.Success(new VehicleLocationDTO
                    {
                        VehicleId = vehicleId,
                        VehicleName = vehicle.HyoungNo ?? string.Empty,
                        NumberPlate = vehicle.NumberPlate,
                        HasGPSInstalled = false,
                        IsOnline = false,
                        LastUpdated = DateTime.UtcNow,
                        ValidationStatus = GPSValidationStatus.NoGPSInstalled,
                        ValidationStatusReason = "Vehicle does not have GPS installed"
                    });
                }

                // Step 3: Get the ExternalDeviceId from VehicleProviderMapping (NOT Vehicle.DeviceId)
                var providerMapping = await context.Set<VehicleProviderMappingEntity>()
                    .Where(m => m.VehicleId == vehicleId && m.IsActive)
                    .FirstOrDefaultAsync();

                if (providerMapping == null || string.IsNullOrEmpty(providerMapping.ExternalDeviceId))
                {
                    _logger.LogWarning("Vehicle {VehicleId} has GPS installed but no active provider mapping with ExternalDeviceId", vehicleId);
                    return FMSResponse<VehicleLocationDTO>.Failed(
                        "Vehicle has GPS installed but no GPS provider mapping configured. Please set up the VehicleProviderMapping with ExternalDeviceId.");
                }

                // Parse ExternalDeviceId as int for GPSGate API
                if (!int.TryParse(providerMapping.ExternalDeviceId, out int gpsGateUserId))
                {
                    _logger.LogError("Invalid ExternalDeviceId '{ExternalDeviceId}' for vehicle {VehicleId} - must be numeric for GPSGate",
                        providerMapping.ExternalDeviceId, vehicleId);
                    return FMSResponse<VehicleLocationDTO>.Failed(
                        $"Invalid GPS provider device ID format: {providerMapping.ExternalDeviceId}");
                }

                // Step 4: Get GPS provider settings
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                // Step 5: Call GPSGate API with the correct endpoint
                // API: GET /applications/{applicationId}/users/{userId}
                var requestUrl = $"{baseUrl}/applications/{applicationId}/users/{gpsGateUserId}";

                _logger.LogDebug("Fetching GPS location for vehicle {VehicleId} from GPSGate: {Url}",
                    vehicleId, requestUrl);

                using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get GPS data for vehicle {VehicleId} (GPSGate user {GpsUserId}). Status: {StatusCode}",
                        vehicleId, gpsGateUserId, response.StatusCode);

                    // Try cached location as fallback
                    var cachedLocation = await GetCachedVehicleLocationAsync(vehicleId, 60);
                    if (cachedLocation != null)
                    {
                        _logger.LogWarning("[GPS_CACHE] API call failed, using cached location for vehicle {VehicleId}", vehicleId);
                        return FMSResponse<VehicleLocationDTO>.Success(cachedLocation);
                    }

                    return FMSResponse<VehicleLocationDTO>.Failed("Failed to retrieve vehicle location from GPS provider");
                }

                // Step 6: Parse response with new structure
                var content = await response.Content.ReadAsStringAsync();

                _logger.LogTrace("GPSGate response for vehicle {VehicleId}: {Response}", vehicleId, content);

                var gpsData = JsonSerializer.Deserialize<GPSGateUserStatus>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (gpsData == null)
                {
                    _logger.LogWarning("Failed to parse GPS response for vehicle {VehicleId}", vehicleId);

                    // Try cached location as fallback
                    var cachedLocation = await GetCachedVehicleLocationAsync(vehicleId, 60);
                    if (cachedLocation != null)
                    {
                        _logger.LogWarning("[GPS_CACHE] No GPS data from provider, using cached location for vehicle {VehicleId}", vehicleId);
                        return FMSResponse<VehicleLocationDTO>.Success(cachedLocation);
                    }

                    return FMSResponse<VehicleLocationDTO>.Success(CreateOfflineLocationDto(vehicle, providerMapping, GPSValidationStatus.NoData, "No GPS data received from provider"));
                }

                // Step 7: Extract position from TrackPoint (new structure) or legacy Position field
                var position = gpsData.EffectivePosition;
                var velocity = gpsData.EffectiveVelocity;
                var utcString = gpsData.EffectiveUtc;
                var isGpsValid = gpsData.IsGPSValid;
                var deviceActivity = gpsData.DeviceActivity;

                if (position == null)
                {
                    _logger.LogDebug("No position data available for vehicle {VehicleId}", vehicleId);

                    // Try cached location as fallback
                    var cachedLocation = await GetCachedVehicleLocationAsync(vehicleId, 60);
                    if (cachedLocation != null)
                    {
                        _logger.LogWarning("[GPS_CACHE] No position data from GPS provider, using cached location for vehicle {VehicleId}", vehicleId);
                        return FMSResponse<VehicleLocationDTO>.Success(cachedLocation);
                    }

                    return FMSResponse<VehicleLocationDTO>.Success(CreateOfflineLocationDto(vehicle, providerMapping, GPSValidationStatus.NoData, "No GPS position available"));
                }

                // Parse the position timestamp
                DateTime? positionTimestamp = null;
                if (!string.IsNullOrEmpty(utcString) && DateTime.TryParse(utcString, out var parsedUtc))
                {
                    positionTimestamp = parsedUtc;
                }

                // Step 8: Determine GPS validation status based on valid flag, deviceActivity, AND position age
                var (validationStatus, validationReason) = DetermineValidationStatus(
                    isGpsValid,
                    deviceActivity,
                    positionTimestamp,
                    vehicleId,
                    gpsGateUserId,
                    "SingleVehicleLocation");

                // Step 9: Build the location DTO
                var locationDto = new VehicleLocationDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate,
                    Latitude = (decimal)position.Latitude,
                    Longitude = (decimal)position.Longitude,
                    Altitude = position.Altitude.HasValue ? (decimal)position.Altitude : null,
                    LastUpdated = positionTimestamp ?? DateTime.UtcNow,
                    Speed = velocity?.GroundSpeed.HasValue == true ? (decimal)velocity.GroundSpeed : null,
                    Heading = velocity?.Heading.HasValue == true ? (decimal)velocity.Heading : null,
                    IsOnline = validationStatus != GPSValidationStatus.InvalidAndStale &&
                              validationStatus != GPSValidationStatus.StalePositionBypassed, // Mark as offline if position is stale
                    HasGPSInstalled = true,
                    DeviceId = vehicle.DeviceId, // Keep legacy field for backward compatibility
                    ExternalDeviceId = providerMapping.ExternalDeviceId,

                    // GPS Validation fields
                    IsGPSValid = isGpsValid,
                    DeviceActivityTime = deviceActivity,
                    ValidationStatus = validationStatus,
                    ValidationStatusReason = validationReason
                };

                _logger.LogDebug(
                    "Vehicle {VehicleId} GPS location: ({Lat}, {Lng}), Valid: {Valid}, DeviceActivity: {Activity}, ValidationStatus: {Status}",
                    vehicleId, position.Latitude, position.Longitude, isGpsValid, deviceActivity, validationStatus);

                // Cache this location for future fallback
                _ = CacheVehicleLocationAsync(locationDto);

                return FMSResponse<VehicleLocationDTO>.Success(locationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle location for {VehicleId}", vehicleId);

                // Try to return cached location on exception
                var cachedLocation = await GetCachedVehicleLocationAsync(vehicleId, 60);
                if (cachedLocation != null)
                {
                    _logger.LogWarning("[GPS_CACHE] Live GPS failed, using cached location for vehicle {VehicleId}", vehicleId);
                    return FMSResponse<VehicleLocationDTO>.Success(cachedLocation);
                }

                return FMSResponse<VehicleLocationDTO>.Failed($"Error retrieving vehicle location: {ex.Message}");
            }
        }

        /// <summary>
        /// Determines the GPS validation status based on the valid flag, device activity time, and position age.
        ///
        /// Rules:
        /// - If GPS position is older than 24 hours → InvalidAndStale (block fueling, position is stale)
        /// - Valid=true AND DeviceActivity within 1 month → Valid (allow fueling)
        /// - Valid=false AND DeviceActivity within 2 hours → InvalidButRecentActivity (allow fueling)
        /// - Valid=true AND DeviceActivity older than 1 month → ValidButStaleDevice (block + notify)
        /// - Valid=false AND DeviceActivity older than 2 hours → InvalidAndStale (block)
        /// </summary>
        private (GPSValidationStatus Status, string Reason) DetermineValidationStatus(
            bool isGpsValid,
            DateTime? deviceActivity,
            DateTime? positionTimestamp,
            int vehicleId,
            int gpsGateUserId,
            string validationSource)
        {
            var now = DateTime.UtcNow;

            // FIRST: Check if the GPS position itself is stale (too old)
            // This catches cases like the GPS sending 2024 data in 2026
            // NOTE: Stale GPS position is treated as a FAULTY DEVICE - fueling is ALLOWED but logged
            if (positionTimestamp.HasValue)
            {
                var positionAge = now - positionTimestamp.Value;
                if (positionAge > StalePositionThreshold)
                {
                    if (ShouldLogStalePositionWarning(vehicleId, now, out var suppressedSinceLastWarning))
                    {
                        _logger.LogWarning(
                            "⚠️ [{Source}] Vehicle {VehicleId} (GPSGate {GpsUserId}): GPS POSITION IS STALE - Position timestamp: {PositionTime} ({Age} old). " +
                            "GPS device may be offline or malfunctioning. FUELING ALLOWED (treated as faulty GPS) but logged for review. " +
                            "SuppressedDuplicatesSinceLastWarning: {SuppressedCount}",
                            validationSource,
                            vehicleId,
                            gpsGateUserId,
                            positionTimestamp.Value,
                            FormatTimeSpan(positionAge),
                            suppressedSinceLastWarning);

                        CleanupExpiredStalePositionLogStates(now);
                    }

                    return (GPSValidationStatus.StalePositionBypassed,
                        $"GPS position is stale ({FormatTimeSpan(positionAge)} old, at {positionTimestamp.Value:yyyy-MM-dd HH:mm:ss} UTC). " +
                        $"Treated as faulty GPS device - fueling allowed but logged for review.");
                }
            }
            else
            {
                // No position timestamp available - this is suspicious
                _logger.LogDebug("Vehicle {VehicleId} (GPSGate {GpsUserId}): No position timestamp available - cannot verify position freshness",
                    vehicleId, gpsGateUserId);
            }

            // If no device activity timestamp, we can't make a determination
            if (!deviceActivity.HasValue)
            {
                if (isGpsValid)
                {
                    // GPS is valid but we don't know device activity - assume it's okay
                    return (GPSValidationStatus.Valid, "GPS position is valid (no device activity timestamp available)");
                }
                else
                {
                    // GPS invalid and no activity timestamp - can't trust it
                    _logger.LogDebug("Vehicle {VehicleId} (GPSGate {GpsUserId}): GPS invalid with no device activity timestamp",
                        vehicleId, gpsGateUserId);
                    return (GPSValidationStatus.InvalidAndStale, "GPS position is invalid and device activity time is unknown");
                }
            }

            var timeSinceActivity = now - deviceActivity.Value;

            if (isGpsValid)
            {
                // GPS is valid - check if device is stale (older than 1 month)
                if (timeSinceActivity > StaleDeviceThreshold)
                {
                    _logger.LogDebug(
                        "⚠️ Vehicle {VehicleId} (GPSGate {GpsUserId}): GPS is VALID but device activity is STALE ({Days} days old). " +
                        "BLOCKING FUELING and requiring notification.",
                        vehicleId, gpsGateUserId, timeSinceActivity.TotalDays);

                    return (GPSValidationStatus.ValidButStaleDevice,
                        $"GPS position is valid but device has not reported for {timeSinceActivity.TotalDays:F0} days. " +
                        "Device may be offline. Administrator notification required.");
                }
                else
                {
                    // GPS valid and device is active - all good
                    return (GPSValidationStatus.Valid, "GPS position is valid and device is active");
                }
            }
            else
            {
                // GPS is invalid - check if device was active recently (within 2 hours)
                if (timeSinceActivity <= InvalidGpsActivityThreshold)
                {
                    _logger.LogInformation(
                        "Vehicle {VehicleId} (GPSGate {GpsUserId}): GPS is INVALID but device was active {Minutes} minutes ago. " +
                        "ALLOWING FUELING based on recent activity.",
                        vehicleId, gpsGateUserId, timeSinceActivity.TotalMinutes);

                    return (GPSValidationStatus.InvalidButRecentActivity,
                        $"GPS position is invalid but device was active {timeSinceActivity.TotalMinutes:F0} minutes ago. Fueling allowed.");
                }
                else
                {
                    _logger.LogDebug(
                        "❌ Vehicle {VehicleId} (GPSGate {GpsUserId}): GPS is INVALID and device activity is too old ({Hours} hours). " +
                        "BLOCKING FUELING.",
                        vehicleId, gpsGateUserId, timeSinceActivity.TotalHours);

                    return (GPSValidationStatus.InvalidAndStale,
                        $"GPS position is invalid and device has not been active for {timeSinceActivity.TotalHours:F1} hours. " +
                        "Cannot verify vehicle location.");
                }
            }
        }

        private VehicleLocationDTO CreateOfflineLocationDto(
            Domain.Entities.Vehicle vehicle,
            VehicleProviderMappingEntity? providerMapping,
            GPSValidationStatus status,
            string reason)
        {
            return new VehicleLocationDTO
            {
                VehicleId = vehicle.VehicleId,
                VehicleName = vehicle.HyoungNo ?? string.Empty,
                NumberPlate = vehicle.NumberPlate,
                HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                DeviceId = vehicle.DeviceId,
                ExternalDeviceId = providerMapping?.ExternalDeviceId,
                IsOnline = false,
                LastUpdated = DateTime.UtcNow,
                ValidationStatus = status,
                ValidationStatusReason = reason
            };
        }

        public async Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(bool onlineOnly = false, bool gpsEnabledOnly = true)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();

                // Step 1: Get vehicles with GPS installed
                var vehiclesQuery = context.Vehicles.AsQueryable();

                if (gpsEnabledOnly)
                    vehiclesQuery = vehiclesQuery.Where(v => v.HasGPSInstalled == 1);

                var vehicles = await vehiclesQuery.Where(v => v.IsActive == 1).ToListAsync();

                if (!vehicles.Any())
                    return FMSResponse<List<VehicleLocationDTO>>.Success(new List<VehicleLocationDTO>());

                // Step 2: Get all active provider mappings for these vehicles
                var vehicleIds = vehicles.Select(v => v.VehicleId).ToList();
                var providerMappings = await context.Set<VehicleProviderMappingEntity>()
                    .Where(m => vehicleIds.Contains(m.VehicleId) && m.IsActive && !string.IsNullOrEmpty(m.ExternalDeviceId))
                    .ToDictionaryAsync(m => m.VehicleId, m => m);

                // Filter vehicles to only those with provider mappings if GPS enabled only
                if (gpsEnabledOnly)
                {
                    vehicles = vehicles.Where(v => providerMappings.ContainsKey(v.VehicleId)).ToList();
                }

                if (!vehicles.Any())
                    return FMSResponse<List<VehicleLocationDTO>>.Success(new List<VehicleLocationDTO>());

                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                // Step 3: Call GPSGate bulk status API
                using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/applications/{applicationId}/usersstatus?PageSize=1000");
                request.Headers.Authorization = authHeader;
                var response = await _httpClient.SendAsync(request);

                var locations = new List<VehicleLocationDTO>();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get GPS data for multiple vehicles. Status: {StatusCode}", response.StatusCode);

                    foreach (var vehicle in vehicles)
                    {
                        providerMappings.TryGetValue(vehicle.VehicleId, out var mapping);
                        locations.Add(CreateOfflineLocationDto(vehicle, mapping, GPSValidationStatus.NoData, "GPS provider unavailable"));
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
                        providerMappings.TryGetValue(vehicle.VehicleId, out var mapping);

                        // Match by ExternalDeviceId (parsed as int)
                        GPSGateUserStatus? userStatus = null;
                        if (mapping != null && int.TryParse(mapping.ExternalDeviceId, out int externalId))
                        {
                            userStatus = usersStatus?.FirstOrDefault(u => u.Id == externalId);
                        }

                        if (userStatus == null)
                        {
                            if (!onlineOnly)
                                locations.Add(CreateOfflineLocationDto(vehicle, mapping, GPSValidationStatus.NoData, "No GPS data from provider"));
                            continue;
                        }

                        // Use effective position/velocity (supports both old and new API structure)
                        var position = userStatus.EffectivePosition;
                        var velocity = userStatus.EffectiveVelocity;
                        var isGpsValid = userStatus.IsGPSValid;
                        var deviceActivity = userStatus.DeviceActivity;
                        var utcString = userStatus.EffectiveUtc;

                        if (position == null)
                        {
                            if (!onlineOnly)
                                locations.Add(CreateOfflineLocationDto(vehicle, mapping, GPSValidationStatus.NoData, "No GPS position available"));
                            continue;
                        }

                        // Parse position timestamp for staleness check
                        DateTime? positionTimestamp = null;
                        if (!string.IsNullOrEmpty(utcString) && DateTime.TryParse(utcString, out var parsedUtc))
                        {
                            positionTimestamp = parsedUtc;
                        }

                        // Determine validation status
                        var (validationStatus, validationReason) = DetermineValidationStatus(
                            isGpsValid,
                            deviceActivity,
                            positionTimestamp,
                            vehicle.VehicleId,
                            int.TryParse(mapping?.ExternalDeviceId, out int gpsId) ? gpsId : 0,
                            "BulkVehicleLocations");

                        var location = new VehicleLocationDTO
                        {
                            VehicleId = vehicle.VehicleId,
                            VehicleName = vehicle.HyoungNo ?? string.Empty,
                            NumberPlate = vehicle.NumberPlate,
                            HasGPSInstalled = vehicle.HasGPSInstalled == 1,
                            DeviceId = vehicle.DeviceId,
                            ExternalDeviceId = mapping?.ExternalDeviceId,
                            IsOnline = true,
                            Latitude = (decimal)position.Latitude,
                            Longitude = (decimal)position.Longitude,
                            Altitude = position.Altitude.HasValue ? (decimal)position.Altitude : null,
                            Speed = velocity?.GroundSpeed.HasValue == true ? (decimal)velocity.GroundSpeed : null,
                            Heading = velocity?.Heading.HasValue == true ? (decimal)velocity.Heading : null,
                            LastUpdated = DateTime.TryParse(userStatus.EffectiveUtc, out var lastUpdate) ? lastUpdate : DateTime.UtcNow,
                            IsGPSValid = isGpsValid,
                            DeviceActivityTime = deviceActivity,
                            ValidationStatus = validationStatus,
                            ValidationStatusReason = validationReason
                        };

                        if (!onlineOnly || location.IsOnline)
                            locations.Add(location);
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

        public async Task<FMSResponse<VehicleTrackHistoryDTO>> GetTrackHistoryAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var vehicle = await context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<VehicleTrackHistoryDTO>.Failed("Vehicle not found");

                if (!vehicle.DeviceId.HasValue)
                    return FMSResponse<VehicleTrackHistoryDTO>.Failed("Vehicle doesn't have a GPS device ID configured");

                // Get track data from GPSGate
                var trackPoints = await GetTrackPointsAsync(vehicleId, from, to, maxPoints);

                if (!trackPoints.IsSuccess || trackPoints.Data == null)
                    return FMSResponse<VehicleTrackHistoryDTO>.Failed(trackPoints.Message ?? "Failed to retrieve track data");

                var points = trackPoints.Data;

                // Calculate statistics
                var history = new VehicleTrackHistoryDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate ?? string.Empty,
                    FromDate = from,
                    ToDate = to,
                    TrackPoints = points,
                    TotalDistance = CalculateTotalDistance(points),
                    TotalDuration = to - from,
                    AverageSpeed = points.Where(p => p.Speed.HasValue).Average(p => p.Speed) ?? 0,
                    MaxSpeed = points.Where(p => p.Speed.HasValue).Max(p => p.Speed) ?? 0,
                    Stops = DetectStops(points)
                };

                history.StopCount = history.Stops.Count;

                return FMSResponse<VehicleTrackHistoryDTO>.Success(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving track history for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleTrackHistoryDTO>.Failed($"Error retrieving track history: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<TrackPointDTO>>> GetTrackPointsAsync(int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var vehicle = await context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<List<TrackPointDTO>>.Failed("Vehicle not found");

                if (!vehicle.DeviceId.HasValue)
                    return FMSResponse<List<TrackPointDTO>>.Failed("Vehicle doesn't have a GPS device ID configured");

                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                // Call GPSGate tracks API
                var requestBody = new
                {
                    userIds = new[] { vehicle.DeviceId.Value },
                    from = from.ToString("o"),
                    to = to.ToString("o"),
                    maxPoints = maxPoints
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/applications/{applicationId}/tracks")
                {
                    Content = content
                };
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get track data for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, response.StatusCode);
                    return FMSResponse<List<TrackPointDTO>>.Failed("Failed to retrieve track data from GPS provider");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var tracks = JsonSerializer.Deserialize<List<GPSGateTrack>>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var trackPoints = new List<TrackPointDTO>();

                if (tracks != null && tracks.Any())
                {
                    trackPoints = tracks.Select(track => new TrackPointDTO
                    {
                        Latitude = (decimal)(track.Position?.Latitude ?? 0.0),
                        Longitude = (decimal)(track.Position?.Longitude ?? 0.0),
                        Altitude = track.Position?.Altitude.HasValue == true ? (decimal?)track.Position.Altitude.Value : null,
                        Speed = track.Velocity?.GroundSpeed.HasValue == true ? (decimal?)track.Velocity.GroundSpeed.Value : null,
                        Heading = track.Velocity?.Heading.HasValue == true ? (decimal?)track.Velocity.Heading.Value : null,
                        Timestamp = !string.IsNullOrEmpty(track.UTC) ? DateTime.Parse(track.UTC) : DateTime.UtcNow,
                        Odometer = null // GPSGate track doesn't include odometer in basic track
                    }).ToList();
                }

                return FMSResponse<List<TrackPointDTO>>.Success(trackPoints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving track points for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<TrackPointDTO>>.Failed($"Error retrieving track points: {ex.Message}");
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

        public async Task<FMSResponse<bool>> SubscribeToLocationUpdatesAsync(int vehicleId)
        {
            // Placeholder for real-time updates via SignalR/WebSocket
            // This would be implemented when real-time tracking is needed
            await Task.CompletedTask;
            return FMSResponse<bool>.Success(true);
        }

        public async Task<FMSResponse<decimal>> GetVehicleOdometerAsync(int vehicleId)
        {
            try
            {
                var location = await GetVehicleLocationAsync(vehicleId);
                if (!location.IsSuccess || location.Data == null)
                {
                    return FMSResponse<decimal>.Failed("Failed to get vehicle location");
                }

                // GPSGate may provide odometer in the location data
                // If not available, return 0 or calculate from track history
                return FMSResponse<decimal>.Success(location.Data.Odometer ?? 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting odometer for vehicle {VehicleId}", vehicleId);
                return FMSResponse<decimal>.Failed($"Error getting odometer: {ex.Message}");
            }
        }

        public decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            return CalculateDistance((double)lat1, (double)lon1, (double)lat2, (double)lon2);
        }

        #region Helper Methods

        private decimal CalculateTotalDistance(List<TrackPointDTO> points)
        {
            if (points == null || points.Count < 2)
                return 0;

            decimal totalDistance = 0;

            for (int i = 1; i < points.Count; i++)
            {
                totalDistance += CalculateDistance(
                    (double)points[i - 1].Latitude, (double)points[i - 1].Longitude,
                    (double)points[i].Latitude, (double)points[i].Longitude);
            }

            return totalDistance;
        }

        private decimal CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // Haversine formula
            const double R = 6371; // Earth's radius in kilometers

            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = R * c;

            return (decimal)distance;
        }

        private double ToRadians(double degrees)
        {
            return degrees * (Math.PI / 180);
        }

        private List<StopInfo> DetectStops(List<TrackPointDTO> points, double speedThreshold = 5.0, int minStopDurationMinutes = 5)
        {
            var stops = new List<StopInfo>();

            if (points == null || points.Count < 2)
                return stops;

            StopInfo? currentStop = null;

            foreach (var point in points.OrderBy(p => p.Timestamp))
            {
                var speed = point.Speed ?? 0;

                if (speed < (decimal)speedThreshold)
                {
                    if (currentStop == null)
                    {
                        // Start of a new stop
                        currentStop = new StopInfo
                        {
                            Latitude = point.Latitude,
                            Longitude = point.Longitude,
                            StartTime = point.Timestamp,
                            EndTime = point.Timestamp,
                            Address = point.Address
                        };
                    }
                    else
                    {
                        // Continuing stop
                        currentStop.EndTime = point.Timestamp;
                    }
                }
                else
                {
                    // Vehicle is moving
                    if (currentStop != null)
                    {
                        currentStop.Duration = currentStop.EndTime - currentStop.StartTime;

                        // Only add stop if duration is above threshold
                        if (currentStop.Duration.TotalMinutes >= minStopDurationMinutes)
                        {
                            stops.Add(currentStop);
                        }

                        currentStop = null;
                    }
                }
            }

            // Add final stop if exists
            if (currentStop != null)
            {
                currentStop.Duration = currentStop.EndTime - currentStop.StartTime;
                if (currentStop.Duration.TotalMinutes >= minStopDurationMinutes)
                {
                    stops.Add(currentStop);
                }
            }

            return stops;
        }

        #endregion

        #region Location Caching

        /// <summary>
        /// Cache a vehicle's location for fallback when live GPS is unavailable
        /// </summary>
        private async Task CacheVehicleLocationAsync(VehicleLocationDTO locationDto)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var cached = await context.VehicleLastKnownLocations
                    .FirstOrDefaultAsync(c => c.VehicleId == locationDto.VehicleId);

                if (cached == null)
                {
                    cached = new VehicleLastKnownLocationEntity
                    {
                        VehicleId = locationDto.VehicleId
                    };
                    context.VehicleLastKnownLocations.Add(cached);
                }

                // Update cached location
                cached.Latitude = locationDto.Latitude;
                cached.Longitude = locationDto.Longitude;
                cached.Altitude = locationDto.Altitude;
                cached.Speed = locationDto.Speed;
                cached.Heading = locationDto.Heading;
                cached.IsGpsValid = locationDto.IsGPSValid;
                cached.DeviceActivityTime = locationDto.DeviceActivityTime;
                cached.ExternalDeviceId = locationDto.ExternalDeviceId;
                cached.CachedAt = DateTime.UtcNow;
                cached.Source = "GPSGate";

                await context.SaveChangesAsync();

                _logger.LogDebug("Cached location for vehicle {VehicleId}: ({Lat}, {Lng}) at {CachedAt}",
                    locationDto.VehicleId, locationDto.Latitude, locationDto.Longitude, cached.CachedAt);
            }
            catch (Exception ex)
            {
                // Don't fail the main operation if caching fails
                _logger.LogWarning(ex, "Failed to cache location for vehicle {VehicleId}", locationDto.VehicleId);
            }
        }

        /// <summary>
        /// Get cached location for a vehicle when live GPS is unavailable
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="maxAgeMinutes">Maximum cache age in minutes (null = no limit)</param>
        /// <returns>Cached location DTO with IsCached=true, or null if not found/expired</returns>
        public async Task<VehicleLocationDTO?> GetCachedVehicleLocationAsync(int vehicleId, int? maxAgeMinutes = 60)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync();
                var cached = await context.VehicleLastKnownLocations
                    .Include(c => c.Vehicle)
                    .FirstOrDefaultAsync(c => c.VehicleId == vehicleId);

                if (cached == null)
                {
                    _logger.LogDebug("No cached location found for vehicle {VehicleId}", vehicleId);
                    return null;
                }

                // Check cache age
                var cacheAge = DateTime.UtcNow - cached.CachedAt;
                if (maxAgeMinutes.HasValue && cacheAge.TotalMinutes > maxAgeMinutes.Value)
                {
                    _logger.LogDebug("Cached location for vehicle {VehicleId} is too old ({Age} minutes, max {Max})",
                        vehicleId, cacheAge.TotalMinutes, maxAgeMinutes);
                    return null;
                }

                _logger.LogInformation(
                    "[GPS_CACHE] Using cached location for vehicle {VehicleId}: ({Lat}, {Lng}), cached {Age} minutes ago",
                    vehicleId, cached.Latitude, cached.Longitude, cacheAge.TotalMinutes);

                return new VehicleLocationDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = cached.Vehicle?.HyoungNo ?? string.Empty,
                    NumberPlate = cached.Vehicle?.NumberPlate,
                    Latitude = cached.Latitude,
                    Longitude = cached.Longitude,
                    Altitude = cached.Altitude,
                    Speed = cached.Speed,
                    Heading = cached.Heading,
                    IsGPSValid = cached.IsGpsValid,
                    DeviceActivityTime = cached.DeviceActivityTime,
                    ExternalDeviceId = cached.ExternalDeviceId,
                    HasGPSInstalled = true,
                    IsOnline = false, // Not currently online
                    IsCached = true,  // Flag indicating this is from cache
                    LastUpdated = cached.CachedAt,
                    ValidationStatus = GPSValidationStatus.CachedLocation,
                    ValidationStatusReason = $"Using cached location from {cacheAge.TotalMinutes:F0} minutes ago"
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error retrieving cached location for vehicle {VehicleId}", vehicleId);
                return null;
            }
        }

        #endregion

        #region Helper Methods

        /// <summary>
        /// Formats a TimeSpan into a human-readable string.
        /// </summary>
        private static string FormatTimeSpan(TimeSpan timeSpan)
        {
            if (timeSpan.TotalDays >= 1)
            {
                var days = (int)timeSpan.TotalDays;
                var hours = timeSpan.Hours;
                return hours > 0 ? $"{days} days {hours} hours" : $"{days} days";
            }
            else if (timeSpan.TotalHours >= 1)
            {
                var hours = (int)timeSpan.TotalHours;
                var minutes = timeSpan.Minutes;
                return minutes > 0 ? $"{hours} hours {minutes} minutes" : $"{hours} hours";
            }
            else if (timeSpan.TotalMinutes >= 1)
            {
                return $"{(int)timeSpan.TotalMinutes} minutes";
            }
            else
            {
                return $"{(int)timeSpan.TotalSeconds} seconds";
            }
        }

        private static bool ShouldLogStalePositionWarning(int vehicleId, DateTime nowUtc, out int suppressedSinceLastWarning)
        {
            var state = StalePositionLogStates.GetOrAdd(vehicleId, _ => new StalePositionLogState
            {
                LastLoggedAtUtc = DateTime.MinValue,
                SuppressedCount = 0
            });

            lock (state)
            {
                if (state.LastLoggedAtUtc == DateTime.MinValue || nowUtc - state.LastLoggedAtUtc >= StalePositionLogThrottleWindow)
                {
                    suppressedSinceLastWarning = state.SuppressedCount;
                    state.LastLoggedAtUtc = nowUtc;
                    state.SuppressedCount = 0;
                    return true;
                }

                state.SuppressedCount++;
                suppressedSinceLastWarning = state.SuppressedCount;
                return false;
            }
        }

        private static void CleanupExpiredStalePositionLogStates(DateTime nowUtc)
        {
            foreach (var kvp in StalePositionLogStates)
            {
                var state = kvp.Value;
                var shouldRemove = false;

                lock (state)
                {
                    shouldRemove = nowUtc - state.LastLoggedAtUtc > StalePositionLogStateRetention
                                   && state.SuppressedCount == 0;
                }

                if (shouldRemove)
                {
                    StalePositionLogStates.TryRemove(kvp.Key, out _);
                }
            }
        }

        #endregion
    }
}
