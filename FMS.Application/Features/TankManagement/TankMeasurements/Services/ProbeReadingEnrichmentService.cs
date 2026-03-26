/**
 * File: ProbeReadingEnrichmentService.cs
 * Purpose: Redis-backed cadence filtering and calibration volume lookup for UploadStatus probe readings.
 * Dependencies: Redis (IConnectionMultiplexer), GpsdataContext, SystemConfigurationService, TankCalibration entities
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - ShouldSaveReadingAsync(): Compares current reading against Redis-cached last save; skips if height unchanged and within interval.
 * - MarkReadingSavedAsync(): Caches last-saved height + timestamp in Redis after a successful persist.
 * - EnrichVolumeFromCalibrationAsync(): Loads calibration chart (Redis-cached, 1h TTL) and interpolates height→volume. Converts probe mm to chart cm.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Tank;
using FMS.Application.Features.TankManagement.TankCalibration;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Services.Configuration;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using TankCalibrationSnapshot = global::FMS.Domain.Entities.Features.TankStockManagement.TankCalibrationSnapshot;

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

        private sealed class CachedCalibrationChart
        {
            public string ChartType { get; set; } = TankProbeConfigurationOptions.Auto;
            public List<TankCalibrationRecordDto> Records { get; set; } = new();
        }

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

        public async Task<double?> ResolveProductVolumeAsync(
            int tankId,
            int? probeNumber,
            string? preferredProductVolumeSource,
            string? preferredChartSource,
            double? incomingProductVolume,
            double? productHeightMm,
            CancellationToken cancellationToken = default)
        {
            var normalizedProductVolumeSource = TankProbeConfigurationOptions.NormalizeProductVolumeSource(preferredProductVolumeSource);
            var hasUsablePtsVolume = incomingProductVolume.HasValue && incomingProductVolume.Value > 0;

            if (string.Equals(normalizedProductVolumeSource, TankProbeConfigurationOptions.FmsCalibrated, StringComparison.Ordinal))
            {
                var calibratedVolume = await EnrichVolumeFromCalibrationAsync(
                    tankId,
                    probeNumber,
                    preferredChartSource,
                    productHeightMm,
                    cancellationToken);

                if (calibratedVolume.HasValue)
                {
                    _logger.LogDebug(
                        "[ProbeEnrichment] Resolved product volume from FMS calibration for tank {TankId}, probe {ProbeNumber}: {Volume}L",
                        tankId,
                        probeNumber,
                        calibratedVolume.Value);
                    return calibratedVolume.Value;
                }

                if (hasUsablePtsVolume)
                {
                    _logger.LogWarning(
                        "[ProbeEnrichment] Tank {TankId}, probe {ProbeNumber} prefers FMS calibrated volume but no usable local chart was found. Falling back to PTS ProductVolume {Volume}L",
                        tankId,
                        probeNumber,
                        incomingProductVolume.Value);
                }

                return hasUsablePtsVolume ? incomingProductVolume : null;
            }

            if (string.Equals(normalizedProductVolumeSource, TankProbeConfigurationOptions.Pts, StringComparison.Ordinal))
            {
                if (hasUsablePtsVolume)
                {
                    return incomingProductVolume;
                }

                return await EnrichVolumeFromCalibrationAsync(
                    tankId,
                    probeNumber,
                    preferredChartSource,
                    productHeightMm,
                    cancellationToken);
            }

            if (hasUsablePtsVolume)
            {
                return incomingProductVolume;
            }

            return await EnrichVolumeFromCalibrationAsync(
                tankId,
                probeNumber,
                preferredChartSource,
                productHeightMm,
                cancellationToken);
        }

        public async Task<double?> EnrichVolumeFromCalibrationAsync(int tankId, int? probeNumber, string? preferredChartSource, double? productHeightMm, CancellationToken cancellationToken = default)
        {
            if (!productHeightMm.HasValue || productHeightMm.Value <= 0)
            {
                return null;
            }

            var chart = await GetCachedCalibrationChartAsync(tankId, probeNumber, preferredChartSource, cancellationToken);
            if (chart?.Records == null || chart.Records.Count < 2)
            {
                return null;
            }

            // PTS probe measurements are in mm; calibration charts store heights in cm.
            // Convert mm → cm for chart lookup, falling back to raw mm if cm is out of range.
            var heightCm = (int)Math.Round(productHeightMm.Value / 10.0, MidpointRounding.AwayFromZero);
            var volume = InterpolateVolume(chart.Records, heightCm);

            if (!volume.HasValue)
            {
                // Fallback: try raw value in case chart and probe share the same unit
                var heightRaw = (int)Math.Round(productHeightMm.Value, MidpointRounding.AwayFromZero);
                volume = InterpolateVolume(chart.Records, heightRaw);
            }

            if (volume.HasValue)
            {
                _logger.LogDebug(
                    "[ProbeEnrichment] Derived {Volume}L for tank {TankId}, probe {ProbeNumber}, height {HeightMm}mm using {ChartType} chart",
                    volume.Value,
                    tankId,
                    probeNumber,
                    productHeightMm.Value,
                    chart.ChartType);
            }

            return volume.HasValue ? (double)Math.Round(volume.Value, 3, MidpointRounding.AwayFromZero) : null;
        }

        /// <summary>
        /// Loads a usable calibration chart from Redis cache, falling back to DB.
        /// Default priority favors manual and automatic charts before interval-volume because
        /// interval-volume snapshots may contain readiness placeholders rather than usable volume curves.
        /// </summary>
        private async Task<CachedCalibrationChart?> GetCachedCalibrationChartAsync(int tankId, int? probeNumber, string? preferredChartSource, CancellationToken cancellationToken)
        {
            var normalizedPreferredChartSource = TankProbeConfigurationOptions.NormalizeCalibrationChartSource(preferredChartSource)
                ?? TankProbeConfigurationOptions.Auto;
            var probeKey = probeNumber.HasValue && probeNumber.Value > 0 ? probeNumber.Value.ToString() : "any";
            var redisKey = $"calibration:chart:{tankId}:{probeKey}:{normalizedPreferredChartSource}";

            try
            {
                var cached = await _redisDb.StringGetAsync(redisKey);
                if (cached.HasValue)
                {
                    var cachedChart = JsonSerializer.Deserialize<CachedCalibrationChart>(cached.ToString(), JsonOptions);
                    if (cachedChart != null && TryPrepareUsableRecords(cachedChart.Records, out var cachedRecords))
                    {
                        cachedChart.Records = cachedRecords;
                        return cachedChart;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ProbeEnrichment] Redis calibration cache read failed for tank {TankId}", tankId);
            }

            var chartTypePriority = GetChartTypePriority(normalizedPreferredChartSource);

            foreach (var chartType in chartTypePriority)
            {
                var snapshot = await GetLatestCalibrationSnapshotAsync(tankId, probeNumber, chartType, cancellationToken);

                if (snapshot?.RecordsJson == null)
                {
                    continue;
                }

                var records = JsonSerializer.Deserialize<List<TankCalibrationRecordDto>>(snapshot.RecordsJson, JsonOptions);
                if (!TryPrepareUsableRecords(records, out var preparedRecords))
                {
                    _logger.LogDebug(
                        "[ProbeEnrichment] Ignoring unusable {ChartType} calibration snapshot for tank {TankId}, probe {ProbeNumber}",
                        chartType,
                        tankId,
                        probeNumber);
                    continue;
                }

                var chart = new CachedCalibrationChart
                {
                    ChartType = chartType,
                    Records = preparedRecords
                };

                try
                {
                    var serialized = JsonSerializer.Serialize(chart, JsonOptions);
                    await _redisDb.StringSetAsync(redisKey, serialized, expiry: TimeSpan.FromHours(1));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[ProbeEnrichment] Redis calibration cache write failed for tank {TankId}", tankId);
                }

                _logger.LogDebug(
                    "[ProbeEnrichment] Loaded calibration chart ({ChartType}, {Count} records) for tank {TankId}, probe {ProbeNumber}",
                    chartType,
                    preparedRecords.Count,
                    tankId,
                    probeNumber);

                return chart;
            }

            _logger.LogDebug(
                "[ProbeEnrichment] No usable calibration chart found for tank {TankId}, probe {ProbeNumber}, preferred source {PreferredChartSource}",
                tankId,
                probeNumber,
                normalizedPreferredChartSource);
            return null;
        }

        private static string[] GetChartTypePriority(string normalizedPreferredChartSource)
        {
            return normalizedPreferredChartSource switch
            {
                TankProbeConfigurationOptions.Manual => new[]
                {
                    TankCalibrationChartTypes.Manual,
                    TankCalibrationChartTypes.Automatic,
                    TankCalibrationChartTypes.FmsLearned,
                    TankCalibrationChartTypes.IntervalVolume
                },
                TankProbeConfigurationOptions.Automatic => new[]
                {
                    TankCalibrationChartTypes.Automatic,
                    TankCalibrationChartTypes.Manual,
                    TankCalibrationChartTypes.FmsLearned,
                    TankCalibrationChartTypes.IntervalVolume
                },
                TankProbeConfigurationOptions.FmsLearned => new[]
                {
                    TankCalibrationChartTypes.FmsLearned,
                    TankCalibrationChartTypes.Manual,
                    TankCalibrationChartTypes.Automatic,
                    TankCalibrationChartTypes.IntervalVolume
                },
                TankProbeConfigurationOptions.IntervalVolume => new[]
                {
                    TankCalibrationChartTypes.IntervalVolume,
                    TankCalibrationChartTypes.Manual,
                    TankCalibrationChartTypes.Automatic,
                    TankCalibrationChartTypes.FmsLearned
                },
                _ => new[]
                {
                    TankCalibrationChartTypes.Manual,
                    TankCalibrationChartTypes.Automatic,
                    TankCalibrationChartTypes.FmsLearned,
                    TankCalibrationChartTypes.IntervalVolume
                }
            };
        }

        private async Task<TankCalibrationSnapshot?> GetLatestCalibrationSnapshotAsync(
            int tankId,
            int? probeNumber,
            string chartType,
            CancellationToken cancellationToken)
        {
            var baseQuery = _context.TankCalibrationSnapshots
                .AsNoTracking()
                .Where(s => s.TankId == tankId && s.ChartType == chartType);

            if (probeNumber.HasValue && probeNumber.Value > 0)
            {
                var exactProbeMatch = await baseQuery
                    .Where(s => s.ProbeNumber == probeNumber.Value)
                    .OrderByDescending(s => s.RecordedAtUtc)
                    .ThenByDescending(s => s.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (exactProbeMatch != null)
                {
                    return exactProbeMatch;
                }
            }

            return await baseQuery
                .OrderByDescending(s => s.RecordedAtUtc)
                .ThenByDescending(s => s.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private static bool TryPrepareUsableRecords(
            List<TankCalibrationRecordDto>? records,
            out List<TankCalibrationRecordDto> preparedRecords)
        {
            preparedRecords = new List<TankCalibrationRecordDto>();
            if (records == null || records.Count < 2)
            {
                return false;
            }

            preparedRecords = records
                .GroupBy(record => record.Height)
                .Select(group => group.OrderByDescending(record => record.Volume).First())
                .OrderBy(record => record.Height)
                .ToList();

            if (preparedRecords.Count < 2)
            {
                return false;
            }

            if (preparedRecords[^1].Height <= preparedRecords[0].Height)
            {
                return false;
            }

            if (preparedRecords.Max(record => record.Volume) <= 0)
            {
                return false;
            }

            return true;
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
