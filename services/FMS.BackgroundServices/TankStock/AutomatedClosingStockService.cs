/**
 * File:          AutomatedClosingStockService.cs
 * Purpose:       Scheduled background service that auto-creates closing stock entries
 *                for tanks that have an opening stock but no closing stock at end of day.
 *                Uses sensor data (UploadStatusProbeReading) when available, falls back
 *                to Tank.PhysicalStockValue, then to calculation (opening + transactions).
 *                Skips auto-close when variance exceeds a configurable threshold.
 * Dependencies:  GpsdataContext, IMediator (ClosingStockCommand), IEventExpressionEngine
 * Last Modified: 2026-04-01
 *
 * Key Functions:
 * - ExecuteAsync(): Main loop — checks once per minute if it's time to run
 * - ProcessTanksForAutoCloseAsync(): Core logic — iterates active tanks and auto-closes
 * - GetClosingValueAsync(): Determines closing value from sensor/calculation with variance check
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Configuration;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.TankStock
{
    public class AutomatedClosingStockService : BackgroundService
    {
        private readonly ILogger<AutomatedClosingStockService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _hostEnvironment;

        private readonly TimeSpan _baseInterval = TimeSpan.FromMinutes(1);
        private readonly TimeSpan _defaultScheduleTime = new TimeSpan(23, 45, 0);
        private const decimal DefaultMaxVarianceLiters = 50m;
        private const int DefaultSensorMaxAgeMins = 120;
        private const string SystemUserId = "system-auto-close";

        private DateTime _lastRunDate = DateTime.MinValue;

        public AutomatedClosingStockService(
            ILogger<AutomatedClosingStockService> logger,
            IServiceScopeFactory serviceScopeFactory,
            IConfiguration configuration,
            IHostEnvironment hostEnvironment)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
            _hostEnvironment = hostEnvironment;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_hostEnvironment.IsProduction())
            {
                _logger.LogWarning("AutomatedClosingStockService is DISABLED in {Environment} environment. Only runs in Production.", _hostEnvironment.EnvironmentName);
                return;
            }

            _logger.LogInformation("AutomatedClosingStockService starting — auto-creates closing stock daily");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var scheduleTime = await GetConfigTimeSpanAsync("AutoClosingStock_ScheduleTime", _defaultScheduleTime);

                    if (ShouldRun(now, scheduleTime))
                    {
                        _logger.LogInformation("Starting automated closing stock run");
                        await ProcessTanksForAutoCloseAsync(stoppingToken);
                        _lastRunDate = now.Date;
                        _logger.LogInformation("Completed automated closing stock run");
                    }

                    await Task.Delay(_baseInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("AutomatedClosingStockService stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in AutomatedClosingStockService cycle");
                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    }
                    catch (OperationCanceledException) { break; }
                }
            }

            _logger.LogInformation("AutomatedClosingStockService has stopped");
        }

        private bool ShouldRun(DateTime now, TimeSpan scheduleTime)
        {
            var target = now.Date.Add(scheduleTime);
            return now >= target
                && now < target.AddMinutes(2)
                && _lastRunDate.Date < now.Date;
        }

        private async Task ProcessTanksForAutoCloseAsync(CancellationToken ct)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var eventEngine = scope.ServiceProvider.GetRequiredService<IEventExpressionEngine>();

            // Check if enabled
            if (!await IsEnabledAsync(context))
            {
                _logger.LogInformation("AutoClosingStock is disabled via SystemConfiguration");
                return;
            }

            var maxVariance = await GetConfigDecimalAsync(context, "AutoClosingStock_MaxVarianceLiters", DefaultMaxVarianceLiters);
            var sensorMaxAgeMins = await GetConfigIntAsync(context, "AutoClosingStock_SensorMaxAgeMins", DefaultSensorMaxAgeMins);

            var today = DateTime.UtcNow.Date;

            // Get all active tanks
            var tanks = await context.Tanks
                .Include(t => t.Site)
                .Where(t => t.Name != null)
                .ToListAsync(ct);

            _logger.LogInformation("Checking {TankCount} tanks for auto-closing stock on {Date:yyyy-MM-dd}", tanks.Count, today);

            int autoClosedCount = 0;
            int skippedVarianceCount = 0;
            int skippedNoOpeningCount = 0;
            int skippedAlreadyClosedCount = 0;
            int errorCount = 0;

            foreach (var tank in tanks)
            {
                try
                {
                    var result = await TryAutoCloseTankAsync(
                        context, mediator, eventEngine, tank, today,
                        maxVariance, sensorMaxAgeMins, ct);

                    switch (result)
                    {
                        case AutoCloseResult.Closed:
                            autoClosedCount++;
                            break;
                        case AutoCloseResult.SkippedVarianceTooHigh:
                            skippedVarianceCount++;
                            break;
                        case AutoCloseResult.SkippedNoOpening:
                            skippedNoOpeningCount++;
                            break;
                        case AutoCloseResult.SkippedAlreadyClosed:
                            skippedAlreadyClosedCount++;
                            break;
                    }
                }
                catch (Exception ex)
                {
                    errorCount++;
                    _logger.LogError(ex, "Error auto-closing tank {TankId} ({TankName})", tank.Id, tank.Name);
                }
            }

            _logger.LogInformation(
                "Auto-closing stock complete: {Closed} closed, {SkippedVariance} skipped (variance), " +
                "{SkippedNoOpening} skipped (no opening), {SkippedAlreadyClosed} already closed, {Errors} errors",
                autoClosedCount, skippedVarianceCount, skippedNoOpeningCount, skippedAlreadyClosedCount, errorCount);
        }

        private async Task<AutoCloseResult> TryAutoCloseTankAsync(
            GpsdataContext context,
            IMediator mediator,
            IEventExpressionEngine eventEngine,
            Tank tank,
            DateTime today,
            decimal maxVariance,
            int sensorMaxAgeMins,
            CancellationToken ct)
        {
            // Find today's opening stock
            var openingStock = await context.TankVolumeHistories
                .Where(x => x.TankId == tank.Id
                    && x.Timestamp.Date == today
                    && x.ChangeReason == VolumeChangeReasonEnum.OpeningStock
                    && (x.IsDeleted != true))
                .SingleOrDefaultAsync(ct);

            if (openingStock == null)
                return AutoCloseResult.SkippedNoOpening;

            // Check if closing stock already exists (use timestamp range like ClosingStockCommand does)
            var businessDayStart = openingStock.Timestamp;
            var businessDayEnd = openingStock.Timestamp.AddDays(1);

            var existingClosing = await context.TankVolumeHistories
                .Where(x => x.TankId == tank.Id
                    && x.Timestamp >= businessDayStart
                    && x.Timestamp <= businessDayEnd
                    && x.ChangeReason == VolumeChangeReasonEnum.ClosingStock
                    && (x.IsDeleted != true))
                .AnyAsync(ct);

            if (existingClosing)
                return AutoCloseResult.SkippedAlreadyClosed;

            // Determine closing value
            var closingResult = await GetClosingValueAsync(
                context, tank, openingStock, today, sensorMaxAgeMins, ct);

            if (closingResult == null)
            {
                _logger.LogWarning("Could not determine closing value for Tank {TankId} ({TankName}) — no sensor data and no transactions",
                    tank.Id, tank.Name);
                return AutoCloseResult.SkippedNoOpening; // nothing to close with
            }

            // Calculate expected closing from transactions
            var expectedClosing = await CalculateExpectedClosingAsync(
                context, tank.Id, openingStock, businessDayStart, businessDayEnd, ct);

            // Variance check — compare actual sensor/physical value against expected
            var variance = Math.Abs(closingResult.Value - expectedClosing);

            if (variance > maxVariance)
            {
                _logger.LogWarning(
                    "Auto-close SKIPPED for Tank {TankId} ({TankName}): variance {Variance:F2}L exceeds threshold {Threshold:F2}L. " +
                    "Source={Source}, SensorValue={SensorValue:F2}L, Expected={Expected:F2}L",
                    tank.Id, tank.Name, variance, maxVariance,
                    closingResult.Source, closingResult.Value, expectedClosing);

                // Fire event so users get notified about the skipped auto-close
                await FireVarianceSkippedEventAsync(
                    eventEngine, tank, closingResult.Value, expectedClosing,
                    variance, maxVariance, closingResult.Source, ct);

                return AutoCloseResult.SkippedVarianceTooHigh;
            }

            // Dispatch ClosingStockCommand via MediatR — reuse all existing validation/reconciliation
            var command = new ClosingStockCommand(
                TankId: tank.Id,
                ClosingStock: closingResult.Value,
                RecordedBy: SystemUserId,
                EntryDate: today,
                ConfirmOverride: true);

            var response = await mediator.Send(command, ct);

            if (response.Success)
            {
                _logger.LogInformation(
                    "Auto-closed Tank {TankId} ({TankName}): {Value:F2}L from {Source}",
                    tank.Id, tank.Name, closingResult.Value, closingResult.Source);

                await FireAutoClosedEventAsync(
                    eventEngine, tank, closingResult.Value, closingResult.Source, ct);

                return AutoCloseResult.Closed;
            }
            else
            {
                _logger.LogWarning(
                    "Auto-close command failed for Tank {TankId} ({TankName}): {Message}",
                    tank.Id, tank.Name, response.Message);
                return AutoCloseResult.SkippedNoOpening;
            }
        }

        /// <summary>
        /// Determines the closing stock value using priority: Sensor → PhysicalStockValue → Calculation.
        /// </summary>
        private async Task<ClosingValueResult?> GetClosingValueAsync(
            GpsdataContext context,
            Tank tank,
            TankVolumeHistory openingStock,
            DateTime today,
            int sensorMaxAgeMins,
            CancellationToken ct)
        {
            var cutoffTime = DateTime.UtcNow.AddMinutes(-sensorMaxAgeMins);

            // Priority 1: Recent sensor reading (UploadStatusProbeReading)
            if (tank.PtsId != null || tank.UsePtsProbeReadings)
            {
                var latestProbeReading = await context.UploadStatusProbeReadings
                    .Where(r => r.TankId == tank.Id
                        && r.DateTime >= cutoffTime
                        && r.ProductVolume.HasValue
                        && r.ProductVolume > 0)
                    .OrderByDescending(r => r.DateTime)
                    .FirstOrDefaultAsync(ct);

                if (latestProbeReading != null)
                {
                    return new ClosingValueResult(
                        (decimal)latestProbeReading.ProductVolume!.Value,
                        $"Sensor (UploadStatusProbeReading, {latestProbeReading.DateTime:HH:mm:ss} UTC)");
                }

                // Also check Tankmeasurements (legacy sensor source)
                var latestTankMeasurement = await context.Tankmeasurements
                    .Where(tm => tm.Ptsid == tank.PtsId
                        && tm.DateTime >= cutoffTime
                        && tm.ProductVolume.HasValue
                        && tm.ProductVolume > 0)
                    .OrderByDescending(tm => tm.DateTime)
                    .FirstOrDefaultAsync(ct);

                if (latestTankMeasurement != null)
                {
                    return new ClosingValueResult(
                        (decimal)latestTankMeasurement.ProductVolume!.Value,
                        $"Sensor (TankMeasurement, {latestTankMeasurement.DateTime:HH:mm:ss} UTC)");
                }
            }

            // Priority 2: Tank.PhysicalStockValue (last known sensor value, may be older)
            if (tank.PhysicalStockValue.HasValue && tank.PhysicalStockValue > 0
                && tank.LastPhysicalStockUpdate.HasValue
                && tank.LastPhysicalStockUpdate.Value >= cutoffTime)
            {
                return new ClosingValueResult(
                    tank.PhysicalStockValue.Value,
                    $"PhysicalStockValue ({tank.PhysicalStockSource ?? "unknown"}, {tank.LastPhysicalStockUpdate.Value:HH:mm:ss} UTC)");
            }

            // Priority 3: Calculation (opening + transactions)
            var businessDayStart = openingStock.Timestamp;
            var businessDayEnd = openingStock.Timestamp.AddDays(1);

            var openingValue = openingStock.NewVolume ?? openingStock.VolumeChange ?? 0;

            var totalTransactionVolume = await context.TankVolumeHistories
                .Where(tvh => tvh.TankId == tank.Id
                    && tvh.Timestamp > businessDayStart
                    && tvh.Timestamp < businessDayEnd
                    && tvh.ChangeReason != VolumeChangeReasonEnum.OpeningStock
                    && tvh.ChangeReason != VolumeChangeReasonEnum.ClosingStock
                    && (tvh.IsDeleted != true))
                .SumAsync(tvh => tvh.VolumeChange ?? 0, ct);

            var calculatedValue = openingValue + totalTransactionVolume;

            if (calculatedValue > 0)
            {
                return new ClosingValueResult(calculatedValue, "Calculation (opening + transactions)");
            }

            return null;
        }

        /// <summary>
        /// Calculates the expected closing stock from opening stock + all day transactions.
        /// Used for variance comparison regardless of which source provided the closing value.
        /// </summary>
        private async Task<decimal> CalculateExpectedClosingAsync(
            GpsdataContext context,
            int tankId,
            TankVolumeHistory openingStock,
            DateTime businessDayStart,
            DateTime businessDayEnd,
            CancellationToken ct)
        {
            var openingValue = openingStock.NewVolume ?? openingStock.VolumeChange ?? 0;

            var totalTransactionVolume = await context.TankVolumeHistories
                .Where(tvh => tvh.TankId == tankId
                    && tvh.Timestamp > businessDayStart
                    && tvh.Timestamp < businessDayEnd
                    && tvh.ChangeReason != VolumeChangeReasonEnum.OpeningStock
                    && tvh.ChangeReason != VolumeChangeReasonEnum.ClosingStock
                    && (tvh.IsDeleted != true))
                .SumAsync(tvh => tvh.VolumeChange ?? 0, ct);

            return openingValue + totalTransactionVolume;
        }

        private async Task FireVarianceSkippedEventAsync(
            IEventExpressionEngine eventEngine,
            Tank tank,
            decimal sensorValue,
            decimal expectedValue,
            decimal variance,
            decimal threshold,
            string source,
            CancellationToken ct)
        {
            try
            {
                var systemEvent = new SystemEvent
                {
                    SubType = "AutoClosingStockSkipped",
                    SourceComponent = "AutomatedClosingStockService",
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Severity = "High",
                    Message = $"Auto-closing stock skipped for {tank.Name}: variance {variance:F0}L exceeds {threshold:F0}L threshold. Manual closing required.",
                    Data =
                    {
                        ["tankName"] = tank.Name ?? $"Tank {tank.Id}",
                        ["siteName"] = tank.Site?.Name ?? $"Site {tank.SiteId}",
                        ["sensorValue"] = sensorValue.ToString("F2"),
                        ["expectedValue"] = expectedValue.ToString("F2"),
                        ["variance"] = variance.ToString("F2"),
                        ["threshold"] = threshold.ToString("F2"),
                        ["source"] = source,
                        ["date"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        ["dateDisplay"] = DateTime.UtcNow.ToString("dd MMM yyyy"),
                        ["emailBodyHtml"] = BuildVarianceSkippedEmailHtml(
                            tank, sensorValue, expectedValue, variance, threshold, source)
                    }
                };

                await eventEngine.ProcessAsync(systemEvent, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fire AutoClosingStockSkipped event for Tank {TankId}", tank.Id);
            }
        }

        private async Task FireAutoClosedEventAsync(
            IEventExpressionEngine eventEngine,
            Tank tank,
            decimal closingValue,
            string source,
            CancellationToken ct)
        {
            try
            {
                var systemEvent = new SystemEvent
                {
                    SubType = "AutoClosingStockCreated",
                    SourceComponent = "AutomatedClosingStockService",
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Severity = "Information",
                    Message = $"Auto-closing stock created for {tank.Name}: {closingValue:F0}L from {source}.",
                    Data =
                    {
                        ["tankName"] = tank.Name ?? $"Tank {tank.Id}",
                        ["siteName"] = tank.Site?.Name ?? $"Site {tank.SiteId}",
                        ["closingValue"] = closingValue.ToString("F2"),
                        ["source"] = source,
                        ["date"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        ["dateDisplay"] = DateTime.UtcNow.ToString("dd MMM yyyy")
                    }
                };

                await eventEngine.ProcessAsync(systemEvent, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fire AutoClosingStockCreated event for Tank {TankId}", tank.Id);
            }
        }

        private static string BuildVarianceSkippedEmailHtml(
            Tank tank, decimal sensorValue, decimal expectedValue,
            decimal variance, decimal threshold, string source)
        {
            return $"<div style=\"font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.5\">" +
                   $"<p style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#b45309\">Auto-closing stock skipped — variance too high</p>" +
                   $"<p style=\"margin:0 0 12px 0\">The automated closing stock process could not close <strong>{System.Net.WebUtility.HtmlEncode(tank.Name)}</strong> because the variance between sensor/calculated value and expected stock exceeds the configured threshold. Manual closing is required.</p>" +
                   $"<table style=\"border-collapse:collapse;width:100%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb\">" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;width:180px\">Site</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(tank.Site?.Name ?? "Unknown")}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Tank</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(tank.Name)}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Data source</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(source)}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Sensor / calculated value</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{sensorValue:N2} L</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Expected (opening + txns)</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{expectedValue:N2} L</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;color:#dc2626\">Variance</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb;color:#dc2626;font-weight:600\">{variance:N2} L</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Threshold</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{threshold:N2} L</td></tr>" +
                   $"</table>" +
                   $"<p style=\"margin:12px 0 0 0;font-size:13px;color:#6b7280\">Please close this tank manually and investigate the stock discrepancy.</p>" +
                   $"</div>";
        }

        // ─── Configuration helpers ───

        private async Task<bool> IsEnabledAsync(GpsdataContext context)
        {
            var config = await context.SystemConfigurations
                .Where(c => c.ConfigurationKey == global::FMS.Application.Configuration.SystemConfiguration.DB_CONFIG_AUTO_CLOSING_STOCK_ENABLED_KEY)
                .Select(c => c.ConfigurationValue)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(config))
                return false; // Default OFF — must be explicitly enabled

            return string.Equals(config, "true", StringComparison.OrdinalIgnoreCase);
        }

        private async Task<TimeSpan> GetConfigTimeSpanAsync(string key, TimeSpan defaultValue)
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                var value = await context.SystemConfigurations
                    .Where(c => c.ConfigurationKey == key)
                    .Select(c => c.ConfigurationValue)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrEmpty(value) && TimeSpan.TryParse(value, out var parsed))
                    return parsed;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read config {Key}, using default {Default}", key, defaultValue);
            }
            return defaultValue;
        }

        private static async Task<decimal> GetConfigDecimalAsync(GpsdataContext context, string key, decimal defaultValue)
        {
            var value = await context.SystemConfigurations
                .Where(c => c.ConfigurationKey == key)
                .Select(c => c.ConfigurationValue)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(value) && decimal.TryParse(value, out var parsed))
                return parsed;

            return defaultValue;
        }

        private static async Task<int> GetConfigIntAsync(GpsdataContext context, string key, int defaultValue)
        {
            var value = await context.SystemConfigurations
                .Where(c => c.ConfigurationKey == key)
                .Select(c => c.ConfigurationValue)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(value) && int.TryParse(value, out var parsed))
                return parsed;

            return defaultValue;
        }

        // ─── Internal types ───

        private enum AutoCloseResult
        {
            Closed,
            SkippedVarianceTooHigh,
            SkippedNoOpening,
            SkippedAlreadyClosed
        }

        private record ClosingValueResult(decimal Value, string Source);
    }
}
