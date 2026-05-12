using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities.Devices;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Implementation of GPSGate trackinfos REST API service.
    /// Fetches GPS summary data from GPSGate REST API endpoint: GET /applications/{appId}/users/{deviceId}/trackinfos
    /// </summary>
    public class GPSGateTrackInfoService : IGPSGateTrackInfoService
    {
        private readonly IDbContextFactory<GpsdataContext> _contextFactory;
        private readonly HttpClient _httpClient;
        private readonly IGPSGateConfigurationProvider _configurationProvider;
        private readonly ILogger<GPSGateTrackInfoService> _logger;

        public GPSGateTrackInfoService(
            IDbContextFactory<GpsdataContext> contextFactory,
            HttpClient httpClient,
            IGPSGateConfigurationProvider configurationProvider,
            ILogger<GPSGateTrackInfoService> logger)
        {
            _contextFactory = contextFactory ?? throw new ArgumentNullException(nameof(contextFactory));
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _configurationProvider = configurationProvider ?? throw new ArgumentNullException(nameof(configurationProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public async Task<List<GPSGateTrackInfo>?> FetchTrackInfosAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(externalDeviceId))
            {
                _logger.LogWarning("FetchTrackInfosAsync: externalDeviceId is required");
                return null;
            }

            if (cancellationToken.IsCancellationRequested)
            {
                _logger.LogDebug("Skipping trackinfo fetch for device {DeviceId} - operation already cancelled", externalDeviceId);
                return null;
            }

            try
            {
                var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
                var trackInfosUrl = $"{baseUrl}/applications/{applicationId}/users/{externalDeviceId}/trackinfos?Date={date:yyyy-MM-dd}&Filtered=true";

                using var request = new HttpRequestMessage(HttpMethod.Get, trackInfosUrl);
                request.Headers.Authorization = authHeader;

                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

                var response = await _httpClient.SendAsync(request, linkedCts.Token);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to fetch track infos for device {DeviceId}. Status: {StatusCode}, Reason: {Reason}",
                        externalDeviceId, response.StatusCode, response.ReasonPhrase);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync(linkedCts.Token);
                var trackInfos = JsonSerializer.Deserialize<List<GPSGateTrackInfo>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogDebug("Fetched {Count} track info entries for device {DeviceId} on {Date}",
                    trackInfos?.Count ?? 0, externalDeviceId, date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));

                return trackInfos;
            }
            catch (TaskCanceledException)
            {
                _logger.LogWarning("GPSGate trackinfo API timeout for device {DeviceId}", externalDeviceId);
                return null;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning("GPSGate trackinfo network error for device {DeviceId}: {Message}", externalDeviceId, ex.Message);
                return null;
            }
            catch (IOException ex)
            {
                _logger.LogWarning("GPSGate trackinfo I/O error for device {DeviceId}: {Message}", externalDeviceId, ex.Message);
                return null;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse GPSGate trackinfo response for device {DeviceId}", externalDeviceId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error fetching track infos for device {DeviceId}", externalDeviceId);
                return null;
            }
        }

        /// <inheritdoc />
        public async Task<List<GPSGateTrackInfo>?> FetchDayTrackInfosAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            return await FetchTrackInfosAsync(externalDeviceId, date, cancellationToken);
        }

        /// <inheritdoc />
        public async Task<FMSResponse<VehicleTrackHistoryDTO>> GetTrackHistoryAsync(
            int vehicleId,
            DateTime from,
            DateTime to,
            int maxPoints = 1000,
            CancellationToken cancellationToken = default)
        {
            try
            {
                await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);

                var vehicle = await context.Vehicles
                    .Where(v => v.VehicleId == vehicleId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (vehicle == null)
                {
                    return FMSResponse<VehicleTrackHistoryDTO>.Failed("Vehicle not found");
                }

                var trackDeviceId = await ResolveTrackDeviceIdAsync(context, vehicleId, cancellationToken);
                if (!trackDeviceId.IsSuccess)
                {
                    return FMSResponse<VehicleTrackHistoryDTO>.Failed(trackDeviceId.ErrorMessage ?? "Vehicle doesn't have an active GPS provider mapping configured");
                }

                var dailySummaries = new List<DailyTrackSummaryDTO>();
                var currentDay = from.Date;
                var lastDay = to.Date;

                while (currentDay <= lastDay)
                {
                    var trackInfos = await FetchTrackInfosAsync(trackDeviceId.ExternalDeviceId, currentDay, cancellationToken);

                    if (trackInfos != null && trackInfos.Any())
                    {
                        var orderedInfos = trackInfos
                            .OrderBy(info => ParseTrackInfoTimestamp(info.BoundingBox?.MinTime)
                                ?? ParseTrackInfoTimestamp(info.Updated)
                                ?? currentDay)
                            .ToList();

                        var dailyDistanceKm = ConvertDistanceToKilometers(orderedInfos.Sum(info => info.TotalDistance));
                        var startTime = orderedInfos
                            .Select(info => ParseTrackInfoTimestamp(info.BoundingBox?.MinTime) ?? ParseTrackInfoTimestamp(info.Updated))
                            .Where(value => value.HasValue)
                            .Min();
                        var stopTime = orderedInfos
                            .Select(info => ParseTrackInfoTimestamp(info.BoundingBox?.MaxTime) ?? ParseTrackInfoTimestamp(info.Updated))
                            .Where(value => value.HasValue)
                            .Max();

                        dailySummaries.Add(new DailyTrackSummaryDTO
                        {
                            Date = currentDay.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            StartTime = startTime,
                            StopTime = stopTime,
                            DistanceKm = dailyDistanceKm,
                            PointCount = orderedInfos.Sum(info => info.Count)
                        });
                    }

                    currentDay = currentDay.AddDays(1);
                }

                var totalDistance = dailySummaries.Sum(summary => summary.DistanceKm);
                var totalDuration = dailySummaries
                    .Where(summary => summary.StartTime.HasValue && summary.StopTime.HasValue && summary.StopTime >= summary.StartTime)
                    .Aggregate(TimeSpan.Zero, (total, summary) => total + (summary.StopTime!.Value - summary.StartTime!.Value));

                if (totalDuration == TimeSpan.Zero)
                {
                    totalDuration = to > from ? to - from : TimeSpan.Zero;
                }

                var averageSpeed = totalDuration.TotalHours > 0
                    ? decimal.Round(totalDistance / (decimal)totalDuration.TotalHours, 2)
                    : 0;

                var history = new VehicleTrackHistoryDTO
                {
                    VehicleId = vehicleId,
                    VehicleName = vehicle.VehicleCode ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate ?? string.Empty,
                    FromDate = from,
                    ToDate = to,
                    TrackPoints = new List<TrackPointDTO>(),
                    DailySummaries = dailySummaries,
                    TotalDistance = totalDistance,
                    TotalDuration = totalDuration,
                    AverageSpeed = averageSpeed,
                    MaxSpeed = 0,
                    Stops = new List<StopInfo>(),
                    StopCount = 0,
                };

                return FMSResponse<VehicleTrackHistoryDTO>.Success(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving track history for vehicle {VehicleId}", vehicleId);
                return FMSResponse<VehicleTrackHistoryDTO>.Failed($"Error retrieving track history: {ex.Message}");
            }
        }

        private async Task<(bool IsSuccess, string ExternalDeviceId, string? ErrorMessage)> ResolveTrackDeviceIdAsync(
            GpsdataContext context,
            int vehicleId,
            CancellationToken cancellationToken)
        {
            var providerMapping = await context.Set<DeviceProviderMappingEntity>()
                .Include(mapping => mapping.ProviderConfiguration)
                .Where(mapping => mapping.VehicleId == vehicleId
                    && mapping.IsActive
                    && !string.IsNullOrWhiteSpace(mapping.ExternalDeviceId)
                    && (mapping.ProviderConfiguration == null || mapping.ProviderConfiguration.IsEnabled)
                    && (mapping.ProviderConfiguration == null || mapping.ProviderConfiguration.Name == FMS.Devices.Tracking.Providers.GpsGate.GpsGateProviderConstants.Name))
                .OrderByDescending(mapping => mapping.UpdatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (providerMapping != null)
            {
                return (true, providerMapping.ExternalDeviceId!, null);
            }

            return (false, string.Empty, "Vehicle doesn't have an active GPS provider mapping configured");
        }

        private static DateTime? ParseTrackInfoTimestamp(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsed)
                ? parsed
                : null;
        }

        private static decimal ConvertDistanceToKilometers(double totalDistance)
        {
            if (double.IsNaN(totalDistance) || double.IsInfinity(totalDistance) || totalDistance <= 0)
            {
                return 0;
            }

            return decimal.Round((decimal)(totalDistance / 1000d), 2);
        }
    }
}