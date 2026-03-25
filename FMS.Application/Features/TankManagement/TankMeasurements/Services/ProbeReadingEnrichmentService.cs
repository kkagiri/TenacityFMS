/**
 * File: ProbeReadingEnrichmentService.cs
 * Purpose: Redis-backed cadence filtering and calibration volume lookup for UploadStatus probe readings.
 * Dependencies: Redis (IConnectionMultiplexer), GpsdataContext, SystemConfigurationService, TankCalibration entities
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - ShouldSaveReadingAsync(): Compares current reading against Redis-cached last save; skips if height unchanged and within interval.
 * - MarkReadingSavedAsync(): Caches last-saved height + timestamp in Redis after a successful persist.
 * - EnrichVolumeFromCalibrationAsync(): Loads calibration chart (Redis-cached, 1h TTL) and interpolates height→volume.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.TankCalibration;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Services.Configuration;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Features.TankManagement.TankMeasurements.Services
{
    public class ProbeReadingEnrichmentService : IProbeReadingEnrichmentService
    {
        private readonly IDatabase _redisDb;
        private readonly GpsdataContext _context;
        private readonly ISystemConfigurationService _systemConfigurationService;
        private readonly ILogger<ProbeReadingEnrichmentService> _logger;

        /// <summary>Minimum height change (mm) to trigger a save. Below this, the reading is considered a duplicate.</summary>
        private const double DefaultHeightChangeThresholdMm = 1.0;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public ProbeReadingEnrichmentService(
            IConnectionMultiplexer redisConnection,
            GpsdataContext context,
            ISystemConfigurationService systemConfigurationService,
            ILogger<ProbeReadingEnrichmentService> logger)
        {
            _redisDb = redisConnection.GetDatabase();
            _context = context;
            _systemConfigurationService = systemConfigurationService;
            _logger = logger;
        }

        #region Cadence Filtering

        public async Task<bool> ShouldSaveReadingAsync(string deviceId, int tankId, double? productHeight, CancellationToken cancellationToken = default)
        {
            if (!productHeight.HasValue)
            {
                return true; // Can't deduplicate without a height value
            }

            var redisKey = $"probe-reading:last-saved:{deviceId}:{tankId}";

            try
            {
                var cached = await _redisDb.StringGetAsync(redisKey);
                if (!cached.HasValue)
                {
                    return true; // First reading — always save
                }

                using var doc = JsonDocument.Parse(cached.ToString());
                var root = doc.RootElement;

                var lastHeight = root.TryGetProperty("height", out var hElem) && hElem.TryGetDouble(out var h) ? h : (double?)null;
                DateTime? lastSavedAtUtc = null;
                if (root.TryGetProperty("savedAtUtc", out var sElem))
                {
                    var dateStr = sElem.GetString();
                    if (DateTime.TryParse(dateStr, out var parsed))
                    {
                        lastSavedAtUtc = parsed.ToUniversalTime();
                    }
                }

                // Check 1: Height changed beyond threshold
                if (lastHeight.HasValue)
                {
                    var delta = Math.Abs(productHeight.Value - lastHeight.Value);
                    if (delta >= DefaultHeightChangeThresholdMm)
                    {
                        return true;
                    }
                }

                // Check 2: Max save interval elapsed (uses existing MeasurementPersistIntervalSeconds config)
                if (lastSavedAtUtc.HasValue)
                {
                    var maxIntervalSeconds = await _systemConfigurationService
                        .GetPtsUploadStatusMeasurementPersistIntervalSecondsAsync(cancellationToken);
                    if (maxIntervalSeconds <= 0)
                    {
                        maxIntervalSeconds = 300; // fallback 5 minutes
                    }

                    var elapsed = DateTime.UtcNow - lastSavedAtUtc.Value;
                    if (elapsed.TotalSeconds >= maxIntervalSeconds)
                    {
                        return true; // Heartbeat — save periodic reading even if height unchanged
                    }
                }

                return false; // No significant change and within interval — skip
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ProbeEnrichment] Redis cadence check failed for {DeviceId}/{TankId}, allowing save", deviceId, tankId);
                return true; // On Redis failure, allow save (safe fallback)
            }
        }

        public async Task MarkReadingSavedAsync(string deviceId, int tankId, double? productHeight)
        {
            var redisKey = $"probe-reading:last-saved:{deviceId}:{tankId}";

            try
            {
                var payload = JsonSerializer.Serialize(new
                {
                    height = productHeight,
                    savedAtUtc = DateTime.UtcNow.ToString("o")
                }, JsonOptions);

                await _redisDb.StringSetAsync(redisKey, payload, expiry: TimeSpan.FromMinutes(30));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ProbeEnrichment] Failed to update Redis cadence cache for {DeviceId}/{TankId}", deviceId, tankId);
            }
        }

        #endregion

        #region Calibration Volume Enrichment

        public async Task<double?> EnrichVolumeFromCalibrationAsync(int tankId, double? productHeightMm, CancellationToken cancellationToken = default)
        {
            if (!productHeightMm.HasValue || productHeightMm.Value <= 0)
            {
                return null;
            }

            var records = await GetCachedCalibrationRecordsAsync(tankId, cancellationToken);
            if (records == null || records.Count < 2)
            {
                return null;
            }

            // The calibration chart uses integer mm heights; probe reading is a double mm
            var heightMm = (int)Math.Round(productHeightMm.Value, MidpointRounding.AwayFromZero);
            var volume = InterpolateVolume(records, heightMm);

            return volume.HasValue ? (double)Math.Round(volume.Value, 3, MidpointRounding.AwayFromZero) : null;
        }

        /// <summary>
        /// Loads calibration chart records from Redis cache, falling back to DB.
        /// Tries chart types in priority order: interval-volume → manual → automatic → fms-learned.
        /// </summary>
        private async Task<List<TankCalibrationRecordDto>?> GetCachedCalibrationRecordsAsync(int tankId, CancellationToken cancellationToken)
        {
            var redisKey = $"calibration:chart:{tankId}";

            try
            {
                // Try Redis cache first
                var cached = await _redisDb.StringGetAsync(redisKey);
                if (cached.HasValue)
                {
                    var cachedRecords = JsonSerializer.Deserialize<List<TankCalibrationRecordDto>>(cached.ToString(), JsonOptions);
                    if (cachedRecords != null && cachedRecords.Count >= 2)
                    {
                        return cachedRecords;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ProbeEnrichment] Redis calibration cache read failed for tank {TankId}", tankId);
            }

            // Fallback: load from DB — try chart types in priority order
            var chartTypePriority = new[]
            {
                TankCalibrationChartTypes.IntervalVolume,
                TankCalibrationChartTypes.Manual,
                TankCalibrationChartTypes.Automatic,
                TankCalibrationChartTypes.FmsLearned
            };

            foreach (var chartType in chartTypePriority)
            {
                var snapshot = await _context.TankCalibrationSnapshots
                    .AsNoTracking()
                    .Where(s => s.TankId == tankId && s.ChartType == chartType)
                    .OrderByDescending(s => s.RecordedAtUtc)
                    .ThenByDescending(s => s.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (snapshot?.RecordsJson == null)
                {
                    continue;
                }

                var records = JsonSerializer.Deserialize<List<TankCalibrationRecordDto>>(snapshot.RecordsJson, JsonOptions);
                if (records == null || records.Count < 2)
                {
                    continue;
                }

                // Sort by height ascending for interpolation
                records = records.OrderBy(r => r.Height).ToList();

                // Cache in Redis for 1 hour
                try
                {
                    var serialized = JsonSerializer.Serialize(records, JsonOptions);
                    await _redisDb.StringSetAsync(redisKey, serialized, expiry: TimeSpan.FromHours(1));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[ProbeEnrichment] Redis calibration cache write failed for tank {TankId}", tankId);
                }

                _logger.LogDebug("[ProbeEnrichment] Loaded calibration chart ({ChartType}, {Count} records) for tank {TankId}",
                    chartType, records.Count, tankId);

                return records;
            }

            _logger.LogDebug("[ProbeEnrichment] No calibration chart found for tank {TankId}", tankId);
            return null;
        }

        /// <summary>
        /// Linear interpolation between two calibration chart points.
        /// Same algorithm as CalibrationLearningChartMath.TryGetInterpolatedVolume.
        /// </summary>
        private static decimal? InterpolateVolume(IReadOnlyList<TankCalibrationRecordDto> records, int heightMm)
        {
            if (records.Count == 0)
            {
                return null;
            }

            if (heightMm < records[0].Height || heightMm > records[^1].Height)
            {
                return null;
            }

            for (var index = 0; index < records.Count; index++)
            {
                if (records[index].Height == heightMm)
                {
                    return records[index].Volume;
                }

                if (records[index].Height > heightMm)
                {
                    if (index == 0)
                    {
                        return null;
                    }

                    var previous = records[index - 1];
                    var next = records[index];
                    var heightSpan = next.Height - previous.Height;
                    if (heightSpan <= 0)
                    {
                        return previous.Volume;
                    }

                    var heightOffset = heightMm - previous.Height;
                    var interpolatedVolume = previous.Volume
                        + ((decimal)(next.Volume - previous.Volume) * heightOffset / heightSpan);

                    return Math.Round(interpolatedVolume, 3, MidpointRounding.AwayFromZero);
                }
            }

            return records[^1].Volume;
        }

        #endregion
    }
}
