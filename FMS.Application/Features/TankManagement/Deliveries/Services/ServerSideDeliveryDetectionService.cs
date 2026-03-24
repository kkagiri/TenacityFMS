/**
 * File: ServerSideDeliveryDetectionService.cs
 * Purpose: Detects fuel deliveries from UploadStatus probe readings using a Redis-backed state machine.
 *          Runs as fire-and-forget from UploadStatusCommandHandler so it never blocks packet processing.
 * Dependencies: Redis (IDatabase), GpsdataContext, ISystemConfigurationService, IInTankDeliveryDetectionService
 * Last Modified: 2026-02-10
 *
 * State Machine:
 * - IDLE:        Baseline established, watching for volume rise above noise band
 * - RISING:      Volume is climbing — tracking peak and snapshots
 * - STABILIZING: Volume stopped climbing — counting consecutive stable readings
 * - DETECTED:    Enough stable readings confirmed delivery → create Intankdelivery → reuse pipeline
 */
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Configuration;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Features.TankManagement.Deliveries.Services
{
    public class ServerSideDeliveryDetectionService : IServerSideDeliveryDetectionService
    {
        private readonly IDatabase _redisDb;
        private readonly GpsdataContext _context;
        private readonly ISystemConfigurationService _configService;
        private readonly IInTankDeliveryDetectionService _itdService;
        private readonly ILogger<ServerSideDeliveryDetectionService> _logger;

        private static readonly TimeSpan StateExpiry = TimeSpan.FromMinutes(180); // 3h TTL safety net

        public ServerSideDeliveryDetectionService(
            IConnectionMultiplexer redisConnection,
            GpsdataContext context,
            ISystemConfigurationService configService,
            IInTankDeliveryDetectionService itdService,
            ILogger<ServerSideDeliveryDetectionService> logger)
        {
            _redisDb = redisConnection.GetDatabase();
            _context = context;
            _configService = configService;
            _itdService = itdService;
            _logger = logger;
        }

        public async Task ProcessProbeReadingAsync(
            int tankId,
            ProbeMeasurement probeMeasurement,
            DateTime timestamp,
            string deviceId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Feature gate
                var enabled = await _configService.GetItdServerDetectionEnabledAsync(cancellationToken);
                if (!enabled) return;

                var volume = probeMeasurement.ProductVolume;
                if (!volume.HasValue || volume.Value < 0) return;

                var currentVolume = (decimal)volume.Value;
                var currentHeight = probeMeasurement.ProductHeight.HasValue ? (decimal)probeMeasurement.ProductHeight.Value : 0m;
                var currentTemp = probeMeasurement.Temperature.HasValue ? (decimal)probeMeasurement.Temperature.Value : 0m;

                // Load config
                var noiseBand = await _configService.GetItdServerDetectionNoiseBandLitersAsync(cancellationToken);
                var minRise = await _configService.GetItdServerDetectionMinRiseThresholdLitersAsync(cancellationToken);
                var stableRequired = await _configService.GetItdServerDetectionStableReadingsRequiredAsync(cancellationToken);
                var maxDurationMin = await _configService.GetItdServerDetectionMaxDurationMinutesAsync(cancellationToken);

                // Load or initialize state from Redis
                var stateKey = $"server-itd:{deviceId}:tank:{tankId}";
                var state = await LoadStateAsync(stateKey);

                if (state == null)
                {
                    // First reading — establish baseline
                    state = new DetectionState
                    {
                        Phase = DetectionPhase.Idle,
                        BaselineVolume = currentVolume,
                        BaselineHeight = currentHeight,
                        BaselineTemperature = currentTemp,
                        BaselineTimestamp = timestamp,
                        LastVolume = currentVolume,
                        LastTimestamp = timestamp
                    };
                    await SaveStateAsync(stateKey, state);
                    return;
                }

                // Safety timeout — reset if detection has been running too long
                if (state.Phase != DetectionPhase.Idle && state.RiseStartTimestamp.HasValue)
                {
                    var elapsed = (timestamp - state.RiseStartTimestamp.Value).TotalMinutes;
                    if (elapsed > maxDurationMin)
                    {
                        _logger.LogWarning(
                            "[ServerITD] Tank {TankId} detection timed out after {Minutes:F0}min. Resetting.",
                            tankId, elapsed);
                        await ResetToIdle(stateKey, currentVolume, currentHeight, currentTemp, timestamp);
                        return;
                    }
                }

                var volumeDelta = currentVolume - state.BaselineVolume;

                switch (state.Phase)
                {
                    case DetectionPhase.Idle:
                        await HandleIdle(stateKey, state, currentVolume, currentHeight, currentTemp, timestamp, volumeDelta, noiseBand, tankId);
                        break;

                    case DetectionPhase.Rising:
                        await HandleRising(stateKey, state, currentVolume, currentHeight, currentTemp, timestamp, volumeDelta, noiseBand, minRise, tankId);
                        break;

                    case DetectionPhase.Stabilizing:
                        await HandleStabilizing(stateKey, state, currentVolume, currentHeight, currentTemp, timestamp, noiseBand, stableRequired, minRise, tankId, deviceId, cancellationToken);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ServerITD] Error processing probe reading for tank {TankId}, device {DeviceId}", tankId, deviceId);
            }
        }

        private async Task HandleIdle(string stateKey, DetectionState state, decimal volume, decimal height, decimal temp, DateTime ts, decimal delta, decimal noiseBand, int tankId)
        {
            if (delta > noiseBand)
            {
                // Volume rose above noise band — transition to RISING
                state.Phase = DetectionPhase.Rising;
                state.RiseStartTimestamp = ts;
                state.StartVolume = state.BaselineVolume;
                state.StartHeight = state.BaselineHeight;
                state.StartTemperature = state.BaselineTemperature;
                state.StartTimestamp = state.BaselineTimestamp;
                state.PeakVolume = volume;
                state.PeakHeight = height;
                state.PeakTemperature = temp;
                state.PeakTimestamp = ts;
                state.LastVolume = volume;
                state.LastTimestamp = ts;
                state.StableReadingCount = 0;

                _logger.LogInformation(
                    "[ServerITD] Tank {TankId} IDLE→RISING: baseline={Baseline:F1}L, current={Current:F1}L, delta={Delta:F1}L",
                    tankId, state.BaselineVolume, volume, delta);

                await SaveStateAsync(stateKey, state);
            }
            else if (delta < -noiseBand)
            {
                // Volume dropped significantly — re-baseline (dispensing happening)
                state.BaselineVolume = volume;
                state.BaselineHeight = height;
                state.BaselineTemperature = temp;
                state.BaselineTimestamp = ts;
                state.LastVolume = volume;
                state.LastTimestamp = ts;
                await SaveStateAsync(stateKey, state);
            }
            else
            {
                // Within noise band — update rolling baseline with slight smoothing
                state.BaselineVolume = volume;
                state.BaselineHeight = height;
                state.BaselineTemperature = temp;
                state.BaselineTimestamp = ts;
                state.LastVolume = volume;
                state.LastTimestamp = ts;
                await SaveStateAsync(stateKey, state);
            }
        }

        private async Task HandleRising(string stateKey, DetectionState state, decimal volume, decimal height, decimal temp, DateTime ts, decimal delta, decimal noiseBand, decimal minRise, int tankId)
        {
            var deltaFromPeak = volume - state.PeakVolume;

            if (deltaFromPeak > 0)
            {
                // Still rising — update peak
                state.PeakVolume = volume;
                state.PeakHeight = height;
                state.PeakTemperature = temp;
                state.PeakTimestamp = ts;
                state.LastVolume = volume;
                state.LastTimestamp = ts;
                state.StableReadingCount = 0;
                await SaveStateAsync(stateKey, state);
            }
            else if (Math.Abs(deltaFromPeak) <= noiseBand)
            {
                // Volume stabilized near peak — check if we have enough total rise
                var totalRise = state.PeakVolume - state.StartVolume;
                if (totalRise >= minRise)
                {
                    // Transition to STABILIZING
                    state.Phase = DetectionPhase.Stabilizing;
                    state.StableReadingCount = 1;
                    state.LastVolume = volume;
                    state.LastTimestamp = ts;

                    _logger.LogInformation(
                        "[ServerITD] Tank {TankId} RISING→STABILIZING: rise={Rise:F1}L (min={Min:F1}L), peak={Peak:F1}L",
                        tankId, totalRise, minRise, state.PeakVolume);

                    await SaveStateAsync(stateKey, state);
                }
                else
                {
                    // Total rise below threshold — keep watching
                    state.StableReadingCount++;
                    state.LastVolume = volume;
                    state.LastTimestamp = ts;
                    await SaveStateAsync(stateKey, state);
                }
            }
            else
            {
                // Volume dropped significantly from peak — false alarm, reset
                _logger.LogInformation(
                    "[ServerITD] Tank {TankId} RISING→IDLE: volume dropped from peak {Peak:F1}L to {Current:F1}L. False alarm.",
                    tankId, state.PeakVolume, volume);
                await ResetToIdle(stateKey, volume, height, temp, ts);
            }
        }

        private async Task HandleStabilizing(string stateKey, DetectionState state, decimal volume, decimal height, decimal temp, DateTime ts, decimal noiseBand, int stableRequired, decimal minRise, int tankId, string deviceId, CancellationToken ct)
        {
            var deltaFromPeak = Math.Abs(volume - state.PeakVolume);

            if (deltaFromPeak <= noiseBand)
            {
                // Still stable near peak
                state.StableReadingCount++;
                state.LastVolume = volume;
                state.LastTimestamp = ts;

                if (state.StableReadingCount >= stableRequired)
                {
                    // DELIVERY CONFIRMED
                    var totalRise = state.PeakVolume - state.StartVolume;

                    _logger.LogInformation(
                        "[ServerITD] Tank {TankId} DELIVERY DETECTED: {Volume:F1}L rise, start={Start:F1}L, end={End:F1}L, duration={Duration:F1}min",
                        tankId, totalRise, state.StartVolume, state.PeakVolume,
                        state.RiseStartTimestamp.HasValue ? (ts - state.RiseStartTimestamp.Value).TotalMinutes : 0);

                    await CreateDeliveryRecordAsync(state, tankId, deviceId, ts, ct);

                    // Reset to idle with new baseline at current level
                    await ResetToIdle(stateKey, volume, height, temp, ts);
                }
                else
                {
                    await SaveStateAsync(stateKey, state);
                }
            }
            else if (volume > state.PeakVolume + noiseBand)
            {
                // Volume rising again — back to RISING with updated peak
                state.Phase = DetectionPhase.Rising;
                state.PeakVolume = volume;
                state.PeakHeight = height;
                state.PeakTemperature = temp;
                state.PeakTimestamp = ts;
                state.StableReadingCount = 0;
                state.LastVolume = volume;
                state.LastTimestamp = ts;

                _logger.LogInformation(
                    "[ServerITD] Tank {TankId} STABILIZING→RISING: volume rose again to {Volume:F1}L",
                    tankId, volume);

                await SaveStateAsync(stateKey, state);
            }
            else
            {
                // Volume dropped below peak beyond noise — false alarm, reset
                _logger.LogInformation(
                    "[ServerITD] Tank {TankId} STABILIZING→IDLE: volume dropped from peak {Peak:F1}L to {Current:F1}L. False alarm.",
                    tankId, state.PeakVolume, volume);
                await ResetToIdle(stateKey, volume, height, temp, ts);
            }
        }

        private async Task CreateDeliveryRecordAsync(DetectionState state, int tankId, string deviceId, DateTime timestamp, CancellationToken ct)
        {
            try
            {
                // Check for duplicate firmware-detected ITD within the window
                var dupWindow = await _configService.GetItdServerDetectionDuplicateWindowMinutesAsync(ct);
                var windowStart = (state.StartTimestamp ?? timestamp).AddMinutes(-dupWindow);
                var windowEnd = timestamp.AddMinutes(dupWindow);

                var duplicateExists = await _context.Intankdeliveries
                    .AnyAsync(d => d.TankId == tankId
                        && d.StartDateTime >= windowStart
                        && d.StartDateTime <= windowEnd
                        && d.Status != "Rejected", ct);

                if (duplicateExists)
                {
                    _logger.LogInformation(
                        "[ServerITD] Tank {TankId} delivery already recorded by firmware within ±{Window}min window. Skipping.",
                        tankId, dupWindow);
                    return;
                }

                // Resolve tank for metadata
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.Id == tankId, ct);

                if (tank == null)
                {
                    _logger.LogWarning("[ServerITD] Tank {TankId} not found in database. Cannot create delivery record.", tankId);
                    return;
                }

                var delivery = new Intankdelivery
                {
                    Ptsid = deviceId,
                    Tank = tank.ProbeNumber ?? 0,
                    FuelGradeId = tank.FuelGradeId ?? 0,
                    TankId = tankId,
                    SiteId = tank.SiteId,

                    // Start snapshot (baseline before rise)
                    StartDateTime = state.StartTimestamp ?? state.RiseStartTimestamp,
                    StartProductVolume = (float?)state.StartVolume,
                    StartProductHeight = (float?)state.StartHeight,
                    StartTemperature = (float?)state.StartTemperature,

                    // End snapshot (stabilized level)
                    EndDateTime = timestamp,
                    EndProductVolume = (float?)state.PeakVolume,
                    EndProductHeight = (float?)state.PeakHeight,
                    EndTemperature = (float?)state.PeakTemperature,

                    // Absolute delta
                    AbsoluteProductVolume = (float?)(state.PeakVolume - state.StartVolume),
                    AbsoluteProductHeight = (float?)(state.PeakHeight - state.StartHeight),
                    AbsoluteTemperature = (float?)(state.PeakTemperature - state.StartTemperature),

                    DetectedAt = DateTime.UtcNow,
                    Status = "ServerDetected",
                    IsProcessed = false,
                    ConfigurationId = "ServerSideDetection"
                };

                _context.Intankdeliveries.Add(delivery);
                await _context.SaveChangesAsync(ct);

                _logger.LogInformation(
                    "[ServerITD] Created Intankdelivery record {DeliveryId} for tank {TankId}: {Volume:F1}L",
                    delivery.DeliveryId, tankId, state.PeakVolume - state.StartVolume);

                // Reuse existing ITD pipeline (alerts, ledger, matching)
                await _itdService.ProcessDetectedDeliveryAsync(delivery, tank, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ServerITD] Error creating delivery record for tank {TankId}", tankId);
            }
        }

        private async Task ResetToIdle(string stateKey, decimal volume, decimal height, decimal temp, DateTime ts)
        {
            var state = new DetectionState
            {
                Phase = DetectionPhase.Idle,
                BaselineVolume = volume,
                BaselineHeight = height,
                BaselineTemperature = temp,
                BaselineTimestamp = ts,
                LastVolume = volume,
                LastTimestamp = ts
            };
            await SaveStateAsync(stateKey, state);
        }

        private async Task<DetectionState?> LoadStateAsync(string key)
        {
            var json = await _redisDb.StringGetAsync(key);
            if (json.IsNullOrEmpty) return null;
            return JsonSerializer.Deserialize<DetectionState>(json!);
        }

        private async Task SaveStateAsync(string key, DetectionState state)
        {
            var json = JsonSerializer.Serialize(state);
            await _redisDb.StringSetAsync(key, json, StateExpiry);
        }

        #region State Model
        private enum DetectionPhase
        {
            Idle = 0,
            Rising = 1,
            Stabilizing = 2
        }

        private class DetectionState
        {
            public DetectionPhase Phase { get; set; }

            // Baseline (IDLE level before any rise)
            public decimal BaselineVolume { get; set; }
            public decimal BaselineHeight { get; set; }
            public decimal BaselineTemperature { get; set; }
            public DateTime BaselineTimestamp { get; set; }

            // Snapshot at the moment the rise started (used as Start* in Intankdelivery)
            public decimal StartVolume { get; set; }
            public decimal StartHeight { get; set; }
            public decimal StartTemperature { get; set; }
            public DateTime? StartTimestamp { get; set; }

            // Peak values during rise (used as End* in Intankdelivery)
            public decimal PeakVolume { get; set; }
            public decimal PeakHeight { get; set; }
            public decimal PeakTemperature { get; set; }
            public DateTime? PeakTimestamp { get; set; }

            // Tracking
            public DateTime? RiseStartTimestamp { get; set; }
            public int StableReadingCount { get; set; }
            public decimal LastVolume { get; set; }
            public DateTime LastTimestamp { get; set; }
        }
        #endregion
    }
}
