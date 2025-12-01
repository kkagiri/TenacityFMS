using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Services;
using FMS.Domain.Entities.FuelAudit;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Implementation of IFuelAuditGPSService for GPSGate provider.
    /// Fetches GPS-based fuel data for fuel audits with caching and parallel processing.
    /// </summary>
    public class FuelAuditGPSService : IFuelAuditGPSService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly IGPSGateConfigurationProvider _configurationProvider;
        private readonly ILogger<FuelAuditGPSService> _logger;

        // Throttling for parallel API calls
        private const int MaxConcurrentApiCalls = 10;
        private const int MaxDaysToSearchBack = 7;
        private static readonly SemaphoreSlim _apiThrottle = new(MaxConcurrentApiCalls);

        // Known fuel sensor variable names (case-insensitive)
        private static readonly HashSet<string> FuelVariableNames = new(StringComparer.OrdinalIgnoreCase)
        {
            "fuel level", "fuellevel", "rawfuel", "fuel"
        };

        public FuelAuditGPSService(
            GpsdataContext context,
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<FuelAuditGPSService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _configurationProvider = configurationProvider ?? throw new ArgumentNullException(nameof(configurationProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public async Task<FMSResponse<VehicleFuelPositionDTO>> GetVehicleFuelAtDateAsync(
            int vehicleId,
            DateTime date,
            string readingType = "opening",
            bool useCache = true,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogDebug("Getting fuel position for vehicle {VehicleId} on {Date} ({ReadingType})",
                    vehicleId, date.ToString("yyyy-MM-dd"), readingType);

                // Check cache first if enabled
                if (useCache)
                {
                    var cachedReading = await GetCachedReadingAsync(vehicleId, date, readingType, cancellationToken);
                    if (cachedReading != null)
                    {
                        _logger.LogDebug("Found cached reading for vehicle {VehicleId}", vehicleId);
                        return FMSResponse<VehicleFuelPositionDTO>.Success(cachedReading);
                    }
                }

                // Get vehicle and device mapping
                var deviceMapping = await GetDeviceMappingAsync(vehicleId, cancellationToken);

                VehicleFuelPositionDTO? fuelPosition = null;

                if (deviceMapping != null)
                {
                    // Try GPS provider first
                    fuelPosition = await FetchFuelPositionFromGPSGateAsync(
                        vehicleId,
                        deviceMapping.ExternalDeviceId,
                        date,
                        readingType,
                        cancellationToken);
                }

                // If no GPS data (no mapping or GPS returned null/unavailable), try manual refill data
                if (fuelPosition == null ||
                    fuelPosition.DataQuality == FuelDataQuality.Unavailable ||
                    fuelPosition.DataQuality == FuelDataQuality.NoSensor ||
                    fuelPosition.DataQuality == FuelDataQuality.SensorNotReporting)
                {
                    var manualFuelPosition = await TryGetFuelFromManualRefillAsync(
                        vehicleId, date, readingType, cancellationToken);

                    if (manualFuelPosition != null)
                    {
                        // If we had GPS data but it was poor quality, keep note of it
                        if (fuelPosition != null && fuelPosition.DataQuality != FuelDataQuality.NoSensor)
                        {
                            manualFuelPosition.DataQualityReason =
                                $"GPS: {fuelPosition.DataQuality}. {manualFuelPosition.DataQualityReason}";
                        }
                        fuelPosition = manualFuelPosition;
                    }
                }

                if (fuelPosition == null)
                {
                    fuelPosition = deviceMapping == null
                        ? CreateNoSensorResult(vehicleId, date, readingType)
                        : CreateUnavailableResult(vehicleId, date, readingType);
                }

                // Cache the result
                await CacheReadingAsync(fuelPosition, cancellationToken);

                return FMSResponse<VehicleFuelPositionDTO>.Success(fuelPosition);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fuel position for vehicle {VehicleId} on {Date}",
                    vehicleId, date.ToString("yyyy-MM-dd"));
                return FMSResponse<VehicleFuelPositionDTO>.Failed($"Error retrieving fuel data: {ex.Message}");
            }
        }

        /// <inheritdoc />
        public async Task<FMSResponse<FleetFuelPositionResponseDTO>> GetFleetFuelAtDateAsync(
            FleetFuelPositionRequestDTO request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (request.VehicleIds == null || !request.VehicleIds.Any())
                {
                    return FMSResponse<FleetFuelPositionResponseDTO>.Failed("No vehicle IDs provided");
                }

                _logger.LogInformation("Getting fleet fuel positions for {Count} vehicles on {Date}",
                    request.VehicleIds.Count, request.Date.ToString("yyyy-MM-dd"));

                var response = new FleetFuelPositionResponseDTO
                {
                    RequestedDate = request.Date,
                    ReadingType = request.ReadingType,
                    TotalVehiclesRequested = request.VehicleIds.Count
                };

                // Process vehicles in parallel with throttling
                var tasks = request.VehicleIds.Select(vehicleId =>
                    GetVehicleFuelWithThrottlingAsync(vehicleId, request.Date, request.ReadingType, cancellationToken));

                var results = await Task.WhenAll(tasks);

                // Collect results
                foreach (var result in results)
                {
                    if (result.IsSuccess && result.Data != null)
                    {
                        response.VehiclePositions.Add(result.Data);
                    }
                }

                // Calculate summary statistics
                CalculateFleetSummary(response);

                _logger.LogInformation("Fleet fuel positions retrieved: {WithData}/{Total} vehicles have data",
                    response.VehiclesWithData, response.TotalVehiclesRequested);

                return FMSResponse<FleetFuelPositionResponseDTO>.Success(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fleet fuel positions on {Date}", request.Date.ToString("yyyy-MM-dd"));
                return FMSResponse<FleetFuelPositionResponseDTO>.Failed($"Error retrieving fleet fuel data: {ex.Message}");
            }
        }

        /// <inheritdoc />
        public async Task<FMSResponse<VehicleFuelConsumptionDTO>> GetVehicleConsumptionAsync(
            int vehicleId,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogDebug("Calculating consumption for vehicle {VehicleId} from {StartDate} to {EndDate}",
                    vehicleId, startDate.ToString("yyyy-MM-dd"), endDate.ToString("yyyy-MM-dd"));

                // Get opening and closing positions
                var openingTask = GetVehicleFuelAtDateAsync(vehicleId, startDate, "opening", true, cancellationToken);
                var closingTask = GetVehicleFuelAtDateAsync(vehicleId, endDate, "closing", true, cancellationToken);

                await Task.WhenAll(openingTask, closingTask);

                var opening = openingTask.Result;
                var closing = closingTask.Result;

                if (!opening.IsSuccess || !closing.IsSuccess)
                {
                    return FMSResponse<VehicleFuelConsumptionDTO>.Failed("Failed to retrieve opening or closing fuel positions");
                }

                var consumption = new VehicleFuelConsumptionDTO
                {
                    VehicleId = vehicleId,
                    StartDate = startDate,
                    EndDate = endDate,
                    OpeningFuelLevel = opening.Data?.FuelLevel,
                    ClosingFuelLevel = closing.Data?.FuelLevel,
                    OpeningDataQuality = opening.Data?.DataQuality ?? FuelDataQuality.Unavailable,
                    ClosingDataQuality = closing.Data?.DataQuality ?? FuelDataQuality.Unavailable
                };

                // Calculate consumption if both readings are available
                if (consumption.OpeningFuelLevel.HasValue && consumption.ClosingFuelLevel.HasValue)
                {
                    consumption.GrossConsumption = consumption.OpeningFuelLevel.Value - consumption.ClosingFuelLevel.Value;
                }

                return FMSResponse<VehicleFuelConsumptionDTO>.Success(consumption);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating consumption for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleFuelConsumptionDTO>.Failed($"Error calculating consumption: {ex.Message}");
            }
        }

        /// <inheritdoc />
        public async Task<FMSResponse<List<RefuelEventDTO>>> DetectRefuelEventsAsync(
            int vehicleId,
            DateTime date,
            decimal minimumRefuelThreshold = 10.0m,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogDebug("Detecting refuel events for vehicle {VehicleId} on {Date}",
                    vehicleId, date.ToString("yyyy-MM-dd"));

                var deviceMapping = await GetDeviceMappingAsync(vehicleId, cancellationToken);
                if (deviceMapping == null)
                {
                    return FMSResponse<List<RefuelEventDTO>>.Success(new List<RefuelEventDTO>());
                }

                // Get all track points for the day
                var tracks = await FetchDayTracksAsync(deviceMapping.ExternalDeviceId, date, cancellationToken);
                if (tracks == null || !tracks.Any())
                {
                    return FMSResponse<List<RefuelEventDTO>>.Success(new List<RefuelEventDTO>());
                }

                var refuelEvents = new List<RefuelEventDTO>();
                decimal? previousFuelLevel = null;
                DateTime? previousTimestamp = null;

                foreach (var track in tracks.OrderBy(t => t.UTC))
                {
                    var currentFuelLevel = ExtractFuelLevel(track.Variables);
                    if (!currentFuelLevel.HasValue)
                        continue;

                    var currentTimestamp = ParseTimestamp(track.UTC);

                    if (previousFuelLevel.HasValue && currentTimestamp.HasValue)
                    {
                        var fuelIncrease = currentFuelLevel.Value - previousFuelLevel.Value;

                        if (fuelIncrease >= minimumRefuelThreshold)
                        {
                            refuelEvents.Add(new RefuelEventDTO
                            {
                                VehicleId = vehicleId,
                                EventDate = currentTimestamp.Value,
                                FuelLevelBefore = previousFuelLevel.Value,
                                FuelLevelAfter = currentFuelLevel.Value,
                                FuelAdded = fuelIncrease,
                                Latitude = track.Position?.Latitude != null ? (decimal)track.Position.Latitude : null,
                                Longitude = track.Position?.Longitude != null ? (decimal)track.Position.Longitude : null,
                                DetectionConfidence = fuelIncrease > 50 ? "High" : fuelIncrease > 20 ? "Medium" : "Low"
                            });
                        }
                    }

                    previousFuelLevel = currentFuelLevel;
                    previousTimestamp = currentTimestamp;
                }

                _logger.LogInformation("Detected {Count} refuel events for vehicle {VehicleId} on {Date}",
                    refuelEvents.Count, vehicleId, date.ToString("yyyy-MM-dd"));

                return FMSResponse<List<RefuelEventDTO>>.Success(refuelEvents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting refuel events for vehicle {VehicleId}", vehicleId);
                return FMSResponse<List<RefuelEventDTO>>.Failed($"Error detecting refuel events: {ex.Message}");
            }
        }

        /// <inheritdoc />
        public async Task<FMSResponse<bool>> RefreshVehicleDataAsync(
            int vehicleId,
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Refreshing GPS data for vehicle {VehicleId} on {Date}",
                    vehicleId, date.ToString("yyyy-MM-dd"));

                // Delete cached readings for this vehicle and date
                var cachedReadings = await _context.FuelAuditGPSReadings
                    .Where(r => r.VehicleId == vehicleId && r.ReadingDate.Date == date.Date)
                    .ToListAsync(cancellationToken);

                if (cachedReadings.Any())
                {
                    _context.FuelAuditGPSReadings.RemoveRange(cachedReadings);
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogDebug("Removed {Count} cached readings", cachedReadings.Count);
                }

                // Fetch fresh data
                var openingResult = await GetVehicleFuelAtDateAsync(vehicleId, date, "opening", false, cancellationToken);
                var closingResult = await GetVehicleFuelAtDateAsync(vehicleId, date, "closing", false, cancellationToken);

                return FMSResponse<bool>.Success(
                    openingResult.IsSuccess && closingResult.IsSuccess,
                    "Vehicle data refreshed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing data for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Error refreshing data: {ex.Message}");
            }
        }

        /// <inheritdoc />
        public async Task<FMSResponse<bool>> HasFuelSensorAsync(
            int vehicleId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var deviceMapping = await GetDeviceMappingAsync(vehicleId, cancellationToken);
                if (deviceMapping == null)
                {
                    return FMSResponse<bool>.Success(false);
                }

                // Try to get current status and check for fuel variables
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                var statusUrl = $"{baseUrl}/applications/{applicationId}/users/{deviceMapping.ExternalDeviceId}/status";

                using var request = new HttpRequestMessage(HttpMethod.Get, statusUrl);
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    return FMSResponse<bool>.Success(false);
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var status = JsonSerializer.Deserialize<GPSGateUserStatus>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var hasFuelSensor = status?.Variables?.Any(v =>
                    FuelVariableNames.Contains(v.Name?.Trim() ?? "")) == true;

                return FMSResponse<bool>.Success(hasFuelSensor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking fuel sensor for vehicle {VehicleId}", vehicleId);
                return FMSResponse<bool>.Failed($"Error checking fuel sensor: {ex.Message}");
            }
        }

        #region Private Helper Methods

        private async Task<FMSResponse<VehicleFuelPositionDTO>> GetVehicleFuelWithThrottlingAsync(
            int vehicleId,
            DateTime date,
            string readingType,
            CancellationToken cancellationToken)
        {
            await _apiThrottle.WaitAsync(cancellationToken);
            try
            {
                return await GetVehicleFuelAtDateAsync(vehicleId, date, readingType, true, cancellationToken);
            }
            finally
            {
                _apiThrottle.Release();
            }
        }

        private async Task<VehicleFuelPositionDTO?> FetchFuelPositionFromGPSGateAsync(
            int vehicleId,
            string externalDeviceId,
            DateTime date,
            string readingType,
            CancellationToken cancellationToken)
        {
            var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
            var isOpening = readingType.Equals("opening", StringComparison.OrdinalIgnoreCase);

            // Determine time range based on reading type
            string fromTime, untilTime;
            if (isOpening)
            {
                fromTime = "00:00:00";
                untilTime = "06:00:00";
            }
            else
            {
                fromTime = "18:00:00";
                untilTime = "23:59:59";
            }

            // Track whether we found any tracks at all (for distinguishing no data vs no fuel sensor)
            bool foundAnyTracks = false;
            bool foundTracksWithoutFuel = false;

            // Try current date first, then search back up to 7 days for closing (1 day for opening)
            int maxDaysBack = isOpening ? 1 : MaxDaysToSearchBack;

            for (int dayOffset = 0; dayOffset <= maxDaysBack; dayOffset++)
            {
                var searchDate = date.AddDays(-dayOffset);
                var tracks = await FetchTracksAsync(baseUrl, applicationId, authHeader, externalDeviceId, searchDate, fromTime, untilTime, cancellationToken);

                if (tracks != null && tracks.Any())
                {
                    foundAnyTracks = true;

                    // Find track with fuel data (first for opening, last for closing)
                    var trackWithFuel = isOpening
                        ? tracks.OrderBy(t => t.UTC).FirstOrDefault(t => HasFuelData(t))
                        : tracks.OrderByDescending(t => t.UTC).FirstOrDefault(t => HasFuelData(t));

                    if (trackWithFuel != null)
                    {
                        var fuelLevel = ExtractFuelLevel(trackWithFuel.Variables);
                        var timestamp = ParseTimestamp(trackWithFuel.UTC);
                        var ignitionStatus = ExtractIgnitionStatus(trackWithFuel.Variables);

                        return new VehicleFuelPositionDTO
                        {
                            VehicleId = vehicleId,
                            ReadingDate = date,
                            ReadingType = readingType,
                            FuelLevel = fuelLevel,
                            ReadingTimestamp = timestamp ?? searchDate,
                            DataQuality = dayOffset == 0 ? FuelDataQuality.Exact : FuelDataQuality.Interpolated,
                            DataQualityReason = dayOffset == 0 ? "Data from requested date" : $"Data from {dayOffset} day(s) prior",
                            Latitude = trackWithFuel.Position?.Latitude != null ? (decimal)trackWithFuel.Position.Latitude : null,
                            Longitude = trackWithFuel.Position?.Longitude != null ? (decimal)trackWithFuel.Position.Longitude : null,
                            DaysFromRequestedDate = dayOffset,
                            ActualDataDate = searchDate,
                            WasOnline = true,
                            IgnitionStatus = ignitionStatus,
                            GPSDeviceId = externalDeviceId,
                            TrackInfoId = trackWithFuel.TrackInfoId,
                            RawData = JsonSerializer.Serialize(trackWithFuel.Variables)
                        };
                    }
                    else
                    {
                        // Tracks exist but no fuel data - sensor not reporting
                        foundTracksWithoutFuel = true;
                    }
                }
            }

            // No fuel data found - determine why and try fallback strategies
            if (foundTracksWithoutFuel)
            {
                // Tracks exist but no fuel in variables - sensor not reporting
                _logger.LogWarning("Vehicle {VehicleId} has GPS tracks but no fuel sensor data on {Date}",
                    vehicleId, date.ToString("yyyy-MM-dd"));

                return new VehicleFuelPositionDTO
                {
                    VehicleId = vehicleId,
                    ReadingDate = date,
                    ReadingType = readingType,
                    DataQuality = FuelDataQuality.SensorNotReporting,
                    DataQualityReason = "GPS tracks exist but fuel sensor is not reporting data",
                    WasOnline = true,
                    GPSDeviceId = externalDeviceId
                };
            }

            if (!foundAnyTracks)
            {
                // No tracks at all - try finding nearest track point (before for closing, after for opening)
                var nearestTrack = await FindNearestTrackWithFuelAsync(
                    baseUrl, applicationId, authHeader, externalDeviceId, date, isOpening, cancellationToken);

                if (nearestTrack != null)
                {
                    return nearestTrack;
                }

                // Vehicle was offline
                _logger.LogWarning("Vehicle {VehicleId} has no GPS tracks on {Date} - vehicle may be offline",
                    vehicleId, date.ToString("yyyy-MM-dd"));

                return new VehicleFuelPositionDTO
                {
                    VehicleId = vehicleId,
                    ReadingDate = date,
                    ReadingType = readingType,
                    DataQuality = FuelDataQuality.Unavailable,
                    DataQualityReason = "No GPS data available - vehicle may be offline or out of coverage",
                    WasOnline = false,
                    GPSDeviceId = externalDeviceId
                };
            }

            return null;
        }

        /// <summary>
        /// Finds the nearest track point with fuel data when no data exists on the requested date.
        /// For opening: searches forward (after the date)
        /// For closing: searches backward (before the date)
        /// </summary>
        private async Task<VehicleFuelPositionDTO?> FindNearestTrackWithFuelAsync(
            string baseUrl,
            int applicationId,
            System.Net.Http.Headers.AuthenticationHeaderValue authHeader,
            string externalDeviceId,
            DateTime date,
            bool isOpening,
            CancellationToken cancellationToken)
        {
            // Search direction: forward for opening (find first track after), backward for closing (find last track before)
            int searchDirection = isOpening ? 1 : -1;

            for (int dayOffset = 1; dayOffset <= MaxDaysToSearchBack; dayOffset++)
            {
                var searchDate = date.AddDays(dayOffset * searchDirection);

                // For opening, search full day to find first available track
                // For closing, search full day to find last available track
                var tracks = await FetchTracksAsync(baseUrl, applicationId, authHeader, externalDeviceId, searchDate, "00:00:00", "23:59:59", cancellationToken);

                if (tracks != null && tracks.Any())
                {
                    var trackWithFuel = isOpening
                        ? tracks.OrderBy(t => t.UTC).FirstOrDefault(t => HasFuelData(t))
                        : tracks.OrderByDescending(t => t.UTC).FirstOrDefault(t => HasFuelData(t));

                    if (trackWithFuel != null)
                    {
                        var fuelLevel = ExtractFuelLevel(trackWithFuel.Variables);
                        var timestamp = ParseTimestamp(trackWithFuel.UTC);
                        var ignitionStatus = ExtractIgnitionStatus(trackWithFuel.Variables);

                        _logger.LogInformation(
                            "Found nearest fuel data for vehicle on {ActualDate} ({DaysAway} days {Direction} from {RequestedDate})",
                            searchDate.ToString("yyyy-MM-dd"), dayOffset, isOpening ? "after" : "before", date.ToString("yyyy-MM-dd"));

                        return new VehicleFuelPositionDTO
                        {
                            VehicleId = 0, // Will be set by caller
                            ReadingDate = date,
                            ReadingType = isOpening ? "opening" : "closing",
                            FuelLevel = fuelLevel,
                            ReadingTimestamp = timestamp ?? searchDate,
                            DataQuality = FuelDataQuality.Interpolated,
                            DataQualityReason = $"Nearest data found {dayOffset} day(s) {(isOpening ? "after" : "before")} requested date",
                            Latitude = trackWithFuel.Position?.Latitude != null ? (decimal)trackWithFuel.Position.Latitude : null,
                            Longitude = trackWithFuel.Position?.Longitude != null ? (decimal)trackWithFuel.Position.Longitude : null,
                            DaysFromRequestedDate = dayOffset,
                            ActualDataDate = searchDate,
                            WasOnline = true,
                            IgnitionStatus = ignitionStatus,
                            GPSDeviceId = externalDeviceId,
                            TrackInfoId = trackWithFuel.TrackInfoId,
                            RawData = JsonSerializer.Serialize(trackWithFuel.Variables)
                        };
                    }
                }
            }

            return null;
        }

        /// <summary>
        /// Extracts ignition status from GPS variables
        /// </summary>
        private bool? ExtractIgnitionStatus(List<GPSGateVariable>? variables)
        {
            if (variables == null || !variables.Any())
                return null;

            var ignitionVar = variables.FirstOrDefault(v =>
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

        private async Task<List<GPSGateTrack>?> FetchTracksAsync(
            string baseUrl,
            int applicationId,
            System.Net.Http.Headers.AuthenticationHeaderValue authHeader,
            string externalDeviceId,
            DateTime date,
            string fromTime,
            string untilTime,
            CancellationToken cancellationToken)
        {
            try
            {
                var tracksUrl = $"{baseUrl}/applications/{applicationId}/users/{externalDeviceId}/tracks?Date={date:yyyy-MM-dd}&From={fromTime}&Until={untilTime}";

                using var request = new HttpRequestMessage(HttpMethod.Get, tracksUrl);
                request.Headers.Authorization = authHeader;

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to fetch tracks for device {DeviceId}. Status: {StatusCode}",
                        externalDeviceId, response.StatusCode);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                return JsonSerializer.Deserialize<List<GPSGateTrack>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tracks for device {DeviceId}", externalDeviceId);
                return null;
            }
        }

        private async Task<List<GPSGateTrack>?> FetchDayTracksAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken)
        {
            var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
            return await FetchTracksAsync(baseUrl, applicationId, authHeader, externalDeviceId, date, "00:00:00", "23:59:59", cancellationToken);
        }

        private bool HasFuelData(GPSGateTrack track)
        {
            return track.Variables?.Any(v =>
                FuelVariableNames.Contains(v.Name?.Trim() ?? "") &&
                decimal.TryParse(v.Value, out _)) == true;
        }

        private decimal? ExtractFuelLevel(List<GPSGateVariable>? variables)
        {
            if (variables == null || !variables.Any())
                return null;

            // Prefer "Fuel level" over "Rawfuel"
            var fuelVar = variables.FirstOrDefault(v =>
                v.Name?.Trim().Equals("Fuel level", StringComparison.OrdinalIgnoreCase) == true);

            fuelVar ??= variables.FirstOrDefault(v =>
                FuelVariableNames.Contains(v.Name?.Trim() ?? ""));

            if (fuelVar != null && decimal.TryParse(fuelVar.Value, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var fuelLevel))
            {
                return fuelLevel;
            }

            return null;
        }

        private DateTime? ParseTimestamp(string? utcString)
        {
            if (string.IsNullOrEmpty(utcString))
                return null;

            return DateTime.TryParse(utcString, out var result) ? result : null;
        }

        private async Task<DeviceMappingInfo?> GetDeviceMappingAsync(int vehicleId, CancellationToken cancellationToken)
        {
            // Try new provider mapping first
            var providerMapping = await _context.VehicleProviderMappings
                .Include(m => m.ProviderConfiguration)
                .Where(m => m.VehicleId == vehicleId
                    && m.IsActive
                    && m.ProviderConfiguration.Name == "GPSGate"
                    && m.ProviderConfiguration.IsEnabled)
                .FirstOrDefaultAsync(cancellationToken);

            if (providerMapping != null)
            {
                return new DeviceMappingInfo
                {
                    VehicleId = vehicleId,
                    ExternalDeviceId = providerMapping.ExternalDeviceId
                };
            }

            // Fallback to legacy DeviceId
            var vehicle = await _context.Vehicles
                .Where(v => v.VehicleId == vehicleId && v.DeviceId.HasValue)
                .FirstOrDefaultAsync(cancellationToken);

            if (vehicle?.DeviceId != null)
            {
                _logger.LogWarning("Vehicle {VehicleId} using legacy DeviceId. Please migrate to vehicle_provider_mappings.", vehicleId);
                return new DeviceMappingInfo
                {
                    VehicleId = vehicleId,
                    ExternalDeviceId = vehicle.DeviceId.Value.ToString()
                };
            }

            return null;
        }

        private async Task<VehicleFuelPositionDTO?> GetCachedReadingAsync(
            int vehicleId,
            DateTime date,
            string readingType,
            CancellationToken cancellationToken)
        {
            var cached = await _context.FuelAuditGPSReadings
                .AsNoTracking()
                .Where(r => r.VehicleId == vehicleId
                    && r.ReadingDate.Date == date.Date
                    && r.ReadingType == readingType)
                .FirstOrDefaultAsync(cancellationToken);

            if (cached == null)
                return null;

            return new VehicleFuelPositionDTO
            {
                VehicleId = cached.VehicleId,
                ReadingDate = cached.ReadingDate,
                ReadingType = cached.ReadingType,
                FuelLevel = cached.FuelLevel,
                ReadingTimestamp = cached.ReadingTimestamp,
                DataQuality = Enum.TryParse<FuelDataQuality>(cached.DataQuality, out var quality) ? quality : FuelDataQuality.Unavailable,
                DataQualityReason = cached.DataQualityReason,
                Latitude = cached.Latitude,
                Longitude = cached.Longitude,
                DaysFromRequestedDate = cached.DaysFromRequestedDate ?? 0,
                ActualDataDate = cached.ActualDataDate,
                WasOnline = cached.WasOnline,
                IgnitionStatus = cached.IgnitionStatus,
                GPSDeviceId = cached.GPSDeviceId,
                TrackInfoId = cached.TrackInfoId,
                RawData = cached.RawData
            };
        }

        private async Task CacheReadingAsync(VehicleFuelPositionDTO position, CancellationToken cancellationToken)
        {
            try
            {
                var existing = await _context.FuelAuditGPSReadings
                    .FirstOrDefaultAsync(r => r.VehicleId == position.VehicleId
                        && r.ReadingDate.Date == position.ReadingDate.Date
                        && r.ReadingType == position.ReadingType,
                        cancellationToken);

                if (existing != null)
                {
                    existing.FuelLevel = position.FuelLevel;
                    existing.ReadingTimestamp = position.ReadingTimestamp;
                    existing.DataQuality = position.DataQuality.ToString();
                    existing.DataQualityReason = position.DataQualityReason;
                    existing.Latitude = position.Latitude;
                    existing.Longitude = position.Longitude;
                    existing.DaysFromRequestedDate = position.DaysFromRequestedDate;
                    existing.ActualDataDate = position.ActualDataDate;
                    existing.WasOnline = position.WasOnline;
                    existing.IgnitionStatus = position.IgnitionStatus;
                    existing.GPSDeviceId = position.GPSDeviceId;
                    existing.TrackInfoId = position.TrackInfoId;
                    existing.RawData = position.RawData;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    var entity = new FuelAuditGPSReading
                    {
                        VehicleId = position.VehicleId,
                        ReadingDate = position.ReadingDate,
                        ReadingType = position.ReadingType,
                        FuelLevel = position.FuelLevel,
                        ReadingTimestamp = position.ReadingTimestamp,
                        DataQuality = position.DataQuality.ToString(),
                        DataQualityReason = position.DataQualityReason,
                        Latitude = position.Latitude,
                        Longitude = position.Longitude,
                        DaysFromRequestedDate = position.DaysFromRequestedDate,
                        ActualDataDate = position.ActualDataDate,
                        WasOnline = position.WasOnline,
                        IgnitionStatus = position.IgnitionStatus,
                        GPSDeviceId = position.GPSDeviceId,
                        TrackInfoId = position.TrackInfoId,
                        RawData = position.RawData,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.FuelAuditGPSReadings.Add(entity);
                }

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cache fuel reading for vehicle {VehicleId}", position.VehicleId);
                // Don't throw - caching is non-critical
            }
        }

        private VehicleFuelPositionDTO CreateNoSensorResult(int vehicleId, DateTime date, string readingType)
        {
            return new VehicleFuelPositionDTO
            {
                VehicleId = vehicleId,
                ReadingDate = date,
                ReadingType = readingType,
                DataQuality = FuelDataQuality.NoSensor,
                DataQualityReason = "Vehicle has no GPS device mapping configured",
                WasOnline = false,
                Latitude = null,
                Longitude = null
            };
        }

        private VehicleFuelPositionDTO CreateUnavailableResult(int vehicleId, DateTime date, string readingType)
        {
            return new VehicleFuelPositionDTO
            {
                VehicleId = vehicleId,
                ReadingDate = date,
                ReadingType = readingType,
                DataQuality = FuelDataQuality.Unavailable,
                DataQualityReason = "No fuel data available from GPS provider",
                WasOnline = false,
                Latitude = null,
                Longitude = null
            };
        }

        private void CalculateFleetSummary(FleetFuelPositionResponseDTO response)
        {
            var withData = response.VehiclePositions.Where(p =>
                p.DataQuality == FuelDataQuality.Exact ||
                p.DataQuality == FuelDataQuality.Interpolated ||
                p.DataQuality == FuelDataQuality.ManualEntry ||
                p.DataQuality == FuelDataQuality.EstimatedFromRefill).ToList();

            response.VehiclesWithData = withData.Count;
            response.VehiclesWithoutData = response.TotalVehiclesRequested - withData.Count;

            response.TotalFleetFuel = withData.Where(p => p.FuelLevel.HasValue).Sum(p => p.FuelLevel!.Value);

            response.DataQualitySummary = new DataQualitySummaryDTO
            {
                ExactReadings = response.VehiclePositions.Count(p => p.DataQuality == FuelDataQuality.Exact),
                InterpolatedReadings = response.VehiclePositions.Count(p => p.DataQuality == FuelDataQuality.Interpolated),
                UnavailableReadings = response.VehiclePositions.Count(p => p.DataQuality == FuelDataQuality.Unavailable),
                NoSensorVehicles = response.VehiclePositions.Count(p => p.DataQuality == FuelDataQuality.NoSensor),
                SensorNotReportingVehicles = response.VehiclePositions.Count(p => p.DataQuality == FuelDataQuality.SensorNotReporting),
                ManualEntryReadings = response.VehiclePositions.Count(p => p.DataQuality == FuelDataQuality.ManualEntry),
                EstimatedFromRefillReadings = response.VehiclePositions.Count(p => p.DataQuality == FuelDataQuality.EstimatedFromRefill)
            };
        }

        /// <summary>
        /// Attempts to estimate fuel level from manual refill records.
        /// Uses the "fill-up to fill-up" method when meter readings are available.
        /// </summary>
        private async Task<VehicleFuelPositionDTO?> TryGetFuelFromManualRefillAsync(
            int vehicleId,
            DateTime date,
            string readingType,
            CancellationToken cancellationToken)
        {
            try
            {
                var isOpening = readingType.Equals("opening", StringComparison.OrdinalIgnoreCase);

                // Get vehicle info for tank capacity and consumption rate
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .Select(v => new
                    {
                        v.VehicleId,
                        v.HyoungNo,
                        v.FuelTankCapacity, // Tank capacity in liters
                        v.AverageKmL // true = km/L (distance), false = L/hr (hours)
                    })
                    .FirstOrDefaultAsync(cancellationToken);

                if (vehicle == null)
                    return null;

                // Find refills around the requested date
                // For opening: Get the last refill BEFORE or ON the date
                // For closing: Get the last refill ON or BEFORE the date, and next refill after
                var refillsNearDate = await _context.FuelRefills
                    .Where(r => r.VehicleId == vehicleId
                        && !r.IsDeleted
                        && r.Date.HasValue)
                    .OrderByDescending(r => r.Date)
                    .Take(10) // Get recent refills for context
                    .Select(r => new
                    {
                        r.Id,
                        r.Date,
                        r.ManualFuelrefillAmount,
                        r.PreviousMeterReading,
                        r.CurrentMeterReading,
                        r.SiteId
                    })
                    .ToListAsync(cancellationToken);

                if (!refillsNearDate.Any())
                {
                    _logger.LogDebug("No manual refill records found for vehicle {VehicleId}", vehicleId);
                    return null;
                }

                // Find the most relevant refill
                var lastRefillBeforeDate = refillsNearDate
                    .Where(r => r.Date <= date)
                    .OrderByDescending(r => r.Date)
                    .FirstOrDefault();

                var firstRefillAfterDate = refillsNearDate
                    .Where(r => r.Date > date)
                    .OrderBy(r => r.Date)
                    .FirstOrDefault();

                if (lastRefillBeforeDate == null)
                {
                    // No refill before this date - can't estimate
                    _logger.LogDebug("No refill record before {Date} for vehicle {VehicleId}", date, vehicleId);
                    return null;
                }

                // Calculate estimated fuel level
                // IMPORTANT: We can only provide CONTEXT, not actual fuel level
                // because FuelRefill records fuel ADDED, not current tank level.
                // Only vehicles with "full tank" policy (pickups) can have level estimated.
                decimal? estimatedFuelLevel = null;
                string qualityReason;
                var dataQuality = FuelDataQuality.EstimatedFromRefill;

                var daysSinceRefill = (date - lastRefillBeforeDate.Date!.Value).Days;
                var refillAmount = lastRefillBeforeDate.ManualFuelrefillAmount ?? 0;

                // Use tank capacity directly from vehicle entity
                decimal? tankCapacity = vehicle.FuelTankCapacity;

                if (daysSinceRefill == 0)
                {
                    // Refill was on the same day
                    if (isOpening)
                    {
                        // Opening stock before refill - we don't know the level before refill
                        qualityReason = $"Refill of {refillAmount}L occurred on this date. Opening level before refill is unknown.";
                    }
                    else
                    {
                        // Closing stock after refill
                        // We can only estimate if tank capacity is known and refill might be full tank
                        if (tankCapacity.HasValue && refillAmount >= tankCapacity.Value * 0.8m)
                        {
                            // Likely a full tank (80%+ of capacity)
                            estimatedFuelLevel = tankCapacity.Value;
                            qualityReason = $"Refill of {refillAmount}L on this date (tank capacity: {tankCapacity}L). Likely full tank.";
                            dataQuality = FuelDataQuality.ManualEntry;
                        }
                        else
                        {
                            // Partial refill - can't determine actual level
                            qualityReason = $"Refill of {refillAmount}L on this date. Partial refill - cannot determine tank level.";
                            if (tankCapacity.HasValue)
                            {
                                qualityReason += $" Tank capacity: {tankCapacity}L.";
                            }
                        }
                    }
                }
                else if (lastRefillBeforeDate.CurrentMeterReading.HasValue && lastRefillBeforeDate.PreviousMeterReading.HasValue)
                {
                    // We have meter readings - can calculate consumption rate
                    var meterDifference = lastRefillBeforeDate.CurrentMeterReading.Value - lastRefillBeforeDate.PreviousMeterReading.Value;

                    if (meterDifference > 0 && refillAmount > 0)
                    {
                        // Calculate consumption rate
                        decimal consumptionRate = refillAmount / meterDifference;
                        string consumptionUnit = vehicle.AverageKmL ? "L/km" : "L/hr";

                        // Provide context but not estimated level (we don't know starting level)
                        qualityReason = $"Last refill: {refillAmount}L on {lastRefillBeforeDate.Date:yyyy-MM-dd} ({daysSinceRefill} days ago). " +
                            $"Consumption rate: {consumptionRate:F3} {consumptionUnit}. " +
                            $"Cannot estimate current level without knowing tank level at refill time.";
                    }
                    else
                    {
                        qualityReason = $"Last refill: {refillAmount}L on {lastRefillBeforeDate.Date:yyyy-MM-dd} ({daysSinceRefill} days ago). " +
                            $"Invalid meter readings. Cannot estimate current level.";
                    }
                }
                else
                {
                    // No meter readings - provide context only
                    qualityReason = $"Last refill: {refillAmount}L on {lastRefillBeforeDate.Date:yyyy-MM-dd} ({daysSinceRefill} days ago). " +
                        $"No meter data available. Cannot estimate current level.";
                }

                // If we have a refill after the date, provide additional context
                if (firstRefillAfterDate != null)
                {
                    var daysUntilNextRefill = (firstRefillAfterDate.Date!.Value - date).Days;
                    qualityReason += $" Next refill: {firstRefillAfterDate.ManualFuelrefillAmount}L in {daysUntilNextRefill} days.";
                }

                return new VehicleFuelPositionDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.HyoungNo ?? "",
                    ReadingDate = date,
                    ReadingType = readingType,
                    FuelLevel = estimatedFuelLevel,
                    FuelLevelUnit = "Liters",
                    ReadingTimestamp = lastRefillBeforeDate.Date,
                    DataQuality = dataQuality,
                    DataQualityReason = qualityReason,
                    DaysFromRequestedDate = daysSinceRefill,
                    ActualDataDate = lastRefillBeforeDate.Date,
                    WasOnline = false, // Not GPS data
                    RawData = JsonSerializer.Serialize(new
                    {
                        Source = "ManualRefill",
                        LastRefillId = lastRefillBeforeDate.Id,
                        LastRefillDate = lastRefillBeforeDate.Date,
                        LastRefillAmount = lastRefillBeforeDate.ManualFuelrefillAmount,
                        PreviousMeter = lastRefillBeforeDate.PreviousMeterReading,
                        CurrentMeter = lastRefillBeforeDate.CurrentMeterReading,
                        TankCapacity = vehicle.FuelTankCapacity,
                        IsKmL = vehicle.AverageKmL
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error getting fuel from manual refill for vehicle {VehicleId}", vehicleId);
                return null;
            }
        }

        private class DeviceMappingInfo
        {
            public int VehicleId { get; set; }
            public string ExternalDeviceId { get; set; } = string.Empty;
        }

        #endregion
    }
}
