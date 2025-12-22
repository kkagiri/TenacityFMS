using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Implementation of GPSGate tracks REST API service.
    /// Fetches GPS track data from GPSGate REST API endpoint: GET /applications/{appId}/users/{deviceId}/tracks
    /// </summary>
    public class GPSGateTracksService : IGPSGateTracksService
    {
        private readonly HttpClient _httpClient;
        private readonly IGPSGateConfigurationProvider _configurationProvider;
        private readonly ILogger<GPSGateTracksService> _logger;

        // Known fuel sensor variable names (case-insensitive)
        private static readonly HashSet<string> FuelVariableNames = new(StringComparer.OrdinalIgnoreCase)
        {
            "fuel level", "fuellevel", "rawfuel", "fuel"
        };

        public GPSGateTracksService(
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<GPSGateTracksService> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _configurationProvider = configurationProvider ?? throw new ArgumentNullException(nameof(configurationProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public async Task<List<GPSGateTrack>?> FetchTracksAsync(
            string externalDeviceId,
            DateTime date,
            string fromTime,
            string untilTime,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(externalDeviceId))
            {
                _logger.LogWarning("FetchTracksAsync: externalDeviceId is required");
                return null;
            }

            // Don't proceed if already cancelled
            if (cancellationToken.IsCancellationRequested)
            {
                _logger.LogDebug("Skipping fetch for device {DeviceId} - operation already cancelled", externalDeviceId);
                return null;
            }

            try
            {
                // Get GPSGate configuration (BaseUrl, ApplicationId, Auth)
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();

                // Build GPSGate REST API endpoint
                // Example: GET /applications/12/users/759/tracks?Date=2025-12-17&From=00:00:00&Until=23:59:59
                var tracksUrl = $"{baseUrl}/applications/{applicationId}/users/{externalDeviceId}/tracks?Date={date:yyyy-MM-dd}&From={fromTime}&Until={untilTime}";

                using var request = new HttpRequestMessage(HttpMethod.Get, tracksUrl);
                request.Headers.Authorization = authHeader;

                _logger.LogDebug("Fetching tracks for device {DeviceId} on {Date} from {From} to {Until}",
                    externalDeviceId, date.ToString("yyyy-MM-dd"), fromTime, untilTime);

                // Use a separate timeout that doesn't affect the main cancellation token
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

                var response = await _httpClient.SendAsync(request, linkedCts.Token);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to fetch tracks for device {DeviceId}. Status: {StatusCode}, Reason: {Reason}",
                        externalDeviceId, response.StatusCode, response.ReasonPhrase);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync(linkedCts.Token);

                var tracks = JsonSerializer.Deserialize<List<GPSGateTrack>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogDebug("Fetched {Count} track points for device {DeviceId} on {Date}",
                    tracks?.Count ?? 0, externalDeviceId, date.ToString("yyyy-MM-dd"));

                return tracks;
            }
            catch (TaskCanceledException)
            {
                // Timeout or cancellation - don't log as error, just return null
                _logger.LogWarning("GPSGate API timeout for device {DeviceId} - request took too long", externalDeviceId);
                return null;
            }
            catch (HttpRequestException ex)
            {
                // Network error - log and return null
                _logger.LogWarning("GPSGate network error for device {DeviceId}: {Message}", externalDeviceId, ex.Message);
                return null;
            }
            catch (IOException ex)
            {
                // Socket/transport error - log and return null
                _logger.LogWarning("GPSGate I/O error for device {DeviceId}: {Message}", externalDeviceId, ex.Message);
                return null;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse GPSGate response for device {DeviceId}", externalDeviceId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error fetching tracks for device {DeviceId}", externalDeviceId);
                return null;
            }
        }

        /// <inheritdoc />
        public async Task<List<GPSGateTrack>?> FetchDayTracksAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            return await FetchTracksAsync(externalDeviceId, date, "00:00:00", "23:59:59", cancellationToken);
        }

        /// <inheritdoc />
        public bool HasFuelData(GPSGateTrack track)
        {
            if (track == null)
                return false;

            return track.Variables?.Any(v =>
                FuelVariableNames.Contains(v.Name?.Trim() ?? "") &&
                decimal.TryParse(v.Value, out _)) == true;
        }

        /// <inheritdoc />
        public decimal? ExtractFuelLevel(GPSGateTrack track)
        {
            if (track?.Variables == null || !track.Variables.Any())
                return null;

            // Prefer "Fuel level" over "Rawfuel"
            var fuelVar = track.Variables.FirstOrDefault(v =>
                v.Name?.Trim().Equals("Fuel level", StringComparison.OrdinalIgnoreCase) == true);

            fuelVar ??= track.Variables.FirstOrDefault(v =>
                FuelVariableNames.Contains(v.Name?.Trim() ?? ""));

            if (fuelVar != null && decimal.TryParse(fuelVar.Value, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var fuelLevel))
            {
                return fuelLevel;
            }

            return null;
        }

        /// <inheritdoc />
        public bool? ExtractIgnitionStatus(GPSGateTrack track)
        {
            if (track?.Variables == null || !track.Variables.Any())
                return null;

            var ignitionVar = track.Variables.FirstOrDefault(v =>
                v.Name?.Trim().Equals("Ignition", StringComparison.OrdinalIgnoreCase) == true ||
                v.Name?.Trim().Equals("ignition", StringComparison.OrdinalIgnoreCase) == true);

            if (ignitionVar != null)
            {
                if (bool.TryParse(ignitionVar.Value, out var ignition))
                    return ignition;

                // Handle "1"/"0" or "on"/"off"
                if (ignitionVar.Value?.Equals("1", StringComparison.OrdinalIgnoreCase) == true ||
                    ignitionVar.Value?.Equals("on", StringComparison.OrdinalIgnoreCase) == true)
                    return true;

                if (ignitionVar.Value?.Equals("0", StringComparison.OrdinalIgnoreCase) == true ||
                    ignitionVar.Value?.Equals("off", StringComparison.OrdinalIgnoreCase) == true)
                    return false;
            }

            return null;
        }

        /// <inheritdoc />
        public async Task<List<FuelLevelReading>?> GetDayFuelLevelsAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Fetch all tracks for the day
                var tracks = await FetchDayTracksAsync(externalDeviceId, date, cancellationToken);

                if (tracks == null || !tracks.Any())
                {
                    _logger.LogDebug("No tracks found for device {DeviceId} on {Date}",
                        externalDeviceId, date.ToString("yyyy-MM-dd"));
                    return null;
                }

                // Extract fuel levels with timestamps from tracks that have fuel data
                var fuelReadings = tracks
                    .Where(t => HasFuelData(t))
                    .Select(t => new FuelLevelReading
                    {
                        Timestamp = DateTime.TryParse(t.UTC, out var timestamp) ? timestamp : date,
                        FuelLevel = ExtractFuelLevel(t) ?? 0,
                        IgnitionStatus = ExtractIgnitionStatus(t),
                        Latitude = t.Position?.Latitude != null ? (decimal)t.Position.Latitude : null,
                        Longitude = t.Position?.Longitude != null ? (decimal)t.Position.Longitude : null,
                        TrackInfoId = t.TrackInfoId
                    })
                    .OrderBy(r => r.Timestamp)
                    .ToList();

                _logger.LogDebug("Retrieved {Count} fuel readings for device {DeviceId} on {Date}",
                    fuelReadings.Count, externalDeviceId, date.ToString("yyyy-MM-dd"));

                return fuelReadings.Any() ? fuelReadings : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting day fuel levels for device {DeviceId}", externalDeviceId);
                return null;
            }
        }
    }
}
