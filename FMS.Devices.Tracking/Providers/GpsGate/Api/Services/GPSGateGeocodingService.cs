using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Implementation of geocoding services for GPSGate
    /// Provides reverse geocoding to convert coordinates to human-readable addresses
    /// </summary>
    public class GPSGateGeocodingService : IGPSGateGeocodingService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GPSGateGeocodingService> _logger;
        private readonly IGPSGateConfigurationProvider _configurationProvider;

        public GPSGateGeocodingService(
            GpsdataContext context,
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<GPSGateGeocodingService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _configurationProvider = configurationProvider ?? throw new ArgumentNullException(nameof(configurationProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Perform reverse geocoding to get address from coordinates
        /// </summary>
        public async Task<FMSResponse<ReverseGeocodeResultDTO>> ReverseGeocodeAsync(decimal longitude, decimal latitude)
        {
            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                // Build the reverse geocode URL
                // Format: /applications/{applicationId}/reversegeocode?lon={longitude}&lat={latitude}
                var requestUrl = $"{baseUrl}/applications/{applicationId}/reversegeocode?lon={longitude}&lat={latitude}";

                _logger.LogDebug("Requesting reverse geocode from: {Url}", requestUrl);

                using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Reverse geocoding failed. Status: {StatusCode}, Response: {Response}",
                        response.StatusCode, errorContent);
                    return FMSResponse<ReverseGeocodeResultDTO>.Failed($"Reverse geocoding failed with status: {response.StatusCode}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var geocodeResponse = JsonSerializer.Deserialize<GPSGateReverseGeocodeResponse>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (geocodeResponse?.Location == null)
                {
                    _logger.LogWarning("Reverse geocoding returned null location for coordinates: {Longitude}, {Latitude}",
                        longitude, latitude);
                    return FMSResponse<ReverseGeocodeResultDTO>.Failed("No location data returned from geocoding service");
                }

                var result = new ReverseGeocodeResultDTO
                {
                    GeocoderProviderSource = geocodeResponse.GeocoderProviderSource,
                    Address = geocodeResponse.Location.Address,
                    FormattedResult = geocodeResponse.Location.FormattedResult,
                    Longitude = longitude,
                    Latitude = latitude,
                    Altitude = geocodeResponse.Location.Position?.Altitude.HasValue == true
                        ? (decimal)geocodeResponse.Location.Position.Altitude.Value
                        : null
                };

                _logger.LogInformation("Successfully reverse geocoded coordinates ({Longitude}, {Latitude}) to: {Address}",
                    longitude, latitude, result.FormattedResult);

                return FMSResponse<ReverseGeocodeResultDTO>.Success(result, "Reverse geocoding successful");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing reverse geocoding for coordinates: {Longitude}, {Latitude}",
                    longitude, latitude);
                return FMSResponse<ReverseGeocodeResultDTO>.Failed($"Error performing reverse geocoding: {ex.Message}");
            }
        }

        /// <summary>
        /// Perform reverse geocoding for a vehicle using its current location
        /// </summary>
        public async Task<FMSResponse<ReverseGeocodeResultDTO>> ReverseGeocodeVehicleAsync(int vehicleId)
        {
            try
            {
                // First, get the vehicle's current location
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync();

                if (vehicle == null)
                    return FMSResponse<ReverseGeocodeResultDTO>.Failed("Vehicle not found");

                // Try to get device ID from vehicle_provider_mappings first (new way)
                var providerMapping = await _context.DeviceProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .Where(m => m.VehicleId == vehicleId
                        && m.IsActive
                        && m.ProviderConfiguration.Name == FMS.Devices.Tracking.Providers.GpsGate.GpsGateProviderConstants.Name
                        && m.ProviderConfiguration.IsEnabled)
                    .FirstOrDefaultAsync();

                var externalDeviceId = providerMapping?.ExternalDeviceId;

                if (string.IsNullOrEmpty(externalDeviceId))
                    return FMSResponse<ReverseGeocodeResultDTO>.Failed("Vehicle doesn't have an active GPS provider mapping configured");

                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                // Get current position from GPS device status
                var statusUrl = $"{baseUrl}/applications/{applicationId}/users/{externalDeviceId}/status";

                using var statusRequest = new HttpRequestMessage(HttpMethod.Get, statusUrl);
                statusRequest.Headers.Authorization = authHeader;
                var statusResponse = await _httpClient.SendAsync(statusRequest);

                if (!statusResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get GPS status for vehicle {VehicleId}. Status: {StatusCode}",
                        vehicleId, statusResponse.StatusCode);
                    return FMSResponse<ReverseGeocodeResultDTO>.Failed("Failed to retrieve vehicle location");
                }

                var statusContent = await statusResponse.Content.ReadAsStringAsync();
                var gpsData = JsonSerializer.Deserialize<GPSGateUserStatusForGeocode>(statusContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (gpsData?.Position == null)
                {
                    return FMSResponse<ReverseGeocodeResultDTO>.Failed("No GPS position available for vehicle");
                }

                // Now perform reverse geocoding with the coordinates
                return await ReverseGeocodeAsync((decimal)gpsData.Position.Longitude, (decimal)gpsData.Position.Latitude);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing reverse geocoding for vehicle {VehicleId}", vehicleId);
                return FMSResponse<ReverseGeocodeResultDTO>.Failed($"Error performing reverse geocoding: {ex.Message}");
            }
        }
    }

    #region GPSGate Response Models

    /// <summary>
    /// GPSGate reverse geocode API response
    /// </summary>
    internal class GPSGateReverseGeocodeResponse
    {
        public string? GeocoderProviderSource { get; set; }
        public GPSGateLocationData? Location { get; set; }
    }

    internal class GPSGateLocationData
    {
        public GPSGatePositionData? Position { get; set; }
        public string? Address { get; set; }
        public string? FormattedResult { get; set; }
    }

    internal class GPSGatePositionData
    {
        public double? Altitude { get; set; }
        public double Longitude { get; set; }
        public double Latitude { get; set; }
    }

    /// <summary>
    /// Simplified GPS status for geocoding purposes
    /// </summary>
    internal class GPSGateUserStatusForGeocode
    {
        public GPSGatePositionData? Position { get; set; }
    }

    #endregion
}
