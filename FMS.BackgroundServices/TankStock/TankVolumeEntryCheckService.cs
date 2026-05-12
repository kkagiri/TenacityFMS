/**
 * File: TankVolumeEntryCheckService.cs
 * Purpose: Scheduled background service that checks all active tanks for missing
 *          volume history entries (opening/closing stock) and fires SystemEvents
 *          through the EventExpressionEngine to trigger notifications.
 * Dependencies: GpsdataContext, IEventExpressionEngine, ILogger
 * Last Modified: 2026-02-17
 *
 * Schedule: Runs daily at 10:00 AM (configurable via SystemConfiguration key
 *           "TankVolumeEntryCheck_ScheduleTime"). Checks yesterday's data.
 *
 * Flow:
 * 1. Query all active tanks with their sites
 * 2. For each tank, check if OpeningStock / ClosingStock entries exist for yesterday
 * 3. For each tank with missing entries, fire a SystemEvent with SubType="NoTankStockEntry"
 * 4. The EventExpressionEngine matches the event against user-created expressions
 *    and delivers notifications via the linked policy
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Configuration;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.TankStock
{
    /// <summary>
    /// Daily background service that detects tanks with missing volume entries
    /// and fires SystemEvents through the event expression engine.
    /// </summary>
    public class TankVolumeEntryCheckService : BackgroundService
    {
        private readonly ILogger<TankVolumeEntryCheckService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;

        // Base loop interval — the service checks once per minute whether it's time to run
        private readonly TimeSpan _baseInterval = TimeSpan.FromMinutes(1);

        // Default daily check time (10:00 AM local)
        private readonly TimeSpan _defaultCheckTime = new TimeSpan(10, 0, 0);

        // Track last execution date to avoid re-running on the same day
        private DateTime _lastCheckDate = DateTime.MinValue;

        public TankVolumeEntryCheckService(
            ILogger<TankVolumeEntryCheckService> logger,
            IServiceScopeFactory serviceScopeFactory,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("TankVolumeEntryCheckService starting — checks daily for missing tank stock entries");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var checkTime = await GetScheduledCheckTimeAsync();

                    if (ShouldRunCheck(now, checkTime))
                    {
                        _logger.LogInformation("Starting daily missing tank stock entry check");
                        await RunMissingEntryCheckAsync(stoppingToken);
                        _lastCheckDate = now.Date;
                        _logger.LogInformation("Completed daily missing tank stock entry check");
                    }

                    await Task.Delay(_baseInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("TankVolumeEntryCheckService stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in TankVolumeEntryCheckService cycle");

                    try
                    {
                        // Wait before retry to avoid tight error loops
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                }
            }

            _logger.LogInformation("TankVolumeEntryCheckService has stopped");
        }

        /// <summary>
        /// Determines if the daily check should run now.
        /// </summary>
        private bool ShouldRunCheck(DateTime now, TimeSpan checkTime)
        {
            var todayTarget = now.Date.Add(checkTime);

            // Run if we're within 2 minutes of the target time and haven't run today
            return now >= todayTarget
                && now < todayTarget.AddMinutes(2)
                && _lastCheckDate.Date < now.Date;
        }

        /// <summary>
        /// Gets the configured check time from SystemConfiguration, or uses default 10:00.
        /// </summary>
        private async Task<TimeSpan> GetScheduledCheckTimeAsync()
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                var configValue = await context.SystemConfigurations
                    .Where(c => c.ConfigurationKey == global::FMS.Application.Configuration.SystemConfiguration.DB_CONFIG_TANK_VOLUME_ENTRY_CHECK_SCHEDULE_TIME_KEY)
                    .Select(c => c.ConfigurationValue)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrEmpty(configValue) && TimeSpan.TryParse(configValue, out var parsed))
                {
                    return parsed;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read {ConfigurationKey} config, using default 10:00", global::FMS.Application.Configuration.SystemConfiguration.DB_CONFIG_TANK_VOLUME_ENTRY_CHECK_SCHEDULE_TIME_KEY);
            }

            return _defaultCheckTime;
        }

        /// <summary>
        /// Checks whether the service is enabled via SystemConfiguration.
        /// </summary>
        private async Task<bool> IsEnabledAsync(GpsdataContext context)
        {
            var enabledConfig = await context.SystemConfigurations
                .Where(c => c.ConfigurationKey == global::FMS.Application.Configuration.SystemConfiguration.DB_CONFIG_TANK_VOLUME_ENTRY_CHECK_ENABLED_KEY)
                .Select(c => c.ConfigurationValue)
                .FirstOrDefaultAsync();

            // Default to enabled if no config exists
            if (string.IsNullOrEmpty(enabledConfig))
                return true;

            return string.Equals(enabledConfig, "true", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Core logic: find tanks with missing entries and fire events through the engine.
        /// </summary>
        private async Task RunMissingEntryCheckAsync(CancellationToken ct)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            var eventEngine = scope.ServiceProvider.GetRequiredService<IEventExpressionEngine>();

            // Check if feature is enabled
            if (!await IsEnabledAsync(context))
            {
                _logger.LogInformation("TankVolumeEntryCheck is disabled via SystemConfiguration");
                return;
            }

            // Yesterday in UTC
            var yesterday = DateTime.UtcNow.Date.AddDays(-1);

            // Get all active tanks with their sites
            var tanks = await context.Tanks
                .Include(t => t.Site)
                .Where(t => t.Name != null)
                .ToListAsync(ct);

            _logger.LogInformation("Checking {TankCount} tanks for missing entries on {Date:yyyy-MM-dd}",
                tanks.Count, yesterday);

            var missingEntries = new List<MissingTankVolumeEntryDto>();
            int eventsProcessed = 0;

            foreach (var tank in tanks)
            {
                try
                {
                    var missing = await CheckTankForMissingEntriesAsync(context, tank, yesterday, ct);
                    if (missing != null)
                    {
                        missingEntries.Add(missing);

                        // Fire SystemEvent through the event engine
                        var result = await FireMissingEntryEventAsync(eventEngine, missing, ct);
                        if (result)
                        {
                            eventsProcessed++;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking tank {TankId} ({TankName}) for missing entries",
                        tank.Id, tank.Name);
                }
            }

            _logger.LogInformation(
                "Missing entry check complete: {MissingCount} tanks with missing entries, {EventsProcessed} events processed",
                missingEntries.Count, eventsProcessed);
        }

        /// <summary>
        /// Checks a single tank for missing OpeningStock and ClosingStock entries on the given date.
        /// </summary>
        private async Task<MissingTankVolumeEntryDto?> CheckTankForMissingEntriesAsync(
            GpsdataContext context,
            Tank tank,
            DateTime checkDate,
            CancellationToken ct)
        {
            // Date range for the check date (full day in UTC)
            var dayStart = checkDate.Date;
            var dayEnd = dayStart.AddDays(1);

            // Get all volume history entries for this tank on the check date
            var entries = await context.TankVolumeHistories
                .Where(h => h.TankId == tank.Id
                    && h.Timestamp >= dayStart
                    && h.Timestamp < dayEnd
                    && (h.IsDeleted == null || h.IsDeleted == false))
                .Select(h => h.ChangeReason)
                .ToListAsync(ct);

            var hasOpening = entries.Contains(VolumeChangeReasonEnum.OpeningStock);
            var hasClosing = entries.Contains(VolumeChangeReasonEnum.ClosingStock);

            // If both exist, nothing is missing
            if (hasOpening && hasClosing)
                return null;

            // Get last entry date for context
            var lastEntryDate = await context.TankVolumeHistories
                .Where(h => h.TankId == tank.Id
                    && h.Timestamp < dayEnd
                    && (h.IsDeleted == null || h.IsDeleted == false))
                .OrderByDescending(h => h.Timestamp)
                .Select(h => (DateTime?)h.Timestamp)
                .FirstOrDefaultAsync(ct);

            return new MissingTankVolumeEntryDto
            {
                TankId = tank.Id,
                TankName = tank.Name ?? $"Tank {tank.Id}",
                SiteId = tank.SiteId,
                SiteName = tank.Site?.Name ?? $"Site {tank.SiteId}",
                MissingOpeningStock = !hasOpening,
                MissingClosingStock = !hasClosing,
                CheckDate = checkDate,
                LastEntryDate = lastEntryDate
            };
        }

        /// <summary>
        /// Fires a SystemEvent through the event expression engine for a tank with missing entries.
        /// </summary>
        private async Task<bool> FireMissingEntryEventAsync(
            IEventExpressionEngine eventEngine,
            MissingTankVolumeEntryDto missing,
            CancellationToken ct)
        {
            try
            {
                var systemEvent = new SystemEvent
                {
                    SubType = "NoTankStockEntry",
                    SourceComponent = "TankVolumeEntryCheckService",
                    SiteId = missing.SiteId,
                    TankId = missing.TankId,
                    Severity = "Medium",
                    Message = BuildInAppMessage(missing),
                    Data =
                    {
                        ["missingEntryType"] = missing.MissingEntryType,
                        ["missingEntryLabel"] = FormatMissingEntryLabel(missing),
                        ["tankName"] = missing.TankName,
                        ["siteName"] = missing.SiteName,
                        ["checkDate"] = missing.CheckDate.ToString("yyyy-MM-dd"),
                        ["checkDateDisplay"] = missing.CheckDate.ToString("dd MMM yyyy"),
                        ["lastEntryDate"] = missing.LastEntryDate?.ToString("yyyy-MM-dd") ?? "Never",
                        ["lastEntryDateDisplay"] = missing.LastEntryDate?.ToString("dd MMM yyyy") ?? "No previous entry recorded",
                        ["missingOpeningStock"] = missing.MissingOpeningStock.ToString(),
                        ["missingClosingStock"] = missing.MissingClosingStock.ToString(),
                        ["emailBodyHtml"] = BuildEmailBodyHtml(missing)
                    }
                };

                var result = await eventEngine.ProcessAsync(systemEvent, ct);

                if (result.TriggeredCount > 0)
                {
                    _logger.LogInformation(
                        "NoTankStockEntry event triggered {Count} expression(s) for Tank {TankId} ({TankName}) at Site {SiteId}",
                        result.TriggeredCount, missing.TankId, missing.TankName, missing.SiteId);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to fire NoTankStockEntry event for Tank {TankId} ({TankName})",
                    missing.TankId, missing.TankName);
                return false;
            }
        }

        /// <summary>
        /// Builds a concise in-app notification message for the missing entry.
        /// </summary>
        private static string BuildInAppMessage(MissingTankVolumeEntryDto missing)
        {
            return $"Missing {FormatMissingEntryLabel(missing)} entry for {missing.TankName} on {missing.CheckDate:dd MMM yyyy}.";
        }

        private static string BuildEmailBodyHtml(MissingTankVolumeEntryDto missing)
        {
            var missingEntryLabel = FormatMissingEntryLabel(missing);
            var lastEntryDisplay = FormatLastEntryDisplay(missing);

            return $"<div style=\"font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.5\">" +
                   $"<p style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#b45309\">Missing {missingEntryLabel} tank stock entry</p>" +
                   $"<table style=\"border-collapse:collapse;width:100%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb\">" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;width:180px\">Site</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(missing.SiteName)}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Tank</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(missing.TankName)}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Business date</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{missing.CheckDate:dd MMM yyyy}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Missing entry</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(missingEntryLabel)}</td></tr>" +
                   $"<tr><td style=\"padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb\">Last recorded entry</td><td style=\"padding:10px 12px;border:1px solid #e5e7eb\">{System.Net.WebUtility.HtmlEncode(lastEntryDisplay)}</td></tr>" +
                   $"</table>" +
                   $"<p style=\"margin:12px 0 0 0;font-size:13px;color:#6b7280\">Please capture the missing tank stock entry to keep stock reconciliation accurate.</p>" +
                   $"</div>";
        }

        private static string FormatMissingEntryLabel(MissingTankVolumeEntryDto missing)
        {
            return missing.MissingEntryType switch
            {
                "Both" => "opening and closing",
                "OpeningStock" => "opening",
                "ClosingStock" => "closing",
                _ => "required"
            };
        }

        private static string FormatLastEntryDisplay(MissingTankVolumeEntryDto missing)
        {
            return missing.LastEntryDate?.ToString("dd MMM yyyy") ?? "No previous entry recorded";
        }
    }
}
