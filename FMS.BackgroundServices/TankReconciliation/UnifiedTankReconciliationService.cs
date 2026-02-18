/**
 * File: UnifiedTankReconciliationService.cs
 * Purpose: Combined background service for all tank monitoring and reconciliation operations.
 * Dependencies: GpsdataContext, TankStockReconciliationService, AutomatedReconciliationService, ILogger
 * Last Modified: 2026-02-02
 *
 * Consolidates:
 * - TankMonitoringService (tank level monitoring, stale data detection)
 * - AutomatedReconciliationBackgroundService (policy-based reconciliation)
 * - DailyTankReconciliationService (FMS - aggregates TankVolumeHistory)
 * - DailyTankReconciliationService (TankManagement - TankStock vs TankVolumeHistory reconciliation)
 *
 * Execution Schedule:
 * - Tank level monitoring: Every 5 minutes
 * - Automated policy reconciliation: Every 15 minutes
 * - Daily reconciliation (aggregate TankVolumeHistory): 12:00 AM
 * - Daily reconciliation (TankStock vs TankVolumeHistory): 2:00 AM
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.AutomatedReconciliation.Services;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.TankManagement.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.TankReconciliation
{
    /// <summary>
    /// Unified background service for all tank monitoring and reconciliation operations.
    /// Combines TankMonitoringService, AutomatedReconciliationBackgroundService, and DailyTankReconciliationService.
    /// </summary>
    public class UnifiedTankReconciliationService : BackgroundService
    {
        private readonly ILogger<UnifiedTankReconciliationService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;

        // Processing intervals
        private readonly TimeSpan _baseInterval = TimeSpan.FromMinutes(1); // Base check interval
        private readonly TimeSpan _tankMonitoringInterval = TimeSpan.FromMinutes(5);
        private readonly TimeSpan _policyReconciliationInterval = TimeSpan.FromMinutes(15);

        // Daily reconciliation times
        private readonly TimeSpan _dailyAggregationTime = new TimeSpan(0, 0, 0); // 12:00 AM
        private readonly TimeSpan _dailyReconciliationTime = new TimeSpan(2, 0, 0); // 2:00 AM

        // Track last execution times
        private DateTime _lastTankMonitoring = DateTime.MinValue;
        private DateTime _lastPolicyReconciliation = DateTime.MinValue;
        private DateTime _lastDailyAggregation = DateTime.MinValue;
        private DateTime _lastDailyReconciliation = DateTime.MinValue;

        public UnifiedTankReconciliationService(
            ILogger<UnifiedTankReconciliationService> logger,
            IServiceScopeFactory serviceScopeFactory,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Unified Tank Reconciliation Service starting");
            _logger.LogInformation("Schedule: Tank Monitoring every {TankMonitor}min, Policy Reconciliation every {Policy}min, Daily Aggregation at {DailyAgg}, Daily Reconciliation at {DailyRecon}",
                _tankMonitoringInterval.TotalMinutes,
                _policyReconciliationInterval.TotalMinutes,
                _dailyAggregationTime,
                _dailyReconciliationTime);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;

                    // 1. Tank Level Monitoring (every 5 minutes)
                    if (DateTime.UtcNow - _lastTankMonitoring >= _tankMonitoringInterval)
                    {
                        await ExecuteTankMonitoringAsync(stoppingToken);
                        _lastTankMonitoring = DateTime.UtcNow;
                    }

                    // 2. Policy-based Reconciliation (every 15 minutes)
                    if (DateTime.UtcNow - _lastPolicyReconciliation >= _policyReconciliationInterval)
                    {
                        await ExecutePolicyReconciliationAsync(stoppingToken);
                        _lastPolicyReconciliation = DateTime.UtcNow;
                    }

                    // 3. Daily Aggregation at 12:00 AM (aggregate TankVolumeHistory into dailytankreconciliation)
                    if (ShouldRunDailyTask(now, _dailyAggregationTime, ref _lastDailyAggregation))
                    {
                        await ExecuteDailyAggregationAsync(stoppingToken);
                        _lastDailyAggregation = now.Date;
                    }

                    // 4. Daily Reconciliation at 2:00 AM (TankStock vs TankVolumeHistory)
                    if (ShouldRunDailyTask(now, _dailyReconciliationTime, ref _lastDailyReconciliation))
                    {
                        await ExecuteDailyReconciliationAsync(stoppingToken);
                        _lastDailyReconciliation = now.Date;
                    }

                    // Wait for base interval
                    await Task.Delay(_baseInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Unified Tank Reconciliation Service is stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Unified Tank Reconciliation Service cycle");

                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                }
            }

            _logger.LogInformation("Unified Tank Reconciliation Service has stopped");
        }

        private bool ShouldRunDailyTask(DateTime now, TimeSpan targetTime, ref DateTime lastRun)
        {
            var todayTarget = now.Date.Add(targetTime);

            // Check if we're within 1 minute of the target time and haven't run today
            if (now >= todayTarget && now < todayTarget.AddMinutes(2) && lastRun.Date < now.Date)
            {
                return true;
            }

            return false;
        }

        #region Tank Level Monitoring (from TankMonitoringService)

        private async Task ExecuteTankMonitoringAsync(CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("Starting tank level monitoring cycle");

                using var scope = _serviceScopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                var eventEngine = scope.ServiceProvider.GetService<IEventExpressionEngine>();

                var tanks = await context.Tanks
                    .Include(t => t.Site)
                    .Where(t => t.Name != null)
                    .ToListAsync(cancellationToken);

                foreach (var tank in tanks)
                {
                    await CheckSingleTankAsync(context, tank, eventEngine, cancellationToken);
                }

                _logger.LogDebug("Completed tank level monitoring for {TankCount} tanks", tanks.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in tank level monitoring");
            }
        }

        private async Task CheckSingleTankAsync(
            GpsdataContext context,
            Tank tank,
            IEventExpressionEngine? eventEngine,
            CancellationToken cancellationToken)
        {
            try
            {
                var latestMeasurement = await context.Tankmeasurements
                    .Where(tm => tm.TankId == tank.Id)
                    .OrderByDescending(tm => tm.DateTime)
                    .FirstOrDefaultAsync(cancellationToken);

                if (latestMeasurement == null)
                {
                    _logger.LogDebug("No measurements found for tank {TankId}", tank.Id);
                    return;
                }

                // Check if measurement is recent (within last hour)
                var measurementAge = DateTime.UtcNow - latestMeasurement.DateTime;
                if (measurementAge.TotalHours > 1)
                {
                    _logger.LogWarning("Tank {TankId} measurement is {Hours:F1} hours old", tank.Id, measurementAge.TotalHours);

                    // Fire SystemEvent for stale data detection
                    if (eventEngine != null)
                    {
                        var staleEvent = new SystemEvent
                        {
                            SiteId = tank.SiteId,
                            TankId = tank.Id,
                            Severity = measurementAge.TotalHours > 24 ? "High" : "Medium",
                            SubType = "StaleData",
                            SourceComponent = "TankMonitoring",
                            Message = $"Tank {tank.Name} measurement is {measurementAge.TotalHours:F1} hours old",
                        };
                        staleEvent.Data["MeasurementAgeHours"] = measurementAge.TotalHours;
                        staleEvent.Data["LastMeasurementTime"] = latestMeasurement.DateTime.ToString("yyyy-MM-dd HH:mm:ss");
                        await eventEngine.ProcessAsync(staleEvent, cancellationToken);
                    }
                    _logger.LogInformation("Stale data event detected for Tank {TankId}: last measurement {Hours:F1} hours ago",
                        tank.Id, measurementAge.TotalHours);
                }

                // Check for low/high volume alarms
                await CheckVolumeAlarmsAsync(tank, latestMeasurement, eventEngine, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking tank {TankId}", tank.Id);
            }
        }

        private async Task CheckVolumeAlarmsAsync(
            Tank tank,
            Tankmeasurement measurement,
            IEventExpressionEngine? eventEngine,
            CancellationToken cancellationToken)
        {
            try
            {
                var currentVolume = measurement.ProductVolume ?? 0;
                var tankCapacity = tank.TankVolume;
                var fillPercentage = tankCapacity > 0 ? (double)currentVolume / (double)tankCapacity * 100 : 0;

                // Check for low volume alarm (below 10%)
                if (fillPercentage < 10)
                {
                    if (eventEngine != null)
                    {
                        var lowEvent = new TankLevelEvent
                        {
                            SiteId = tank.SiteId,
                            TankId = tank.Id,
                            Severity = "High",
                            Message = $"Tank {tank.Name} low volume: {fillPercentage:F1}% ({currentVolume:N0}L of {tankCapacity:N0}L)",
                            TankName = tank.Name ?? "",
                            ProductVolume = (decimal)currentVolume,
                            TankCapacity = tankCapacity,
                            PercentageFull = (decimal)fillPercentage,
                            CurrentLevel = (decimal)currentVolume,
                        };
                        lowEvent.Data["AlarmType"] = "BackgroundLowVolume";
                        await eventEngine.ProcessAsync(lowEvent, cancellationToken);
                    }
                    _logger.LogWarning("Tank {TankId} ({TankName}) low volume: {FillPct:F1}% ({Volume:N0}L of {Capacity:N0}L)",
                        tank.Id, tank.Name, fillPercentage, currentVolume, tankCapacity);
                }
                // Check for high volume alarm (above 95%)
                else if (fillPercentage > 95)
                {
                    if (eventEngine != null)
                    {
                        var highEvent = new TankLevelEvent
                        {
                            SiteId = tank.SiteId,
                            TankId = tank.Id,
                            Severity = "Critical",
                            Message = $"Tank {tank.Name} high volume: {fillPercentage:F1}% ({currentVolume:N0}L of {tankCapacity:N0}L)",
                            TankName = tank.Name ?? "",
                            ProductVolume = (decimal)currentVolume,
                            TankCapacity = tankCapacity,
                            PercentageFull = (decimal)fillPercentage,
                            CurrentLevel = (decimal)currentVolume,
                        };
                        highEvent.Data["AlarmType"] = "BackgroundHighVolume";
                        await eventEngine.ProcessAsync(highEvent, cancellationToken);
                    }
                    _logger.LogWarning("Tank {TankId} ({TankName}) high volume: {FillPct:F1}% ({Volume:N0}L of {Capacity:N0}L)",
                        tank.Id, tank.Name, fillPercentage, currentVolume, tankCapacity);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking volume alarms for tank {TankId}", tank.Id);
            }
        }

        #endregion

        #region Policy-based Reconciliation (from AutomatedReconciliationBackgroundService)

        private async Task ExecutePolicyReconciliationAsync(CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("Starting automated policy reconciliation cycle");

                using var scope = _serviceScopeFactory.CreateScope();
                var automatedReconciliationService = scope.ServiceProvider.GetRequiredService<AutomatedReconciliationService>();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var cycleResult = await automatedReconciliationService.ExecuteReconciliationCycleAsync(cancellationToken);

                LogCycleResults(cycleResult);
                await SendSystemHealthNotificationIfNeeded(cycleResult, notificationService, cancellationToken);

                _logger.LogDebug("Completed automated policy reconciliation cycle");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in automated policy reconciliation");
            }
        }

        private void LogCycleResults(ReconciliationCycleResult result)
        {
            if (result.ProcessedPolicies == 0)
            {
                _logger.LogDebug("Cycle completed - no policies required execution");
                return;
            }

            var logLevel = result.FailedPolicies > 0 ? LogLevel.Warning : LogLevel.Information;

            _logger.Log(logLevel,
                "Reconciliation cycle: Duration: {Duration}ms, Processed: {Processed}, Successful: {Successful}, Failed: {Failed}",
                result.Duration.TotalMilliseconds, result.ProcessedPolicies, result.SuccessfulPolicies, result.FailedPolicies);

            if (result.FailedPolicies > 0)
            {
                foreach (var policyResult in result.PolicyResults.Where(p => !p.Success))
                {
                    _logger.LogWarning("Policy {PolicyId} failed: {Error}", policyResult.PolicyId, policyResult.ErrorMessage);
                }
            }

            var totalDiscrepanciesFound = result.PolicyResults.Sum(p => p.DiscrepanciesFound);
            var totalDiscrepanciesResolved = result.PolicyResults.Sum(p => p.DiscrepanciesResolved);

            if (totalDiscrepanciesFound > 0)
            {
                _logger.LogInformation("Total discrepancies found: {Found}, resolved: {Resolved}",
                    totalDiscrepanciesFound, totalDiscrepanciesResolved);
            }
        }

        private async Task SendSystemHealthNotificationIfNeeded(ReconciliationCycleResult result, INotificationService notificationService, CancellationToken cancellationToken)
        {
            try
            {
                var failureRate = result.ProcessedPolicies > 0 ? (double)result.FailedPolicies / result.ProcessedPolicies : 0;

                if (failureRate >= 0.5 && result.ProcessedPolicies > 0)
                {
                    var request = new CreateNotificationRequest
                    {
                        Type = NotificationType.Alert,
                        CategoryId = (int)WellKnownCategories.System,
                        Priority = NotificationPriority.High,
                        Title = "Reconciliation System Health Alert",
                        Message = $"High failure rate detected: {result.FailedPolicies}/{result.ProcessedPolicies} policies failed ({failureRate:P0})",
                        TriggerSource = "UnifiedTankReconciliation",
                        TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy
                    };

                    await notificationService.CreateNotificationAsync(request, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send system health notification");
            }
        }

        #endregion

        #region Daily Aggregation (from FMS/DailyTankReconciliationService - 12:00 AM)

        private async Task ExecuteDailyAggregationAsync(CancellationToken cancellationToken)
        {
            // Use UTC boundaries because backend dates are stored in UTC (see System.instructions.md)
            var reconciliationDate = DateTime.UtcNow.Date.AddDays(-1); // Process yesterday's data (UTC)
            var startTime = DateTime.UtcNow;
            var processedTanks = 0;
            var failedTanks = 0;

            try
            {
                _logger.LogInformation("Starting daily aggregation for date: {Date}", reconciliationDate);

                using var scope = _serviceScopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                var tanks = await context.Tanks
                    .Include(t => t.Site)
                    .Where(t => t.Name != null)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Processing aggregation for {TankCount} tanks", tanks.Count);

                foreach (var tank in tanks)
                {
                    try
                    {
                        await ProcessTankAggregationAsync(context, tank, reconciliationDate, cancellationToken);
                        processedTanks++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to process aggregation for tank {TankId} ({TankName})", tank.Id, tank.Name);
                        failedTanks++;
                    }
                }

                var duration = DateTime.UtcNow - startTime;

                if (failedTanks > 0)
                {
                    _logger.LogWarning("Daily aggregation completed with {FailedTanks} failures. {ProcessedTanks} tanks processed for {Date}. Duration: {Duration}",
                        failedTanks, processedTanks, reconciliationDate, duration);
                }

                _logger.LogInformation("Daily aggregation completed: {Processed} tanks processed, {Failed} failed, Duration: {Duration}",
                    processedTanks, failedTanks, duration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical error during daily aggregation process");
            }
        }

        private async Task ProcessTankAggregationAsync(
            GpsdataContext context,
            Tank tank,
            DateTime reconciliationDate,
            CancellationToken cancellationToken)
        {
            var startOfDayUtc = DateTime.SpecifyKind(reconciliationDate.Date, DateTimeKind.Utc);
            var startOfNextDayUtc = startOfDayUtc.AddDays(1);

            var existingRecord = await context.Dailytankreconciliations
                .FirstOrDefaultAsync(
                    dtr => dtr.TankId == tank.Id && dtr.ReconciliationDate >= startOfDayUtc && dtr.ReconciliationDate < startOfNextDayUtc,
                    cancellationToken);

            // Get opening/closing levels
            decimal? openingLevel = null;
            decimal? closingLevel = null;

            if (existingRecord != null)
            {
                openingLevel = existingRecord.OpeningLevel;
                closingLevel = existingRecord.ClosingLevel;
            }
            else
            {
                var previousDayRecord = await context.Dailytankreconciliations
                    .Where(dtr => dtr.TankId == tank.Id && dtr.ReconciliationDate >= startOfDayUtc.AddDays(-1) && dtr.ReconciliationDate < startOfDayUtc)
                    .FirstOrDefaultAsync(cancellationToken);

                if (previousDayRecord != null)
                {
                    openingLevel = previousDayRecord.ClosingLevel;
                }
                else
                {
                    var openingMeasurement = await context.Tankmeasurements
                        .Where(tm => tm.TankId == tank.Id && tm.DateTime < startOfDayUtc)
                        .OrderByDescending(tm => tm.DateTime)
                        .FirstOrDefaultAsync(cancellationToken);

                    openingLevel = openingMeasurement?.ProductVolume.HasValue == true ? (decimal)openingMeasurement.ProductVolume.Value : null;

                    // If there are no measurements before the start of the day, fall back to the first measurement within the day.
                    if (openingLevel == null)
                    {
                        var firstMeasurementWithinDay = await context.Tankmeasurements
                            .Where(tm => tm.TankId == tank.Id && tm.DateTime >= startOfDayUtc && tm.DateTime < startOfNextDayUtc)
                            .OrderBy(tm => tm.DateTime)
                            .FirstOrDefaultAsync(cancellationToken);

                        openingLevel = firstMeasurementWithinDay?.ProductVolume.HasValue == true ? (decimal)firstMeasurementWithinDay.ProductVolume.Value : null;
                    }
                }

                var closingMeasurement = await context.Tankmeasurements
                    .Where(tm => tm.TankId == tank.Id && tm.DateTime < startOfNextDayUtc)
                    .OrderByDescending(tm => tm.DateTime)
                    .FirstOrDefaultAsync(cancellationToken);

                closingLevel = closingMeasurement?.ProductVolume.HasValue == true ? (decimal?)closingMeasurement.ProductVolume : null;
            }

            // Ensure we never persist a NULL ClosingLevel (some environments have NOT NULL constraint in MySQL).
            // If there are no measurements during the day, treat the closing level as unchanged from opening.
            if (closingLevel == null && openingLevel != null)
            {
                closingLevel = openingLevel;
            }

            // If opening is missing but closing is known, align opening to closing.
            if (openingLevel == null && closingLevel != null)
            {
                openingLevel = closingLevel;
            }

            // Calculate totals from TankVolumeHistory
            var totalRefills = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id && td.CreatedOn >= startOfDayUtc && td.CreatedOn < startOfNextDayUtc && (td.ChangeReason == VolumeChangeReasonEnum.Dispensing || td.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing))
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            var totalDeliveries = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id && td.CreatedOn >= startOfDayUtc && td.CreatedOn < startOfNextDayUtc && td.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            var totalTransfersIn = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id && td.CreatedOn >= startOfDayUtc && td.CreatedOn < startOfNextDayUtc && td.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            var totalTransfersOut = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id && td.CreatedOn >= startOfDayUtc && td.CreatedOn < startOfNextDayUtc && td.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            // Create or update record
            if (existingRecord != null)
            {
                if (existingRecord.OpeningLevel == null && openingLevel != null) existingRecord.OpeningLevel = openingLevel;
                if (existingRecord.ClosingLevel == null && closingLevel != null) existingRecord.ClosingLevel = closingLevel;
                existingRecord.TotalRefills = totalRefills;
                existingRecord.TotalDeliveries = totalDeliveries;
                existingRecord.TotalTransfersIn = totalTransfersIn;
                existingRecord.TotalTransfersOut = totalTransfersOut;

                if (existingRecord.OpeningLevel == null)
                {
                    var fallbackOpeningLevel = existingRecord.ClosingLevel ?? closingLevel ?? 0m;
                    _logger.LogWarning(
                        "Daily aggregation fallback: OpeningLevel is NULL for TankId={TankId} on {Date}. Using fallback OpeningLevel={Fallback}.",
                        tank.Id,
                        startOfDayUtc,
                        fallbackOpeningLevel);

                    existingRecord.OpeningLevel = fallbackOpeningLevel;
                }

                if (existingRecord.ClosingLevel == null)
                {
                    var fallbackClosingLevel = existingRecord.OpeningLevel ?? 0m;
                    _logger.LogWarning(
                        "Daily aggregation fallback: ClosingLevel is NULL for TankId={TankId} on {Date}. Using fallback ClosingLevel={Fallback}.",
                        tank.Id,
                        startOfDayUtc,
                        fallbackClosingLevel);

                    existingRecord.ClosingLevel = fallbackClosingLevel;
                }
            }
            else
            {
                if (openingLevel == null)
                {
                    var fallbackOpeningLevel = closingLevel ?? 0m;
                    _logger.LogWarning(
                        "Daily aggregation fallback: OpeningLevel is NULL for TankId={TankId} on {Date}. Using fallback OpeningLevel={Fallback}.",
                        tank.Id,
                        startOfDayUtc,
                        fallbackOpeningLevel);

                    openingLevel = fallbackOpeningLevel;
                }

                if (closingLevel == null)
                {
                    var fallbackClosingLevel = openingLevel ?? 0m;
                    _logger.LogWarning(
                        "Daily aggregation fallback: ClosingLevel is NULL for TankId={TankId} on {Date}. Using fallback ClosingLevel={Fallback}.",
                        tank.Id,
                        startOfDayUtc,
                        fallbackClosingLevel);

                    closingLevel = fallbackClosingLevel;
                }

                var newRecord = new Dailytankreconciliation
                {
                    TankId = tank.Id,
                    ReconciliationDate = startOfDayUtc,
                    OpeningLevel = openingLevel,
                    ClosingLevel = closingLevel,
                    TotalRefills = totalRefills,
                    TotalDeliveries = totalDeliveries,
                    TotalTransfersIn = totalTransfersIn,
                    TotalTransfersOut = totalTransfersOut,
                    CreatedOn = DateTime.UtcNow
                };
                context.Dailytankreconciliations.Add(newRecord);
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        #endregion

        #region Daily Reconciliation (from TankManagement/DailyTankReconciliationService - 2:00 AM)

        private async Task ExecuteDailyReconciliationAsync(CancellationToken cancellationToken)
        {
            var yesterday = DateTime.Now.Date.AddDays(-1);

            try
            {
                _logger.LogInformation("Starting daily TankStock vs TankVolumeHistory reconciliation for {Date}", yesterday);

                using var scope = _serviceScopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                var reconciliationService = scope.ServiceProvider.GetRequiredService<TankStockReconciliationService>();

                // Get distinct tank IDs from Tankstock for yesterday
                var tankIds = await context.Tankstocks
                    .Where(ts => ts.EntryDate.Date == yesterday.Date && (ts.IsDeleted == null || ts.IsDeleted == false))
                    .Select(ts => ts.TankId)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Processing {Count} tanks for reconciliation", tankIds.Count);

                int totalDiscrepancies = 0;
                int totalFixed = 0;
                int tanksProcessed = 0;

                foreach (var tankId in tankIds)
                {
                    try
                    {
                        var reconciliation = await reconciliationService.ReconcileTankStockForDateAsync(tankId, yesterday);

                        if (reconciliation.DiscrepanciesFound > 0)
                        {
                            _logger.LogWarning("Tank {TankId}: Found {Count} discrepancies for {Date}", tankId, reconciliation.DiscrepanciesFound, yesterday);
                            totalDiscrepancies += reconciliation.DiscrepanciesFound;

                            var fixResult = await reconciliationService.FixDiscrepanciesAsync(reconciliation, "UNIFIED_RECONCILIATION_SERVICE");

                            if (fixResult.Status == "SUCCESS")
                            {
                                totalFixed += fixResult.RecordsFixed;
                                _logger.LogInformation("Tank {TankId}: Fixed {Count} records", tankId, fixResult.RecordsFixed);
                            }
                            else
                            {
                                _logger.LogError("Tank {TankId}: Failed to fix discrepancies - {Message}", tankId, fixResult.Message);
                            }
                        }

                        tanksProcessed++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error reconciling Tank {TankId} for {Date}", tankId, yesterday);
                    }
                }

                _logger.LogInformation("Daily reconciliation completed: Processed {TanksCount} tanks, Found {DiscrepancyCount} discrepancies, Fixed {FixedCount} records",
                    tanksProcessed, totalDiscrepancies, totalFixed);

                // Fix critically negative tanks
                try
                {
                    _logger.LogInformation("Starting critically negative tank detection and fix...");

                    var batchFixResult = await reconciliationService.FixCriticallyNegativeTanksAsync(
                        threshold: -1000, fixedBy: "UNIFIED_RECONCILIATION_SERVICE", cancellationToken: cancellationToken);

                    if (batchFixResult.TotalCriticalTanks > 0)
                    {
                        _logger.LogWarning("🚨 CRITICAL: Found {Count} tanks with critically negative stock. Fixed: {Fixed}",
                            batchFixResult.TotalCriticalTanks, batchFixResult.TanksFixed);
                    }
                    else
                    {
                        _logger.LogInformation("✅ No critically negative tanks detected");
                    }
                }
                catch (Exception criticalEx)
                {
                    _logger.LogError(criticalEx, "Error fixing critically negative tanks during daily reconciliation");
                }

                // Update DailyTankReconciliation table from TankStock
                await UpdateDailyReconciliationTableFromTankStockAsync(context, yesterday, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in daily TankStock reconciliation");
            }
        }

        private async Task UpdateDailyReconciliationTableFromTankStockAsync(GpsdataContext context, DateTime date, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Updating DailyTankReconciliation table from TankStock for {Date}", date);

                var tankStockData = await context.Tankstocks
                    .Where(ts => ts.EntryDate.Date == date && !ts.IsDeleted)
                    .Include(ts => ts.Tank)
                    .ToListAsync(cancellationToken);

                foreach (var tankStock in tankStockData)
                {
                    var openingLevel = tankStock.ManualOpeningLevel
                        ?? tankStock.SensorOpeningLevel
                        ?? tankStock.ManualClosingLevel
                        ?? tankStock.SensorClosingLevel;

                    var closingLevel = tankStock.ManualClosingLevel
                        ?? tankStock.SensorClosingLevel
                        ?? tankStock.ManualOpeningLevel
                        ?? tankStock.SensorOpeningLevel;

                    if (closingLevel == null && openingLevel != null)
                    {
                        closingLevel = openingLevel;
                    }

                    if (openingLevel == null && closingLevel != null)
                    {
                        openingLevel = closingLevel;
                    }

                    if (closingLevel == null)
                    {
                        closingLevel = 0m;
                        _logger.LogWarning(
                            "TankStock → DailyTankReconciliation fallback: ClosingLevel is NULL for TankId={TankId} on {Date}. Using ClosingLevel=0.",
                            tankStock.TankId,
                            date);
                    }

                    if (openingLevel == null)
                    {
                        openingLevel = closingLevel ?? 0m;
                        _logger.LogWarning(
                            "TankStock → DailyTankReconciliation fallback: OpeningLevel is NULL for TankId={TankId} on {Date}. Using OpeningLevel={OpeningLevel}.",
                            tankStock.TankId,
                            date,
                            openingLevel);
                    }

                    var existingReconciliation = await context.Dailytankreconciliations
                        .FirstOrDefaultAsync(r => r.TankId == tankStock.TankId && r.ReconciliationDate.Date == date, cancellationToken);

                    var totalRefills = await GetTotalRefillsForDateAsync(context, tankStock.TankId, date, cancellationToken);

                    if (existingReconciliation == null)
                    {
                        var reconciliation = new Dailytankreconciliation
                        {
                            TankId = tankStock.TankId,
                            ReconciliationDate = date,
                            CreatedOn = DateTime.UtcNow,
                            OpeningLevel = openingLevel,
                            ClosingLevel = closingLevel,
                            TotalDeliveries = tankStock.DeliveryAmount,
                            TotalTransfersIn = tankStock.TransferInAmount,
                            TotalTransfersOut = tankStock.TransferOutAmount,
                            TotalRefills = totalRefills
                        };
                        await context.Dailytankreconciliations.AddAsync(reconciliation, cancellationToken);
                    }
                    else
                    {
                        existingReconciliation.OpeningLevel = openingLevel;
                        existingReconciliation.ClosingLevel = closingLevel;
                        existingReconciliation.TotalDeliveries = tankStock.DeliveryAmount;
                        existingReconciliation.TotalTransfersIn = tankStock.TransferInAmount;
                        existingReconciliation.TotalTransfersOut = tankStock.TransferOutAmount;
                        existingReconciliation.TotalRefills = totalRefills;
                    }
                }

                await context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("DailyTankReconciliation table updated from TankStock for {Date}", date);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating DailyTankReconciliation table from TankStock for {Date}", date);
            }
        }

        private async Task<decimal?> GetTotalRefillsForDateAsync(GpsdataContext context, int tankId, DateTime date, CancellationToken cancellationToken)
        {
            try
            {
                var total = await context.FuelRefills
                    .Where(fr => fr.TankId == tankId && fr.Date.HasValue && fr.Date.Value.Date == date && !fr.IsDeleted)
                    .SumAsync(fr => fr.ManualFuelrefillAmount ?? 0, cancellationToken);

                return total > 0 ? total : null;
            }
            catch
            {
                return null;
            }
        }

        #endregion

        #region Helpers

        // Placeholder for future EventExpressionEngine integration

        #endregion

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Unified Tank Reconciliation Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
