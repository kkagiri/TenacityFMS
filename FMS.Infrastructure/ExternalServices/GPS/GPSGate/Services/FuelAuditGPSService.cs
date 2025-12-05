using System;
using System.Collections.Generic;
using System.IO;
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
    /// Fetches GPS-based fuel data for fuel audits with caching and sequential DB operations.
    /// </summary>
    public class FuelAuditGPSService : IFuelAuditGPSService
    {
        private readonly GpsdataContext _context;
        private readonly HttpClient _httpClient;
        private readonly IGPSGateConfigurationProvider _configurationProvider;
        private readonly ILogger<FuelAuditGPSService> _logger;

        // Throttling for parallel API calls (not DB operations)
        private const int MaxConcurrentApiCalls = 5;
        private const int MaxDaysToSearchBack = 30;  // Extended from 7 to 30 days - search until we find data
        private static readonly SemaphoreSlim _apiThrottle = new(MaxConcurrentApiCalls);

        // Semaphore to ensure sequential DB operations
        private static readonly SemaphoreSlim _dbSemaphore = new(1, 1);

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
                _logger.LogInformation("Getting fuel position for vehicle {VehicleId} on {Date} ({ReadingType})",
                    vehicleId, date.ToString("yyyy-MM-dd"), readingType);

                // Check cache first if enabled
                if (useCache)
                {
                    var cachedReading = await GetCachedReadingAsync(vehicleId, date, readingType, cancellationToken);
                    if (cachedReading != null)
                    {
                        _logger.LogInformation("Found cached reading for vehicle {VehicleId}", vehicleId);
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

                // Process vehicles sequentially to avoid DbContext threading issues
                // Each vehicle may do multiple DB operations (cache check, device mapping, cache write)
                foreach (var vehicleId in request.VehicleIds)
                {
                    try
                    {
                        var result = await GetVehicleFuelAtDateAsync(vehicleId, request.Date, request.ReadingType, true, cancellationToken);
                        if (result.IsSuccess && result.Data != null)
                        {
                            response.VehiclePositions.Add(result.Data);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to get fuel position for vehicle {VehicleId}", vehicleId);
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
                _logger.LogInformation("Calculating consumption for vehicle {VehicleId} from {StartDate} to {EndDate}",
                    vehicleId, startDate.ToString("yyyy-MM-dd"), endDate.ToString("yyyy-MM-dd"));

                // Get opening and closing positions sequentially to avoid DbContext threading issues
                var opening = await GetVehicleFuelAtDateAsync(vehicleId, startDate, "opening", true, cancellationToken);
                var closing = await GetVehicleFuelAtDateAsync(vehicleId, endDate, "closing", true, cancellationToken);

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
                _logger.LogInformation("Detecting refuel events for vehicle {VehicleId} on {Date}",
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

                // Use semaphore to ensure thread-safe database operations
                await _dbSemaphore.WaitAsync(cancellationToken);
                try
                {
                    // Delete cached readings for this vehicle and date
                    var cachedReadings = await _context.FuelAuditGPSReadings
                        .Where(r => r.VehicleId == vehicleId && r.ReadingDate.Date == date.Date)
                        .ToListAsync(cancellationToken);

                    if (cachedReadings.Any())
                    {
                        _context.FuelAuditGPSReadings.RemoveRange(cachedReadings);
                        await _context.SaveChangesAsync(cancellationToken);
                        _logger.LogInformation("Removed {Count} cached readings", cachedReadings.Count);
                    }
                }
                finally
                {
                    _dbSemaphore.Release();
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

            // Track whether we found any tracks at all (for distinguishing no data vs no fuel sensor)
            bool foundAnyTracks = false;
            bool foundTracksWithoutFuel = false;

            // STRATEGY:
            // 1. First try preferred time window on the exact date (morning for opening, evening for closing)
            // 2. If not found, try full day on the exact date
            // 3. Search backwards day by day with full day search
            //
            // For Opening: We want the EARLIEST reading of the day (start of period)
            // For Closing: We want the LATEST reading of the day (end of period)

            int maxDaysBack = MaxDaysToSearchBack;

            for (int dayOffset = 0; dayOffset <= maxDaysBack; dayOffset++)
            {
                var searchDate = date.AddDays(-dayOffset);

                // On the exact requested date, try preferred time window first
                if (dayOffset == 0)
                {
                    string preferredFromTime, preferredUntilTime;
                    if (isOpening)
                    {
                        // For opening, prefer early morning data
                        preferredFromTime = "00:00:00";
                        preferredUntilTime = "08:00:00";
                    }
                    else
                    {
                        // For closing, prefer late evening data
                        preferredFromTime = "16:00:00";
                        preferredUntilTime = "23:59:59";
                    }

                    var preferredTracks = await FetchTracksAsync(baseUrl, applicationId, authHeader, externalDeviceId, searchDate, preferredFromTime, preferredUntilTime, cancellationToken);

                    if (preferredTracks != null && preferredTracks.Any())
                    {
                        foundAnyTracks = true;
                        var trackWithFuel = isOpening
                            ? preferredTracks.OrderBy(t => t.UTC).FirstOrDefault(t => HasFuelData(t))
                            : preferredTracks.OrderByDescending(t => t.UTC).FirstOrDefault(t => HasFuelData(t));

                        if (trackWithFuel != null)
                        {
                            return CreateFuelPositionFromTrack(vehicleId, externalDeviceId, date, readingType, trackWithFuel, 0, searchDate);
                        }
                        else
                        {
                            foundTracksWithoutFuel = true;
                        }
                    }
                }

                // Try full day search
                var tracks = await FetchTracksAsync(baseUrl, applicationId, authHeader, externalDeviceId, searchDate, "00:00:00", "23:59:59", cancellationToken);

                if (tracks != null && tracks.Any())
                {
                    foundAnyTracks = true;

                    // Find track with fuel data (first for opening, last for closing)
                    var trackWithFuel = isOpening
                        ? tracks.OrderBy(t => t.UTC).FirstOrDefault(t => HasFuelData(t))
                        : tracks.OrderByDescending(t => t.UTC).FirstOrDefault(t => HasFuelData(t));

                    if (trackWithFuel != null)
                    {
                        return CreateFuelPositionFromTrack(vehicleId, externalDeviceId, date, readingType, trackWithFuel, dayOffset, searchDate);
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
        /// Creates a VehicleFuelPositionDTO from a GPS track
        /// </summary>
        private VehicleFuelPositionDTO CreateFuelPositionFromTrack(
            int vehicleId,
            string externalDeviceId,
            DateTime requestedDate,
            string readingType,
            GPSGateTrack track,
            int dayOffset,
            DateTime actualDataDate)
        {
            var fuelLevel = ExtractFuelLevel(track.Variables);
            var timestamp = ParseTimestamp(track.UTC);
            var ignitionStatus = ExtractIgnitionStatus(track.Variables);

            return new VehicleFuelPositionDTO
            {
                VehicleId = vehicleId,
                ReadingDate = requestedDate,
                ReadingType = readingType,
                FuelLevel = fuelLevel,
                ReadingTimestamp = timestamp ?? actualDataDate,
                DataQuality = dayOffset == 0 ? FuelDataQuality.Exact : FuelDataQuality.Interpolated,
                DataQualityReason = dayOffset == 0 ? "Data from requested date" : $"Data from {dayOffset} day(s) prior",
                Latitude = track.Position?.Latitude != null ? (decimal)track.Position.Latitude : null,
                Longitude = track.Position?.Longitude != null ? (decimal)track.Position.Longitude : null,
                DaysFromRequestedDate = dayOffset,
                ActualDataDate = actualDataDate,
                WasOnline = true,
                IgnitionStatus = ignitionStatus,
                GPSDeviceId = externalDeviceId,
                TrackInfoId = track.TrackInfoId,
                RawData = JsonSerializer.Serialize(track.Variables)
            };
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
            // Don't proceed if already cancelled
            if (cancellationToken.IsCancellationRequested)
            {
                _logger.LogDebug("Skipping fetch for device {DeviceId} - operation already cancelled", externalDeviceId);
                return null;
            }

            try
            {
                var tracksUrl = $"{baseUrl}/applications/{applicationId}/users/{externalDeviceId}/tracks?Date={date:yyyy-MM-dd}&From={fromTime}&Until={untilTime}";

                using var request = new HttpRequestMessage(HttpMethod.Get, tracksUrl);
                request.Headers.Authorization = authHeader;

                // Use a separate timeout that doesn't affect the main cancellation token
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(60));

                var response = await _httpClient.SendAsync(request, timeoutCts.Token);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to fetch tracks for device {DeviceId}. Status: {StatusCode}",
                        externalDeviceId, response.StatusCode);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync(timeoutCts.Token);


                return JsonSerializer.Deserialize<List<GPSGateTrack>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error fetching tracks for device {DeviceId}", externalDeviceId);
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
            // Use semaphore to ensure thread-safe database operations
            // Don't pass cancellationToken to semaphore/DB - we want DB operations to complete
            await _dbSemaphore.WaitAsync();
            try
            {
                // Try new provider mapping first
                var providerMapping = await _context.VehicleProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .Where(m => m.VehicleId == vehicleId
                        && m.IsActive
                        && m.ProviderConfiguration.Name == "GPSGate"
                        && m.ProviderConfiguration.IsEnabled)
                    .FirstOrDefaultAsync();

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
                    .FirstOrDefaultAsync();

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
            finally
            {
                _dbSemaphore.Release();
            }
        }

        private async Task<VehicleFuelPositionDTO?> GetCachedReadingAsync(
            int vehicleId,
            DateTime date,
            string readingType,
            CancellationToken cancellationToken)
        {
            // Use semaphore to ensure thread-safe database operations
            // Don't pass cancellationToken to semaphore/DB - we want DB operations to complete
            await _dbSemaphore.WaitAsync();
            try
            {
                var cached = await _context.FuelAuditGPSReadings
                    .AsNoTracking()
                    .Where(r => r.VehicleId == vehicleId
                        && r.ReadingDate.Date == date.Date
                        && r.ReadingType == readingType)
                    .FirstOrDefaultAsync();

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
            finally
            {
                _dbSemaphore.Release();
            }
        }

        private async Task CacheReadingAsync(VehicleFuelPositionDTO position, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Attempting to cache reading for VehicleId={VehicleId}, Date={Date}, Type={Type}",
                    position.VehicleId, position.ReadingDate.ToString("yyyy-MM-dd"), position.ReadingType);

                // Use semaphore to ensure thread-safe database operations
                // Don't pass cancellationToken to semaphore/DB - we want DB operations to complete
                await _dbSemaphore.WaitAsync();
                try
                {
                    // Validate that vehicle exists before caching
                    var vehicleExists = await _context.Vehicles
                        .AnyAsync(v => v.VehicleId == position.VehicleId);

                    if (!vehicleExists)
                    {
                        _logger.LogWarning("Cannot cache GPS reading - vehicle {VehicleId} does not exist in database. " +
                            "Position details: VehicleName={Name}, Date={Date}",
                            position.VehicleId, position.VehicleName, position.ReadingDate.ToString("yyyy-MM-dd"));
                        return;
                    }

                    _logger.LogInformation("Vehicle {VehicleId} exists, proceeding with cache", position.VehicleId);

                    var existing = await _context.FuelAuditGPSReadings
                        .FirstOrDefaultAsync(r => r.VehicleId == position.VehicleId
                            && r.ReadingDate.Date == position.ReadingDate.Date
                            && r.ReadingType == position.ReadingType);

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

                    await _context.SaveChangesAsync();
                }
                finally
                {
                    _dbSemaphore.Release();
                }
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogWarning(dbEx, "Database error caching fuel reading for vehicle {VehicleId} on {Date} ({Type}). Inner: {Inner}",
                    position.VehicleId, position.ReadingDate.ToString("yyyy-MM-dd"), position.ReadingType,
                    dbEx.InnerException?.Message ?? "none");
                // Don't throw - caching is non-critical
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
                // Use semaphore to ensure thread-safe database operations
                // Don't pass cancellationToken to semaphore/DB - we want DB operations to complete
                await _dbSemaphore.WaitAsync();
                object? vehicle;
                List<dynamic> refillsNearDate;

                try
                {
                    var isOpeningCheck = readingType.Equals("opening", StringComparison.OrdinalIgnoreCase);

                    // Get vehicle info for tank capacity and consumption rate
                    vehicle = await _context.Vehicles
                        .Where(v => v.VehicleId == vehicleId)
                        .Select(v => new
                        {
                            v.VehicleId,
                            v.HyoungNo,
                            v.FuelTankCapacity, // Tank capacity in liters
                            v.AverageKmL // true = km/L (distance), false = L/hr (hours)
                        })
                        .FirstOrDefaultAsync();

                    if (vehicle == null)
                        return null;

                    // Find refills around the requested date
                    // For opening: Get the last refill BEFORE or ON the date
                    // For closing: Get the last refill ON or BEFORE the date, and next refill after
                    refillsNearDate = await _context.FuelRefills
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
                        } as dynamic)
                        .ToListAsync();
                }
                finally
                {
                    _dbSemaphore.Release();
                }

                // Cast vehicle to dynamic to access properties
                dynamic vehicleData = vehicle;

                if (!refillsNearDate.Any())
                {
                    _logger.LogInformation("No manual refill records found for vehicle {VehicleId}", vehicleId);
                    return null;
                }

                var isOpening = readingType.Equals("opening", StringComparison.OrdinalIgnoreCase);

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
                    _logger.LogInformation("No refill record before {Date} for vehicle {VehicleId}", date, vehicleId);
                    return null;
                }

                // Calculate estimated fuel level
                // IMPORTANT: We can only provide CONTEXT, not actual fuel level
                // because FuelRefill records fuel ADDED, not current tank level.
                // Only vehicles with "full tank" policy (pickups) can have level estimated.
                decimal? estimatedFuelLevel = null;
                string qualityReason;
                var dataQuality = FuelDataQuality.EstimatedFromRefill;

                var daysSinceRefill = (date - (DateTime)lastRefillBeforeDate.Date).Days;
                var refillAmount = (decimal)(lastRefillBeforeDate.ManualFuelrefillAmount ?? 0);

                // Use tank capacity directly from vehicle entity
                decimal? tankCapacity = vehicleData.FuelTankCapacity;

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
                else if (lastRefillBeforeDate.CurrentMeterReading != null && lastRefillBeforeDate.PreviousMeterReading != null)
                {
                    // We have meter readings - can calculate consumption rate
                    var meterDifference = (decimal)lastRefillBeforeDate.CurrentMeterReading - (decimal)lastRefillBeforeDate.PreviousMeterReading;

                    if (meterDifference > 0 && refillAmount > 0)
                    {
                        // Calculate consumption rate
                        decimal consumptionRate = refillAmount / meterDifference;
                        bool isKmL = vehicleData.AverageKmL ?? false;
                        string consumptionUnit = isKmL ? "L/km" : "L/hr";

                        // Provide context but not estimated level (we don't know starting level)
                        qualityReason = $"Last refill: {refillAmount}L on {((DateTime)lastRefillBeforeDate.Date):yyyy-MM-dd} ({daysSinceRefill} days ago). " +
                            $"Consumption rate: {consumptionRate:F3} {consumptionUnit}. " +
                            $"Cannot estimate current level without knowing tank level at refill time.";
                    }
                    else
                    {
                        qualityReason = $"Last refill: {refillAmount}L on {((DateTime)lastRefillBeforeDate.Date):yyyy-MM-dd} ({daysSinceRefill} days ago). " +
                            $"Invalid meter readings. Cannot estimate current level.";
                    }
                }
                else
                {
                    // No meter readings - provide context only
                    qualityReason = $"Last refill: {refillAmount}L on {((DateTime)lastRefillBeforeDate.Date):yyyy-MM-dd} ({daysSinceRefill} days ago). " +
                        $"No meter data available. Cannot estimate current level.";
                }

                // If we have a refill after the date, provide additional context
                if (firstRefillAfterDate != null)
                {
                    var daysUntilNextRefill = ((DateTime)firstRefillAfterDate.Date - date).Days;
                    qualityReason += $" Next refill: {firstRefillAfterDate.ManualFuelrefillAmount}L in {daysUntilNextRefill} days.";
                }

                // IMPORTANT: When returning from manual refill fallback:
                // - ActualDataDate should be the REQUESTED date (the audit date we need data for)
                // - DaysFromRequestedDate should be 0 since we're providing context for the requested date
                // - Only use FuelLevel if we can actually estimate it (e.g., full tank scenario)
                // - ReadingTimestamp should be set to end of day for closing, start of day for opening
                var isOpeningReading = readingType.Equals("opening", StringComparison.OrdinalIgnoreCase);
                var readingTimestamp = isOpeningReading
                    ? date.Date // Start of day for opening
                    : date.Date.AddHours(23).AddMinutes(59).AddSeconds(59); // End of day for closing

                return new VehicleFuelPositionDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = (string)(vehicleData.HyoungNo ?? ""),
                    ReadingDate = date,
                    ReadingType = readingType,
                    FuelLevel = estimatedFuelLevel,
                    FuelLevelUnit = "Liters",
                    ReadingTimestamp = readingTimestamp,
                    DataQuality = dataQuality,
                    DataQualityReason = qualityReason,
                    DaysFromRequestedDate = 0, // We're providing context for the requested date
                    ActualDataDate = date, // The date we need data for, not the refill date
                    WasOnline = false, // Not GPS data
                    RawData = JsonSerializer.Serialize(new
                    {
                        Source = "ManualRefill",
                        LastRefillId = lastRefillBeforeDate.Id,
                        LastRefillDate = lastRefillBeforeDate.Date,
                        LastRefillAmount = lastRefillBeforeDate.ManualFuelrefillAmount,
                        PreviousMeter = lastRefillBeforeDate.PreviousMeterReading,
                        CurrentMeter = lastRefillBeforeDate.CurrentMeterReading,
                        TankCapacity = vehicleData.FuelTankCapacity,
                        IsKmL = vehicleData.AverageKmL
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
