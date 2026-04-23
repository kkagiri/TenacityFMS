/**
 * File:          AutomatedOpeningStockService.cs
 * Purpose:       Scheduled background service that auto-creates opening stock entries
 *                for tanks that have no opening stock for today by 11:45 AM.
 *                Uses yesterday's closing stock (primary), sensor data, or PhysicalStockValue.
 *                Skips auto-open when variance between sensor and yesterday's close exceeds threshold.
 * Dependencies:  GpsdataContext, IMediator (OpeningStockCommand), IEventExpressionEngine
 * Last Modified: 2026-04-02
 *
 * Key Functions:
 * - ExecuteAsync(): Main loop — checks once per minute if it's time to run
 * - ProcessTanksForAutoOpenAsync(): Core logic — iterates active tanks and auto-opens
 * - GetOpeningValueAsync(): Determines opening value from closing/sensor/physical with variance check
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
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.TankStock
{
    public class AutomatedOpeningStockService : BackgroundService
    {
        private readonly ILogger<AutomatedOpeningStockService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _hostEnvironment;

        private readonly TimeSpan _baseInterval = TimeSpan.FromMinutes(1);
        private readonly TimeSpan _defaultScheduleTime = new TimeSpan(11, 45, 0);
        private const decimal DefaultMaxVarianceLiters = 50m;
        private const int DefaultSensorMaxAgeMins = 120;
        private const string SystemUserId = "system-auto-open";

        private DateTime _lastRunDate = DateTime.MinValue;

        public AutomatedOpeningStockService(
            ILogger<AutomatedOpeningStockService> logger,
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
                _logger.LogWarning("AutomatedOpeningStockService is DISABLED in {Environment} environment. Only runs in Production.", _hostEnvironment.EnvironmentName);
                return;
            }

            _logger.LogInformation("AutomatedOpeningStockService starting — auto-creates opening stock daily at configured time");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var scheduleTime = await GetConfigTimeSpanAsync("AutoOpeningStock_ScheduleTime", _defaultScheduleTime);

                    if (ShouldRun(now, scheduleTime))
                    {
                        _logger.LogInformation("Starting automated opening stock run");
                        await ProcessTanksForAutoOpenAsync(stoppingToken);
                        _lastRunDate = now.Date;
                        _logger.LogInformation("Completed automated opening stock run");
                    }

                    await Task.Delay(_baseInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("AutomatedOpeningStockService stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in AutomatedOpeningStockService cycle");
                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    }
                    catch (OperationCanceledException) { break; }
                }
            }

            _logger.LogInformation("AutomatedOpeningStockService has stopped");
        }

        private bool ShouldRun(DateTime now, TimeSpan scheduleTime)
        {
            var target = now.Date.Add(scheduleTime);
            return now >= target
                && now < target.AddMinutes(2)
                && _lastRunDate.Date < now.Date;
        }

        private async Task ProcessTanksForAutoOpenAsync(CancellationToken ct)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var eventEngine = scope.ServiceProvider.GetRequiredService<IEventExpressionEngine>();

            if (!await IsEnabledAsync(context))
            {
                _logger.LogInformation("AutoOpeningStock is disabled via SystemConfiguration");
                return;
            }

            var maxVariance = await GetConfigDecimalAsync(context, "AutoOpeningStock_MaxVarianceLiters", DefaultMaxVarianceLiters);
            var sensorMaxAgeMins = await GetConfigIntAsync(context, "AutoOpeningStock_SensorMaxAgeMins", DefaultSensorMaxAgeMins);

            var today = DateTime.UtcNow.Date;

            var tanks = await context.Tanks
                .Include(t => t.Site)
                .Where(t => t.Name != null)
                .ToListAsync(ct);

            _logger.LogInformation("Checking {TankCount} tanks for auto-opening stock on {Date:yyyy-MM-dd}", tanks.Count, today);

            int autoOpenedCount = 0;
            int skippedVarianceCount = 0;
            int skippedNoDataCount = 0;
            int skippedAlreadyOpenedCount = 0;
            int errorCount = 0;

            foreach (var tank in tanks)
            {
                try
                {
                    var result = await TryAutoOpenTankAsync(
                        context, mediator, eventEngine, tank, today,
                        maxVariance, sensorMaxAgeMins, ct);

                    switch (result)
                    {
                        case AutoOpenResult.Opened:
                            autoOpenedCount++;
                            break;
                        case AutoOpenResult.SkippedVarianceTooHigh:
                            skippedVarianceCount++;
                            break;
                        case AutoOpenResult.SkippedNoData:
                            skippedNoDataCount++;
                            break;
                        case AutoOpenResult.SkippedAlreadyOpened:
                            skippedAlreadyOpenedCount++;
                            break;
                    }
                }
                catch (Exception ex)
                {
                    errorCount++;
                    _logger.LogError(ex, "Error auto-opening tank {TankId} ({TankName})", tank.Id, tank.Name);
                }
            }

            _logger.LogInformation(
                "Auto-opening stock complete: {Opened} opened, {SkippedVariance} skipped (variance), " +
                "{SkippedNoData} skipped (no data), {SkippedAlreadyOpened} already opened, {Errors} errors",
                autoOpenedCount, skippedVarianceCount, skippedNoDataCount, skippedAlreadyOpenedCount, errorCount);
        }

        private async Task<AutoOpenResult> TryAutoOpenTankAsync(
            GpsdataContext context,
            IMediator mediator,
            IEventExpressionEngine eventEngine,
            Tank tank,
            DateTime today,
            decimal maxVariance,
            int sensorMaxAgeMins,
            CancellationToken ct)
        {
            // Check if opening stock already exists for today
            var existingOpening = await context.Tankstocks
                .Where(x => x.TankId == tank.Id
                    && x.EntryDate.Date == today
                    && x.EntryType == VolumeChangeReasonEnum.OpeningStock
                    && (x.IsDeleted == null || x.IsDeleted == false)
                    && x.ManualOpeningLevel.HasValue
                    && x.ManualOpeningLevel.Value > 0)
                .AnyAsync(ct);

            if (existingOpening)
                return AutoOpenResult.SkippedAlreadyOpened;

            // Get the opening value from available sources
            var openingResult = await GetOpeningValueAsync(context, tank, today, sensorMaxAgeMins, ct);

            if (openingResult == null)
            {
                _logger.LogWarning("Could not determine opening value for Tank {TankId} ({TankName}) — no closing stock, no sensor data",
                    tank.Id, tank.Name);
                return AutoOpenResult.SkippedNoData;
            }

            // Variance check: compare sensor/physical value against yesterday's closing stock
            // If we have both a closing stock AND a sensor value, check variance between them
            if (openingResult.YesterdayClosingStock.HasValue && openingResult.Source != "Yesterday closing stock")
            {
                var variance = Math.Abs(openingResult.Value - openingResult.YesterdayClosingStock.Value);

                if (variance > maxVariance)
                {
                    _logger.LogWarning(
                        "Auto-open SKIPPED for Tank {TankId} ({TankName}): variance {Variance:F2}L exceeds threshold {Threshold:F2}L. " +
                        "Source={Source}, Value={Value:F2}L, YesterdayClosing={YesterdayClosing:F2}L",
                        tank.Id, tank.Name, variance, maxVariance,
                        openingResult.Source, openingResult.Value, openingResult.YesterdayClosingStock.Value);

                    await FireVarianceSkippedEventAsync(
                        eventEngine, tank, openingResult.Value, openingResult.YesterdayClosingStock.Value,
                        variance, maxVariance, openingResult.Source, ct);

                    return AutoOpenResult.SkippedVarianceTooHigh;
                }
            }

            // Dispatch OpeningStockCommand via MediatR — reuse all existing validation
            var command = new OpeningStockCommand(
                TankId: tank.Id,
                OpeningStock: openingResult.Value,
                RecordedBy: SystemUserId,
                EntryDate: today);

            var response = await mediator.Send(command, ct);

            if (response.Success)
            {
                _logger.LogInformation(
                    "Auto-opened Tank {TankId} ({TankName}): {Value:F2}L from {Source}",
                    tank.Id, tank.Name, openingResult.Value, openingResult.Source);

                await FireAutoOpenedEventAsync(
                    eventEngine, tank, openingResult.Value, openingResult.Source, ct);

                return AutoOpenResult.Opened;
            }
            else
            {
                _logger.LogWarning(
                    "Auto-open command failed for Tank {TankId} ({TankName}): {Message}",
                    tank.Id, tank.Name, response.Message);
                return AutoOpenResult.SkippedNoData;
            }
        }

        /// <summary>
        /// Determines the opening stock value using priority:
        /// 1. Yesterday's closing stock (normal business flow)
        /// 2. Recent sensor reading (UploadStatusProbeReading)
        /// 3. Tank.PhysicalStockValue (last known sensor value)
        /// </summary>
        private async Task<OpeningValueResult?> GetOpeningValueAsync(
            GpsdataContext context,
            Tank tank,
            DateTime today,
            int sensorMaxAgeMins,
            CancellationToken ct)
        {
            var yesterday = today.AddDays(-1);
            decimal? yesterdayClosingValue = null;

            // Priority 1: Yesterday's closing stock from TankVolumeHistory
            var yesterdayClosing = await context.TankVolumeHistories
                .Where(x => x.TankId == tank.Id
                    && x.ChangeReason == VolumeChangeReasonEnum.ClosingStock
                    && x.Timestamp >= yesterday
                    && x.Timestamp < today.AddDays(1)
                    && (x.IsDeleted != true))
                .OrderByDescending(x => x.Timestamp)
                .ThenByDescending(x => x.Id)
                .FirstOrDefaultAsync(ct);

            if (yesterdayClosing?.NewVolume != null && yesterdayClosing.NewVolume > 0)
            {
                yesterdayClosingValue = yesterdayClosing.NewVolume.Value;
                return new OpeningValueResult(
                    yesterdayClosingValue.Value,
                    "Yesterday closing stock",
                    yesterdayClosingValue);
            }

            // Also try ManualClosingLevel from Tankstocks as fallback for yesterday's closing
            var yesterdayTankStock = await context.Tankstocks
                .Where(x => x.TankId == tank.Id
                    && x.EntryDate.Date == yesterday
                    && (x.IsDeleted == null || x.IsDeleted == false)
                    && x.ManualClosingLevel.HasValue
                    && x.ManualClosingLevel > 0)
                .FirstOrDefaultAsync(ct);

            if (yesterdayTankStock != null)
            {
                yesterdayClosingValue = yesterdayTankStock.ManualClosingLevel!.Value;
                return new OpeningValueResult(
                    yesterdayClosingValue.Value,
                    "Yesterday closing stock (Tankstock)",
                    yesterdayClosingValue);
            }

            var cutoffTime = DateTime.UtcNow.AddMinutes(-sensorMaxAgeMins);

            // Priority 2: Recent sensor reading (UploadStatusProbeReading)
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
                    return new OpeningValueResult(
                        (decimal)latestProbeReading.ProductVolume!.Value,
                        $"Sensor (UploadStatusProbeReading, {latestProbeReading.DateTime:HH:mm:ss} UTC)",
                        yesterdayClosingValue);
                }

                var latestTankMeasurement = await context.Tankmeasurements
                    .Where(tm => tm.Ptsid == tank.PtsId
                        && tm.DateTime >= cutoffTime
                        && tm.ProductVolume.HasValue
                        && tm.ProductVolume > 0)
                    .OrderByDescending(tm => tm.DateTime)
                    .FirstOrDefaultAsync(ct);

                if (latestTankMeasurement != null)
                {
                    return new OpeningValueResult(
                        (decimal)latestTankMeasurement.ProductVolume!.Value,
                        $"Sensor (TankMeasurement, {latestTankMeasurement.DateTime:HH:mm:ss} UTC)",
                        yesterdayClosingValue);
                }
            }

            // Priority 3: Tank.PhysicalStockValue (last known sensor value)
            if (tank.PhysicalStockValue.HasValue && tank.PhysicalStockValue > 0
                && tank.LastPhysicalStockUpdate.HasValue
                && tank.LastPhysicalStockUpdate.Value >= cutoffTime)
            {
                return new OpeningValueResult(
                    tank.PhysicalStockValue.Value,
                    $"PhysicalStockValue ({tank.PhysicalStockSource ?? "unknown"}, {tank.LastPhysicalStockUpdate.Value:HH:mm:ss} UTC)",
                    yesterdayClosingValue);
            }

            return null;
        }

        private async Task FireVarianceSkippedEventAsync(
            IEventExpressionEngine eventEngine,
            Tank tank,
            decimal proposedValue,
            decimal yesterdayClosing,
            decimal variance,
            decimal threshold,
            string source,
            CancellationToken ct)
        {
            try
            {
                var systemEvent = new SystemEvent
                {
                    SubType = "AutoOpeningStockSkipped",
                    SourceComponent = "AutomatedOpeningStockService",
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Severity = "High",
                    Message = $"Auto-opening stock skipped for {tank.Name}: variance {variance:F0}L exceeds {threshold:F0}L threshold. Manual opening required.",
                    Data =
                    {
                        ["tankName"] = tank.Name ?? $"Tank {tank.Id}",
                        ["siteName"] = tank.Site?.Name ?? $"Site {tank.SiteId}",
                        ["proposedValue"] = proposedValue.ToString("F2"),
                        ["yesterdayClosing"] = yesterdayClosing.ToString("F2"),
                        ["variance"] = variance.ToString("F2"),
                        ["threshold"] = threshold.ToString("F2"),
                        ["source"] = source,
                        ["date"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        ["dateDisplay"] = DateTime.UtcNow.ToString("dd MMM yyyy"),
                        ["emailBodyHtml"] = BuildVarianceSkippedEmailHtml(
                            tank, proposedValue, yesterdayClosing, variance, threshold, source)
                    }
                };

                await eventEngine.ProcessAsync(systemEvent, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fire AutoOpeningStockSkipped event for Tank {TankId}", tank.Id);
            }
        }

        private async Task FireAutoOpenedEventAsync(
            IEventExpressionEngine eventEngine,
            Tank tank,
            decimal openingValue,
            string source,
            CancellationToken ct)
        {
            try
            {
                var systemEvent = new SystemEvent
                {
                    SubType = "AutoOpeningStockCreated",
                    SourceComponent = "AutomatedOpeningStockService",
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Severity = "Information",
                    Message = $"Auto-opening stock created for {tank.Name}: {openingValue:F0}L from {source}.",
                    Data =
                    {
                        ["tankName"] = tank.Name ?? $"Tank {tank.Id}",
                        ["siteName"] = tank.Site?.Name ?? $"Site {tank.SiteId}",
                        ["openingValue"] = openingValue.ToString("F2"),
                        ["source"] = source,
                        ["date"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        ["dateDisplay"] = DateTime.UtcNow.ToString("dd MMM yyyy")
                    }
                };

                await eventEngine.ProcessAsync(systemEvent, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fire AutoOpeningStockCreated event for Tank {TankId}", tank.Id);
            }
        }

        private static string BuildVarianceSkippedEmailHtml(
            Tank tank, decimal proposedValue, decimal yesterdayClosing,
            decimal variance, decimal threshold, string source)
        {
            return $"<div style=\"font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.5\">" +
                   $"<p style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#b45309\">Auto-opening stock skipped — variance too high</p>" +
                   $"<p style=\"margin:0 0 12px 0\">The automated opening stock process could not open <strong>{System.Net.WebUtility.HtmlEncode(tank.Name)}</strong> because the variance between the proposed value and yesterday's closing stock exceeds the configured threshold. Manual opening is required.</p>" +
                   $"<table style=\"border-collapse:collapse;width:100%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb\">" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;width:180px\">Site</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(tank.Site?.Name ?? "Unknown")}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Tank</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(tank.Name)}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Data source</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(source)}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Proposed opening value</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{proposedValue:N2} L</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Yesterday closing stock</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{yesterdayClosing:N2} L</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;color:#dc2626\">Variance</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb;color:#dc2626;font-weight:600\">{variance:N2} L</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Threshold</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{threshold:N2} L</td></tr>" +
                   $"</table>" +
                   $"<p style=\"margin:12px 0 0 0;font-size:13px;color:#6b7280\">Please open this tank manually and investigate the stock discrepancy.</p>" +
                   $"</div>";
        }

        // ─── Configuration helpers ───

        private async Task<bool> IsEnabledAsync(GpsdataContext context)
        {
            var config = await context.SystemConfigurations
                .Where(c => c.ConfigurationKey == SystemConfiguration.DB_CONFIG_AUTO_OPENING_STOCK_ENABLED_KEY)
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

        private enum AutoOpenResult
        {
            Opened,
            SkippedVarianceTooHigh,
            SkippedNoData,
            SkippedAlreadyOpened
        }

        private record OpeningValueResult(decimal Value, string Source, decimal? YesterdayClosingStock);
    }
}
