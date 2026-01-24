/**
 * File: UnifiedTankReconciliationService.cs
 * Purpose: Combined background service for all tank monitoring and reconciliation operations.
 * Dependencies: GpsdataContext, IAlarmHandlerService, AlarmHandlerActiveAlarmIntegration,
 *               TankStockReconciliationService, AutomatedReconciliationService, ILogger
 * Last Modified: 2026-01-24
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
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.Integration;
using FMS.Application.Features.TankManagement.Services;
using FMS.Application.Services;
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
                var alarmHandlerService = scope.ServiceProvider.GetRequiredService<IAlarmHandlerService>();
                var activeAlarmIntegration = scope.ServiceProvider.GetRequiredService<AlarmHandlerActiveAlarmIntegration>();

                var tanks = await context.Tanks
                    .Include(t => t.Site)
                    .Where(t => t.Name != null)
                    .ToListAsync(cancellationToken);

                foreach (var tank in tanks)
                {
                    await CheckSingleTankAsync(context, activeAlarmIntegration, tank, cancellationToken);
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
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
            Tank tank,
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

                    await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert(
                        0, "StaleDataAlarm",
                        $"Tank {tank.Name} has stale data - last measurement {measurementAge.TotalHours:F1} hours ago",
                        "Medium", tank.SiteId, tank.Id, tank.PtsId, "UnifiedTankReconciliation-System",
                        new { LastMeasurementTime = latestMeasurement.DateTime, HoursOld = measurementAge.TotalHours },
                        cancellationToken);
                }

                // Check for low/high volume alarms
                await CheckVolumeAlarmsAsync(tank, latestMeasurement, activeAlarmIntegration, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking tank {TankId}", tank.Id);
            }
        }

        private async Task CheckVolumeAlarmsAsync(
            Tank tank,
            Tankmeasurement measurement,
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
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
                    await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert(
                        0, "LowVolumeAlarm",
                        $"Tank {tank.Name} is at {fillPercentage:F1}% capacity ({currentVolume:N0}L of {tankCapacity:N0}L)",
                        "High", tank.SiteId, tank.Id, tank.PtsId, "UnifiedTankReconciliation-System",
                        new { CurrentVolume = currentVolume, TankCapacity = tankCapacity, FillPercentage = fillPercentage },
                        cancellationToken);
                }
                // Check for high volume alarm (above 95%)
                else if (fillPercentage > 95)
                {
                    await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert(
                        0, "HighVolumeAlarm",
                        $"Tank {tank.Name} is at {fillPercentage:F1}% capacity ({currentVolume:N0}L of {tankCapacity:N0}L)",
                        "Medium", tank.SiteId, tank.Id, tank.PtsId, "UnifiedTankReconciliation-System",
                        new { CurrentVolume = currentVolume, TankCapacity = tankCapacity, FillPercentage = fillPercentage },
                        cancellationToken);
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
            var reconciliationDate = DateTime.Today.AddDays(-1); // Process yesterday's data
            var startTime = DateTime.UtcNow;
            var processedTanks = 0;
            var failedTanks = 0;

            try
            {
                _logger.LogInformation("Starting daily aggregation for date: {Date}", reconciliationDate);

                using var scope = _serviceScopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                var activeAlarmIntegration = scope.ServiceProvider.GetRequiredService<AlarmHandlerActiveAlarmIntegration>();

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

                await CreateReconciliationAlarmAsync(activeAlarmIntegration, reconciliationDate, processedTanks, failedTanks, duration, "DailyAggregation", cancellationToken);

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
            var startOfDay = reconciliationDate.Date;
            var endOfDay = startOfDay.AddDays(1).AddSeconds(-1);

            var existingRecord = await context.Dailytankreconciliations
                .FirstOrDefaultAsync(dtr => dtr.TankId == tank.Id && dtr.ReconciliationDate.Date == reconciliationDate.Date, cancellationToken);

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
                    .Where(dtr => dtr.TankId == tank.Id && dtr.ReconciliationDate.Date == reconciliationDate.AddDays(-1).Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (previousDayRecord != null)
                {
                    openingLevel = previousDayRecord.ClosingLevel;
                }
                else
                {
                    var openingMeasurement = await context.Tankmeasurements
                        .Where(tm => tm.TankId == tank.Id && tm.DateTime <= startOfDay)
                        .OrderByDescending(tm => tm.DateTime)
                        .FirstOrDefaultAsync(cancellationToken);

                    openingLevel = openingMeasurement?.ProductVolume.HasValue == true ? (decimal)openingMeasurement.ProductVolume.Value : null;
                }

                var closingMeasurement = await context.Tankmeasurements
                    .Where(tm => tm.TankId == tank.Id && tm.DateTime >= startOfDay && tm.DateTime <= endOfDay)
                    .OrderByDescending(tm => tm.DateTime)
                    .FirstOrDefaultAsync(cancellationToken);

                closingLevel = closingMeasurement?.ProductVolume.HasValue == true ? (decimal?)closingMeasurement.ProductVolume : null;
            }

            // Calculate totals from TankVolumeHistory
            var totalRefills = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id && td.CreatedOn >= startOfDay && td.CreatedOn <= endOfDay && td.ChangeReason == VolumeChangeReasonEnum.Dispensing)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            var totalDeliveries = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id && td.CreatedOn >= startOfDay && td.CreatedOn <= endOfDay && td.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            var totalTransfersIn = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id && td.CreatedOn >= startOfDay && td.CreatedOn <= endOfDay && td.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            var totalTransfersOut = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id && td.CreatedOn >= startOfDay && td.CreatedOn <= endOfDay && td.ChangeReason == VolumeChangeReasonEnum.TransferOut)
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
            }
            else
            {
                var newRecord = new Dailytankreconciliation
                {
                    TankId = tank.Id,
                    ReconciliationDate = reconciliationDate,
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
                            OpeningLevel = tankStock.ManualOpeningLevel,
                            ClosingLevel = tankStock.ManualClosingLevel,
                            TotalDeliveries = tankStock.DeliveryAmount,
                            TotalTransfersIn = tankStock.TransferInAmount,
                            TotalTransfersOut = tankStock.TransferOutAmount,
                            TotalRefills = totalRefills
                        };
                        await context.Dailytankreconciliations.AddAsync(reconciliation, cancellationToken);
                    }
                    else
                    {
                        existingReconciliation.OpeningLevel = tankStock.ManualOpeningLevel;
                        existingReconciliation.ClosingLevel = tankStock.ManualClosingLevel;
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

        #region Alarm Helpers

        private async Task CreateReconciliationAlarmAsync(
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
            DateTime reconciliationDate,
            int processedTanks,
            int failedTanks,
            TimeSpan duration,
            string operation,
            CancellationToken cancellationToken)
        {
            try
            {
                var severity = failedTanks > 0 ? "Medium" : "Low";
                var message = failedTanks > 0
                    ? $"{operation} completed with {failedTanks} failures. {processedTanks} tanks processed for {reconciliationDate:yyyy-MM-dd}. Duration: {duration.TotalSeconds:F1}s"
                    : $"{operation} completed successfully. {processedTanks} tanks processed for {reconciliationDate:yyyy-MM-dd}. Duration: {duration.TotalSeconds:F1}s";

                await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert(
                    0, $"{operation}Completed", message, severity,
                    null, null, null, "UnifiedTankReconciliation-System",
                    new { ReconciliationDate = reconciliationDate, ProcessedTanks = processedTanks, FailedTanks = failedTanks, DurationSeconds = duration.TotalSeconds },
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create reconciliation alarm notification");
            }
        }

        #endregion

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Unified Tank Reconciliation Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
