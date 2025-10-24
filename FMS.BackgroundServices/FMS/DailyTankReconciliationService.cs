/**
 * File: DailyTankReconciliationService.cs
 * Purpose: Background service that processes daily tank stock reconciliation at 12:00 AM
 * Location: FMS.BackgroundServices/FMS/
 * Dependencies: GpsdataContext, AlarmHandlerActiveAlarmIntegration, ILogger
 * Last Modified: 2025-10-23
 *
 * Key Functions:
 * - ExecuteAsync(): Main background service loop
 * - ProcessDailyReconciliationAsync(): Processes reconciliation for all tanks
 * - CalculateTankMetricsAsync(): Calculates refills, deliveries, transfers from tankdeliveries
 * - GetOpeningClosingLevels(): Gets opening/closing from existing reconciliation or measurements
 * - CreateReconciliationAlarmAsync(): Creates success/failure alarm notifications
 *
 * Note: This service processes data that's already in tankdeliveries table
 * It aggregates the data and ensures dailytankreconciliation records are complete
 */

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Services.Integration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FMS
{
    /// <summary>
    /// Background service that runs daily at 12:00 AM to process tank stock reconciliation
    /// Aggregates data from tankdeliveries table and creates/updates dailytankreconciliation records
    /// Creates alarm notifications upon completion
    ///
    /// This mirrors the Python script logic but runs automatically on a schedule
    /// </summary>
    public class DailyTankReconciliationService : BackgroundService
    {
        private readonly ILogger<DailyTankReconciliationService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly TimeSpan _targetExecutionTime = new TimeSpan(0, 0, 0); // 12:00 AM

        public DailyTankReconciliationService(
            ILogger<DailyTankReconciliationService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Daily Tank Reconciliation Service starting - will run daily at 12:00 AM");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var nextRun = CalculateNextRunTime(now);
                    var delay = nextRun - now;

                    _logger.LogInformation("Next reconciliation scheduled for: {NextRun} (in {Hours}h {Minutes}m)",
                        nextRun, delay.Hours, delay.Minutes);

                    // Wait until next scheduled time
                    await Task.Delay(delay, stoppingToken);

                    // Execute reconciliation
                    using var scope = _serviceScopeFactory.CreateScope();
                    await ProcessDailyReconciliationAsync(scope, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Daily Tank Reconciliation Service is stopping due to cancellation");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Daily Tank Reconciliation Service cycle");

                    // Wait 1 hour before retrying on error
                    try
                    {
                        await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                }
            }

            _logger.LogInformation("Daily Tank Reconciliation Service has stopped");
        }

        private DateTime CalculateNextRunTime(DateTime currentTime)
        {
            var today = currentTime.Date;
            var scheduledToday = today.Add(_targetExecutionTime);

            // If we've passed today's execution time, schedule for tomorrow
            if (currentTime >= scheduledToday)
            {
                return scheduledToday.AddDays(1);
            }

            return scheduledToday;
        }

        private async Task ProcessDailyReconciliationAsync(
            IServiceScope scope,
            CancellationToken cancellationToken)
        {
            var startTime = DateTime.UtcNow;
            var reconciliationDate = DateTime.Today.AddDays(-1); // Process yesterday's data
            var processedTanks = 0;
            var failedTanks = 0;

            try
            {
                _logger.LogInformation("Starting daily reconciliation for date: {Date}", reconciliationDate);

                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                var activeAlarmIntegration = scope.ServiceProvider.GetRequiredService<AlarmHandlerActiveAlarmIntegration>();

                // Get all active tanks
                var tanks = await context.Tanks
                    .Include(t => t.Site)
                    .Where(t => t.Name != null)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Processing reconciliation for {TankCount} tanks", tanks.Count);

                foreach (var tank in tanks)
                {
                    try
                    {
                        await ProcessSingleTankReconciliationAsync(
                            context,
                            tank,
                            reconciliationDate,
                            cancellationToken);

                        processedTanks++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to process reconciliation for tank {TankId} ({TankName})",
                            tank.Id, tank.Name);
                        failedTanks++;
                    }
                }

                var duration = DateTime.UtcNow - startTime;

                // Create success alarm notification
                await CreateReconciliationAlarmAsync(
                    activeAlarmIntegration,
                    reconciliationDate,
                    processedTanks,
                    failedTanks,
                    duration,
                    cancellationToken);

                _logger.LogInformation(
                    "Daily reconciliation completed: {Processed} tanks processed, {Failed} failed, Duration: {Duration}",
                    processedTanks, failedTanks, duration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical error during daily reconciliation process");

                // Create failure alarm
                var activeAlarmIntegration = scope.ServiceProvider.GetRequiredService<AlarmHandlerActiveAlarmIntegration>();
                await CreateFailureAlarmAsync(
                    activeAlarmIntegration,
                    reconciliationDate,
                    ex.Message,
                    cancellationToken);
            }
        }

        private async Task ProcessSingleTankReconciliationAsync(
            GpsdataContext context,
            Tank tank,
            DateTime reconciliationDate,
            CancellationToken cancellationToken)
        {
            var startOfDay = reconciliationDate.Date;
            var endOfDay = startOfDay.AddDays(1).AddSeconds(-1);

            // Check if reconciliation record already exists for this date
            var existingRecord = await context.Dailytankreconciliations
                .FirstOrDefaultAsync(dtr => dtr.TankId == tank.Id &&
                                           dtr.ReconciliationDate.Date == reconciliationDate.Date,
                                           cancellationToken);

            // Get opening and closing levels
            // Priority: Existing reconciliation data > Previous day's closing > Tank measurements
            decimal? openingLevel = null;
            decimal? closingLevel = null;

            if (existingRecord != null)
            {
                // Use existing opening/closing if available
                openingLevel = existingRecord.OpeningLevel;
                closingLevel = existingRecord.ClosingLevel;
            }
            else
            {
                // Try to get opening from previous day's closing
                var previousDayRecord = await context.Dailytankreconciliations
                    .Where(dtr => dtr.TankId == tank.Id &&
                                 dtr.ReconciliationDate.Date == reconciliationDate.AddDays(-1).Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (previousDayRecord != null)
                {
                    openingLevel = previousDayRecord.ClosingLevel;
                }
                else
                {
                    // Fallback to tank measurements if available
                    var openingMeasurement = await context.Tankmeasurements
                        .Where(tm => tm.TankId == tank.Id && tm.DateTime <= startOfDay)
                        .OrderByDescending(tm => tm.DateTime)
                        .FirstOrDefaultAsync(cancellationToken);

                    openingLevel = (decimal)openingMeasurement?.ProductVolume.Value;
                }

                // Try to get closing level from measurements or keep as null for manual entry
                var closingMeasurement = await context.Tankmeasurements
                    .Where(tm => tm.TankId == tank.Id &&
                                tm.DateTime >= startOfDay &&
                                tm.DateTime <= endOfDay)
                    .OrderByDescending(tm => tm.DateTime)
                    .FirstOrDefaultAsync(cancellationToken);

                closingLevel = (decimal?)closingMeasurement?.ProductVolume;
            }

            // Calculate totals from tankdeliveries table
            // Note: Adjust DeliveryType values based on your actual database values

            // Total Refills = Issues (dispensed fuel)
            var totalRefills = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id &&
                            td.CreatedOn >= startOfDay &&
                            td.CreatedOn <= endOfDay &&
                            td.ChangeReason == VolumeChangeReasonEnum.Dispensing)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            // Total Deliveries = Receipts marked as "delivery"
            var totalDeliveries = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id &&
                            td.CreatedOn >= startOfDay &&
                            td.CreatedOn <= endOfDay &&
                            td.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            // Total Transfers In = Receipts from other tanks
            var totalTransfersIn = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id &&
                            td.CreatedOn >= startOfDay &&
                            td.CreatedOn <= endOfDay &&
                            td.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            // Total Transfers Out = Sent to other tanks
            var totalTransfersOut = await context.TankVolumeHistories
                .Where(td => td.TankId == tank.Id &&
                            td.CreatedOn >= startOfDay &&
                            td.CreatedOn <= endOfDay &&
                            td.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                .SumAsync(td => (decimal?)td.VolumeChange, cancellationToken) ?? 0;

            // Create or update reconciliation record
            if (existingRecord != null)
            {
                // Update existing record - preserve manually entered opening/closing if they exist
                if (existingRecord.OpeningLevel == null && openingLevel != null)
                {
                    existingRecord.OpeningLevel = openingLevel;
                }
                if (existingRecord.ClosingLevel == null && closingLevel != null)
                {
                    existingRecord.ClosingLevel = closingLevel;
                }

                // Always update calculated totals
                existingRecord.TotalRefills = totalRefills;
                existingRecord.TotalDeliveries = totalDeliveries;
                existingRecord.TotalTransfersIn = totalTransfersIn;
                existingRecord.TotalTransfersOut = totalTransfersOut;

                _logger.LogDebug("Updated reconciliation for tank {TankName} ({TankId})", tank.Name, tank.Id);
            }
            else
            {
                // Create new record
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

                _logger.LogDebug("Created reconciliation for tank {TankName} ({TankId})", tank.Name, tank.Id);
            }

            await context.SaveChangesAsync(cancellationToken);

            // Log summary
            var variance = CalculateVariance(openingLevel, closingLevel, totalDeliveries, totalTransfersIn, totalRefills, totalTransfersOut);

            _logger.LogDebug(
                "Tank {TankName}: Opening={Opening}L, Closing={Closing}L, Refills={Refills}L, Deliveries={Deliveries}L, TransfersIn={TransfersIn}L, TransfersOut={TransfersOut}L, Variance={Variance}L",
                tank.Name,
                openingLevel ?? 0,
                closingLevel ?? 0,
                totalRefills,
                totalDeliveries,
                totalTransfersIn,
                totalTransfersOut,
                variance);

            // Log warning if variance is significant (more than 50L difference)
            if (Math.Abs(variance) > 50 && openingLevel != null && closingLevel != null)
            {
                _logger.LogWarning(
                    "Tank {TankName} has significant variance of {Variance}L on {Date}",
                    tank.Name, variance, reconciliationDate);
            }
        }

        private decimal CalculateVariance(decimal? opening, decimal? closing, decimal deliveries,
                                         decimal transfersIn, decimal refills, decimal transfersOut)
        {
            // Expected closing = Opening + Deliveries + TransfersIn - Refills - TransfersOut
            // Variance = Actual Closing - Expected Closing

            if (opening == null || closing == null)
                return 0;

            var expectedClosing = opening.Value + deliveries + transfersIn - refills - transfersOut;
            return closing.Value - expectedClosing;
        }

        private async Task CreateReconciliationAlarmAsync(
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
            DateTime reconciliationDate,
            int processedTanks,
            int failedTanks,
            TimeSpan duration,
            CancellationToken cancellationToken)
        {
            try
            {
                var severity = failedTanks > 0 ? "Medium" : "Low";
                var message = failedTanks > 0
                    ? $"Daily Tank Reconciliation completed with {failedTanks} failures. {processedTanks} tanks processed successfully for {reconciliationDate:yyyy-MM-dd}. Duration: {duration.TotalSeconds:F1}s"
                    : $"Daily Tank Reconciliation completed successfully. {processedTanks} tanks processed for {reconciliationDate:yyyy-MM-dd}. Duration: {duration.TotalSeconds:F1}s";

                await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert(
                    0,
                    "DailyReconciliationCompleted",
                    message,
                    severity,
                    null, // No specific site
                    null, // No specific tank
                    null, // No PTS ID
                    "DailyReconciliation-System",
                    new
                    {
                        ReconciliationDate = reconciliationDate,
                        ProcessedTanks = processedTanks,
                        FailedTanks = failedTanks,
                        DurationSeconds = duration.TotalSeconds
                    },
                    cancellationToken);

                _logger.LogInformation("Created reconciliation completion alarm notification");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create reconciliation alarm notification");
            }
        }

        private async Task CreateFailureAlarmAsync(
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
            DateTime reconciliationDate,
            string errorMessage,
            CancellationToken cancellationToken)
        {
            try
            {
                await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert(
                    0,
                    "DailyReconciliationFailed",
                    $"Daily Tank Reconciliation FAILED for {reconciliationDate:yyyy-MM-dd}. Error: {errorMessage}",
                    "High",
                    null,
                    null,
                    null,
                    "DailyReconciliation-System",
                    new
                    {
                        ReconciliationDate = reconciliationDate,
                        ErrorMessage = errorMessage,
                        Timestamp = DateTime.UtcNow
                    },
                    cancellationToken);

                _logger.LogInformation("Created reconciliation failure alarm notification");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create failure alarm notification");
            }
        }
    }
}