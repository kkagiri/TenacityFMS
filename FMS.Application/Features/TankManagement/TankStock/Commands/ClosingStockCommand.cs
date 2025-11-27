using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.FMS.TankStock;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.Integration;
using FMS.Application.Services.AutomatedReconciliation;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand
{
    public record ClosingStockCommand(int TankId, decimal ClosingStock, string RecordedBy, DateTime? EntryDate = null, decimal? ClosingMeter = null) : IRequest<FMSResponseMessage>;

    public class ClosingStockCommandHandler : IRequestHandler<ClosingStockCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ClosingStockCommandHandler> _logger;
        private readonly IMediator _mediator;
        //Cursor - Added TankVolumeHistoryIntegrationService dependency
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly DiscrepancyDetectionService _discrepancyDetectionService;
        private readonly INotificationService _notificationService;
        private readonly AlarmHandlerActiveAlarmIntegration _activeAlarmIntegration;

        public ClosingStockCommandHandler(GpsdataContext context, ILogger<ClosingStockCommandHandler> logger, IMediator mediator, TankVolumeHistoryIntegrationService tankVolumeHistoryService, TankStockFutureRecordsService futureRecordsService, DiscrepancyDetectionService discrepancyDetectionService, INotificationService notificationService, AlarmHandlerActiveAlarmIntegration activeAlarmIntegration)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
            _discrepancyDetectionService = discrepancyDetectionService;
            _notificationService = notificationService;
            _activeAlarmIntegration = activeAlarmIntegration;
        }

        public async Task<FMSResponseMessage> Handle(ClosingStockCommand request, CancellationToken cancellationToken)
        {

            try
            {
                // Always use UTC for internal storage
                var entryDate = request.EntryDate?.Date ?? DateTime.UtcNow.Date;

                var tank = await _context.Tanks.FindAsync(request.TankId, cancellationToken);
                if (tank == null) return new FMSResponseMessage(false, $"TankID {request.TankId} not found ");

                // Validate closing stock value is positive
                if (request.ClosingStock <= 0) return new FMSResponseMessage(false, "Closing stock must be greater than 0");

                // Validate historical entry against future records policy
                if (entryDate.Date < DateTime.UtcNow.Date)
                {
                    var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                        request.TankId, entryDate, VolumeChangeReasonEnum.ClosingStock, cancellationToken);

                    if (!futureRecordsValidation.IsAllowed)
                    {
                        return new FMSResponseMessage(false, futureRecordsValidation.Message);
                    }

                    // Log warning for future reference
                    if (futureRecordsValidation.RequiresUserConfirmation)
                    {
                        _logger.LogWarning("Historical closing stock entry with future records: Tank {TankId}, Date {EntryDate}, Policy {Policy}, Future Records {Count}",
                            request.TankId, entryDate, futureRecordsValidation.Policy, futureRecordsValidation.FutureRecordsCount);
                    }
                }

                var existingClosingStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.TankId &&
                        x.Timestamp.Date == entryDate &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                        (x.IsDeleted != true))
                    .SingleOrDefaultAsync(cancellationToken);

                if (existingClosingStock != null) return new FMSResponseMessage(false, "A closing stock entry already exists for today. You cannot create multiple closing stocks for the same day.");

                var openingStock = await _context.TankVolumeHistories.Where(x => x.TankId == request.TankId &&
                        x.Timestamp.Date == entryDate.Date && x.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                        (x.IsDeleted != true))
                    .SingleOrDefaultAsync(cancellationToken);

                if (openingStock == null) return new FMSResponseMessage(false, $"Cannot record closing stock for this date if no Opening stock not found for TankID {request.TankId} is not Found");

                // NEW VALIDATION: Check chronological order - opening must not be in the future
                if (openingStock.Timestamp > DateTime.UtcNow)
                {
                    return new FMSResponseMessage(false,
                        $"Invalid opening stock timestamp: Opening stock recorded at ({openingStock.Timestamp:yyyy-MM-dd HH:mm:ss} UTC) is in the future. " +
                        "Transaction timestamps cannot be in the future.");
                }

                // NEW VALIDATION: Check that all transactions for this day are AFTER opening stock
                var transactionsBeforeOpening = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                  tvh.Timestamp.Date == entryDate.Date &&
                                  tvh.ChangeReason != VolumeChangeReasonEnum.OpeningStock &&
                                  tvh.ChangeReason != VolumeChangeReasonEnum.ClosingStock &&
                                  tvh.Timestamp < openingStock.Timestamp &&
                                  (tvh.IsDeleted != true))
                    .OrderBy(tvh => tvh.Timestamp)
                    .ToListAsync(cancellationToken);

                if (transactionsBeforeOpening.Any())
                {
                    var earliestTransaction = transactionsBeforeOpening.First();
                    return new FMSResponseMessage(false,
                        $"CHRONOLOGICAL ORDER VIOLATION: Found {transactionsBeforeOpening.Count} transaction(s) recorded BEFORE opening stock. " +
                        $"Earliest transaction: {earliestTransaction.ChangeReason} at {earliestTransaction.Timestamp:yyyy-MM-dd HH:mm:ss}, " +
                        $"Opening stock recorded at {openingStock.Timestamp:yyyy-MM-dd HH:mm:ss}. " +
                        "Please correct the timestamps - Opening stock MUST come before all other transactions.");
                }

                // NEW VALIDATION: Check that closing stock timestamp is reasonable and after all transactions
                var latestTransactionBeforeClosing = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                  tvh.Timestamp.Date == entryDate.Date &&
                                  tvh.ChangeReason != VolumeChangeReasonEnum.ClosingStock &&
                                  (tvh.IsDeleted != true))
                    .OrderByDescending(tvh => tvh.Timestamp)
                    .ThenByDescending(tvh => tvh.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                // NEW VALIDATION: Validate closing stock reflects transactions
                var allTransactionsForDay = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                  tvh.Timestamp.Date == entryDate.Date &&
                                  tvh.ChangeReason != VolumeChangeReasonEnum.OpeningStock &&
                                  tvh.ChangeReason != VolumeChangeReasonEnum.ClosingStock &&
                                  (tvh.IsDeleted != true))
                    .ToListAsync(cancellationToken);

                // Calculate expected closing stock based on opening stock and transactions
                decimal calculatedClosingStock = openingStock.NewVolume ?? openingStock.VolumeChange ?? 0;
                decimal totalTransactionVolume = allTransactionsForDay.Sum(t => t.VolumeChange ?? 0);
                decimal expectedClosingStock = calculatedClosingStock + totalTransactionVolume;

                // NEW VALIDATION: Check if closing stock is reasonable
                decimal varianceFromExpected = Math.Abs(request.ClosingStock - expectedClosingStock);
                decimal variancePercentage = expectedClosingStock > 0 ? (varianceFromExpected / expectedClosingStock) * 100 : 0;

                // Allow reasonable variance (5% or 20 liters), but flag large discrepancies
                if (varianceFromExpected > 20 && variancePercentage > 5)
                {
                    _logger.LogWarning(
                        "Large variance detected in closing stock for Tank {TankId}: " +
                        "Opening: {OpeningStock}L, Expected Closing (based on transactions): {ExpectedClosing}L, " +
                        "Recorded Closing: {RecordedClosing}L, Variance: {Variance}L ({VariancePercent:F2}%), " +
                        "Transaction Count: {TransactionCount}",
                        request.TankId,
                        openingStock.NewVolume ?? 0,
                        expectedClosingStock,
                        request.ClosingStock,
                        varianceFromExpected,
                        variancePercentage,
                        allTransactionsForDay.Count);
                }

                // NEW VALIDATION: If there are transactions, closing stock MUST be different from opening stock
                if (allTransactionsForDay.Any() && Math.Abs(request.ClosingStock - (openingStock.NewVolume ?? 0)) < 0.01m)
                {
                    return new FMSResponseMessage(false,
                        $"INVALID CLOSING STOCK: Closing stock ({request.ClosingStock:F2}L) equals opening stock ({openingStock.NewVolume ?? 0:F2}L) " +
                        $"but {allTransactionsForDay.Count} transaction(s) were recorded for this day. " +
                        $"Closing stock must reflect the net effect of all transactions (Dispensing, Delivery, Transfers). " +
                        $"Expected closing stock based on transactions: {expectedClosingStock:F2}L");
                }

                // Find existing TankStock entry for this tank and date (single-row-per-day architecture)
                var existingTankStock = await _context.Tankstocks
                    .Where(x => x.TankId == request.TankId &&
                        x.EntryDate.Date == entryDate.Date &&
                        !x.IsDeleted)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingTankStock == null)
                {
                    return new FMSResponseMessage(false,
                        $"No TankStock entry found for tank {request.TankId} on {entryDate:yyyy-MM-dd}. " +
                        "Opening stock must be created first before recording closing stock.");
                }

                // Update existing TankStock entry with closing stock information
                existingTankStock.ManualClosingLevel = request.ClosingStock;
                existingTankStock.ClosingMeter = request.ClosingMeter;

                // Keep EntryType as OpeningStock (primary type) - the row represents the whole day
                // Don't change: existingTankStock.EntryType = VolumeChangeReasonEnum.ClosingStock;

                // Get all transactions for the day
                var transactions = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId && tvh.Timestamp.Date == entryDate.Date)
                    .ToListAsync();

                var totalRefills = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing).Sum(t => t.VolumeChange);
                var totalDeliveries = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.Delivery).Sum(t => t.VolumeChange);
                var totalTransfersIn = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferIn).Sum(t => t.VolumeChange);
                var totalTransfersOut = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferOut).Sum(t => t.VolumeChange);

                // Update the existing TankStock entry
                _context.Tankstocks.Update(existingTankStock);

                // Save changes to get the updated entry
                await _context.SaveChangesAsync(cancellationToken);

                // Get the most recent transaction before this closing stock to calculate volume change
                var previousTransaction = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                   tvh.Timestamp < entryDate &&
                                   (tvh.IsDeleted != true))
                    .OrderByDescending(tvh => tvh.Timestamp)
                    .ThenByDescending(tvh => tvh.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                // Calculate volume change from the previous transaction (not from opening stock)
                // This represents the actual change since the last recorded transaction
                decimal volumeChange;
                if (previousTransaction != null && previousTransaction.NewVolume.HasValue)
                {
                    // Calculate from the most recent transaction
                    volumeChange = request.ClosingStock - previousTransaction.NewVolume.Value;
                }
                else
                {
                    // Fallback to opening stock if no previous transactions exist
                    volumeChange = request.ClosingStock - (openingStock?.NewVolume ?? 0);
                }

                //Cursor - Use TankVolumeHistoryIntegrationService which will handle tank updates atomically
                var volumeUpdateResult = await _tankVolumeHistoryService.ProcessTankStockChangeAsync(
                    tankId: request.TankId,
                    timestamp: entryDate.AddHours(23).AddMinutes(55), // Always 23:55:00 UTC on the entry date
                    volumeChange: volumeChange,
                    stockId: existingTankStock.EntryId,  // Use existing entry ID
                    isOpening: false, // This is a closing stock
                    actionType: ActionType.Create, // This is a new closing stock
                    recordedBy: request.RecordedBy,
                    newPhysicalStockValue: request.ClosingStock, // Pass the physical stock value
                    physicalStockSource: "Manual Closing Stock", // Pass the physical stock source
                    cancellationToken: cancellationToken);

                if (!volumeUpdateResult.Success)
                {
                    _logger.LogWarning("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                    // We continue even if volume history update fails, but log the error
                }

                // Perform reconciliation analysis after successful closing stock entry
                var reconciliationResult = await PerformReconciliationAnalysis(
                    openingStock.NewVolume ?? 0,
                    request.ClosingStock,
                    totalDeliveries ?? 0,
                    totalRefills ?? 0,
                    totalTransfersIn ?? 0,
                    totalTransfersOut ?? 0,
                    request.TankId,
                    entryDate,
                    cancellationToken);

                // Perform additional sensor vs manual variance analysis
                await PerformSensorVarianceAnalysis(
                    request.TankId,
                    request.ClosingStock,
                    entryDate,
                    request.RecordedBy,
                    cancellationToken);

                // Log reconciliation results
                if (reconciliationResult.IsSignificantVariance)
                {
                    _logger.LogWarning("Significant variance detected in closing stock for Tank {TankId}: {Variance}L ({VariancePercentage}%)",
                        request.TankId, reconciliationResult.Variance, reconciliationResult.VariancePercentage);
                }

                return new FMSResponseMessage(true, "Closing stock created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating closing stock");
                return new FMSResponseMessage(false, "Error while creating closing stock");
            }

        }

        public async Task<StockReconciliationResult> PerformReconciliationAnalysis(
            decimal openingStock,
            decimal closingStock,
            decimal totalDeliveries,
            decimal totalRefills,
            decimal totalTransfersIn,
            decimal totalTransfersOut,
            int tankId,
            DateTime entryDate,
            CancellationToken cancellationToken = default)
        {
            decimal expectedClosingStock = openingStock + totalDeliveries + totalTransfersIn + totalRefills + totalTransfersOut;
            decimal actualClosingStock = closingStock;
            decimal variance = actualClosingStock - expectedClosingStock;
            decimal variancePercentage = expectedClosingStock > 0 ? variance / expectedClosingStock * 100 : 0;

            // Determine variance type
            string varianceType = variance > 0 ? "GAIN" : variance < 0 ? "LOSS" : "BALANCED";

            // Define significance thresholds (these could be configurable)
            decimal significanceThresholdLiters = 50; // 50 liters threshold
            decimal significanceThresholdPercentage = 5; // 5% threshold

            bool isSignificantVariance = Math.Abs(variance) >= significanceThresholdLiters ||
                Math.Abs(variancePercentage) >= significanceThresholdPercentage;

            bool requiresInvestigation = Math.Abs(variance) >= 100 || // 100 liters threshold for investigation
                Math.Abs(variancePercentage) >= 10; // 10% threshold for investigation

            var result = new StockReconciliationResult
            {
                TankId = tankId,
                Date = entryDate,
                OpeningStock = openingStock,
                ExpectedClosingStock = expectedClosingStock,
                ActualClosingStock = actualClosingStock,
                Variance = variance,
                VariancePercentage = variancePercentage,
                TotalDeliveries = totalDeliveries,
                TotalDispensing = totalRefills, // Note: Refills are negative dispensing
                TotalTransfersIn = totalTransfersIn,
                TotalTransfersOut = totalTransfersOut,
                VarianceType = varianceType,
                IsSignificantVariance = isSignificantVariance,
                RequiresInvestigation = requiresInvestigation
            };

            // If significant variance detected, create a ReconciliationDiscrepancy record
            if (isSignificantVariance)
            {
                try
                {
                    var tank = await _context.Tanks.FindAsync(tankId, cancellationToken);
                    if (tank != null)
                    {
                        // Determine severity based on variance magnitude
                        DiscrepancySeverity severity = DetermineSeverity(variance, variancePercentage);

                        var discrepancy = new ReconciliationDiscrepancy
                        {
                            PolicyExecutionId = null, // Manual closing stock discrepancy, not policy-driven
                            TankId = tankId,
                            DetectedAt = DateTime.UtcNow,
                            CurrentStock = actualClosingStock,
                            ExpectedStock = expectedClosingStock,
                            AbsoluteVariance = variance,
                            PercentageVariance = variancePercentage,
                            Severity = severity,
                            IsResolved = false,
                            AnalysisNotes = $"Daily closing stock reconciliation variance detected. Type: {varianceType} , Total Deliveries: {totalDeliveries}, Total Refills: {totalRefills}, Total Transfers In: {totalTransfersIn}, Total Transfers Out: {totalTransfersOut} , Opening Stock: {openingStock}",
                            BusinessImpactScore = CalculateBusinessImpact(variance, tank)
                        };

                        _context.ReconciliationDiscrepancies.Add(discrepancy);
                        await _context.SaveChangesAsync(cancellationToken);

                        _logger.LogInformation("ReconciliationDiscrepancy record created for Tank {TankId}: {Variance}L ({VariancePercentage}%)",
                            tankId, variance, variancePercentage);

                        // Send notification for discrepancy detection
                        await SendDiscrepancyNotificationAsync(tank, variance, variancePercentage, varianceType, severity, cancellationToken);

                        // Create ActiveAlarm for significant stock discrepancy
                        await CreateDiscrepancyActiveAlarmAsync(tank, variance, variancePercentage, varianceType, severity, discrepancy.Id, cancellationToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create ReconciliationDiscrepancy record for Tank {TankId}", tankId);
                    // Don't throw - reconciliation analysis failure shouldn't prevent closing stock creation
                }
            }

            // Create or update Dailytankreconciliation record for backward compatibility and historical tracking
            try
            {
                var existingDailyRecon = await _context.Dailytankreconciliations
                    .Where(dtr => dtr.TankId == tankId && dtr.ReconciliationDate.Date == entryDate.Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingDailyRecon != null)
                {
                    // Update existing record
                    existingDailyRecon.ClosingLevel = actualClosingStock;
                    existingDailyRecon.TotalDeliveries = totalDeliveries;
                    existingDailyRecon.TotalRefills = totalRefills;
                    existingDailyRecon.TotalTransfersIn = totalTransfersIn;
                    existingDailyRecon.TotalTransfersOut = totalTransfersOut;

                    _logger.LogInformation("Updated existing Dailytankreconciliation record for Tank {TankId}, Date {Date}",
                        tankId, entryDate.Date);
                }
                else
                {
                    // Create new record
                    var dailyRecon = new Dailytankreconciliation
                    {
                        TankId = tankId,
                        ReconciliationDate = entryDate.Date,
                        OpeningLevel = openingStock,
                        ClosingLevel = actualClosingStock,
                        TotalDeliveries = totalDeliveries,
                        TotalRefills = totalRefills,
                        TotalTransfersIn = totalTransfersIn,
                        TotalTransfersOut = totalTransfersOut,
                        CreatedOn = DateTime.UtcNow
                    };

                    _context.Dailytankreconciliations.Add(dailyRecon);

                    _logger.LogInformation("Created new Dailytankreconciliation record for Tank {TankId}, Date {Date}",
                        tankId, entryDate.Date);
                }

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create/update Dailytankreconciliation record for Tank {TankId}", tankId);
                // Don't throw - daily reconciliation record failure shouldn't prevent closing stock creation
            }

            return result;
        }

        private DiscrepancySeverity DetermineSeverity(decimal varianceLiters, decimal variancePercentage)
        {
            decimal absVarianceLiters = Math.Abs(varianceLiters);
            decimal absVariancePercentage = Math.Abs(variancePercentage);

            if (absVarianceLiters > 100 || absVariancePercentage > 10)
            {
                return DiscrepancySeverity.High;
            }

            if (absVarianceLiters > 50 || absVariancePercentage > 5)
            {
                return DiscrepancySeverity.Medium;
            }

            return DiscrepancySeverity.Low;
        }

        private decimal CalculateBusinessImpact(decimal varianceLiters, Tank tank)
        {
            decimal absVariance = Math.Abs(varianceLiters);

            // Base impact score (0-100 scale)
            decimal impactScore = Math.Min(absVariance / 10, 100); // 10 liters = 1 point, max 100

            // Adjust based on tank capacity if available
            if (tank.TankVolume > 0)
            {
                decimal percentageOfCapacity = absVariance / tank.TankVolume * 100;
                impactScore = Math.Max(impactScore, percentageOfCapacity * 2); // Weight capacity percentage higher
            }

            return Math.Round(impactScore, 2);
        }

        /// <summary>
        /// Sends notification when a discrepancy is detected during closing stock reconciliation
        /// </summary>
        private async Task SendDiscrepancyNotificationAsync(Tank tank, decimal variance, decimal variancePercentage,
            string varianceType, DiscrepancySeverity severity, CancellationToken cancellationToken)
        {
            try
            {
                // Determine notification priority based on severity
                string priority = severity
                switch
                {
                    DiscrepancySeverity.High => "High",
                    DiscrepancySeverity.Medium => "Medium",
                    DiscrepancySeverity.Low => "Low",
                    _ => "Medium"
                };

                // Create notification request
                var notificationRequest = new CreateNotificationRequest
                {
                    Type = NotificationType.Alert,
                    CategoryId = (int)WellKnownCategories.TankVariance,
                    Priority = NotificationPriority.High,
                    Title = "Closing Stock Discrepancy Detected",
                    Message = $"Tank {tank.Name} closing stock discrepancy: {variance:F2}L ({variancePercentage:F1}%) - {varianceType}",
                    TriggerSource = "ClosingStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    DisableFallbackAllUsers = true // ✅ Prevent spam to all users

                };

                // ✅ Remove hardcoded recipients - let enhanced recipient resolver handle it
                // The NotificationRecipientResolver will now:
                // 1. Add site administrator automatically (if SiteId provided)
                // 2. Resolve recipients from business function groups for TriggerSource "ClosingStock"
                // 3. Include subscribed users for TankVariance category
                // 4. NOT fallback to all users (DisableFallbackAllUsers = true)

                await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);

                _logger.LogInformation("Discrepancy notification sent for Tank {TankId}: {Severity} severity, {Variance}L variance",
                    tank.Id, severity, variance);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send discrepancy notification for Tank {TankId}", tank.Id);
                // Don't throw - notification failure shouldn't prevent closing stock creation
            }
        }

        /// <summary>
        /// Performs sensor vs manual variance analysis for closing stock entries
        /// Compares manual closing stock entry with recent sensor readings
        /// </summary>
        private async Task PerformSensorVarianceAnalysis(
            int tankId,
            decimal manualClosingStock,
            DateTime entryDate,
            string recordedBy,
            CancellationToken cancellationToken)
        {
            try
            {
                var tank = await _context.Tanks.FindAsync(tankId, cancellationToken);
                if (tank?.PtsId == null)
                {
                    return; // No sensor available for this tank
                }

                // Get the most recent sensor reading (within last 24 hours)
                var cutoffTime = entryDate.AddHours(-24);
                var latestSensorReading = await _context.Tankmeasurements
                    .Where(tm => tm.Ptsid == tank.PtsId && tm.DateTime >= cutoffTime)
                    .OrderByDescending(tm => tm.DateTime)
                    .FirstOrDefaultAsync(cancellationToken);

                if (latestSensorReading?.ProductVolume.HasValue != true)
                {
                    _logger.LogInformation("No recent sensor data available for Tank {TankId} for sensor variance analysis", tankId);
                    return;
                }

                var sensorVolume = (decimal)latestSensorReading.ProductVolume.Value;
                var variance = manualClosingStock - sensorVolume;
                var absVariance = Math.Abs(variance);
                var variancePercentage = sensorVolume > 0 ? (absVariance / sensorVolume) * 100 : 0;

                // Define thresholds for sensor vs manual variance
                var varianceThresholdLiters = 5.0m; // 5 liters
                var varianceThresholdPercentage = 2.0m; // 2%

                var isSignificantVariance = absVariance > varianceThresholdLiters ||
                    variancePercentage > varianceThresholdPercentage;

                if (isSignificantVariance)
                {
                    // Create discrepancy record for sensor vs manual variance
                    var severity = DetermineSensorVarianceSeverity(absVariance, variancePercentage);

                    var discrepancy = new ReconciliationDiscrepancy
                    {
                        PolicyExecutionId = null, // Manual entry discrepancy
                        TankId = tankId,
                        DetectedAt = DateTime.UtcNow,
                        CurrentStock = manualClosingStock,
                        ExpectedStock = sensorVolume,
                        AbsoluteVariance = variance,
                        PercentageVariance = variancePercentage,
                        Severity = severity,
                        IsResolved = false,
                        AnalysisNotes = $"Sensor vs Manual Closing Stock variance detected. Manual Entry: {manualClosingStock}L, " +
                        $"Sensor Reading: {sensorVolume}L (from {latestSensorReading.DateTime:yyyy-MM-dd HH:mm:ss}), " +
                        $"Recorded By: {recordedBy}, Entry Date: {entryDate:yyyy-MM-dd}",
                        BusinessImpactScore = CalculateBusinessImpact(absVariance, tank)
                    };

                    _context.ReconciliationDiscrepancies.Add(discrepancy);
                    await _context.SaveChangesAsync(cancellationToken);

                    _logger.LogWarning("Sensor vs Manual variance detected for Tank {TankId}: Manual {Manual}L vs Sensor {Sensor}L, Variance: {Variance}L ({VariancePercentage:F2}%)",
                        tankId, manualClosingStock, sensorVolume, variance, variancePercentage);

                    // Send notification for sensor variance
                    await SendSensorVarianceNotificationAsync(
                        tank, manualClosingStock, sensorVolume, variance, variancePercentage,
                        latestSensorReading.DateTime, recordedBy, severity, cancellationToken);

                    // Create ActiveAlarm for sensor variance
                    await CreateSensorVarianceActiveAlarmAsync(
                        tank: tank,
                        manualVolume: manualClosingStock,
                        sensorVolume: sensorVolume,
                        variance: variance,
                        variancePercentage: variancePercentage,
                        recordedBy: recordedBy,
                        severity: severity,
                        discrepancyId: discrepancy.Id,
                        cancellationToken: cancellationToken);
                }
                else
                {
                    _logger.LogInformation("Sensor vs Manual variance within acceptable limits for Tank {TankId}: {Variance}L ({VariancePercentage:F2}%)",
                        tankId, variance, variancePercentage);
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to perform sensor variance analysis for Tank {TankId}", tankId);
                // Don't throw - sensor variance analysis failure shouldn't prevent closing stock creation
            }
        }

        /// <summary>
        /// Determines severity for sensor vs manual variance
        /// </summary>
        private DiscrepancySeverity DetermineSensorVarianceSeverity(decimal absVarianceLiters, decimal variancePercentage)
        {
            // Higher thresholds for sensor variance as sensors may have calibration differences
            return (absVarianceLiters, variancePercentage) switch
            {
                ( >= 20.0m, _) or (_, >= 10.0m) => DiscrepancySeverity.Critical,
                ( >= 10.0m, _) or (_, >= 5.0m) => DiscrepancySeverity.High,
                ( >= 5.0m, _) or (_, >= 2.0m) => DiscrepancySeverity.Medium,
                _ => DiscrepancySeverity.Low
            };
        }

        /// <summary>
        /// Sends notification for sensor vs manual variance
        /// </summary>
        private async Task SendSensorVarianceNotificationAsync(
            Tank tank,
            decimal manualVolume,
            decimal sensorVolume,
            decimal variance,
            decimal variancePercentage,
            DateTime sensorTimestamp,
            string recordedBy,
            DiscrepancySeverity severity,
            CancellationToken cancellationToken)
        {
            try
            {
                var priorityLevel = severity
                switch
                {
                    DiscrepancySeverity.Critical => "High",
                    DiscrepancySeverity.High => "Medium",
                    _ => "Low"
                };

                var notificationRequest = new CreateNotificationRequest
                {
                    Type = NotificationType.Alert,
                    CategoryId = (int)WellKnownCategories.SensorVariance,
                    Priority = NotificationPriority.High,
                    Title = $"Sensor vs Manual Closing Stock Variance - Tank {tank.Name}",
                    Message = $"Significant variance detected between manual closing stock entry and sensor reading for Tank {tank.Name}. " +
                        $"Manual Entry: {manualVolume}L, Sensor Reading: {sensorVolume}L (from {sensorTimestamp:yyyy-MM-dd HH:mm:ss}), " +
                        $"Variance: {variance:+0.00;-0.00;0}L ({variancePercentage:F2}%), Severity: {severity}, Recorded By: {recordedBy}",
                    TriggerSource = "ClosingStockSensorVariance",
                    TriggeredBy = recordedBy

                };

                await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);

                _logger.LogInformation("Sensor variance notification sent for Tank {TankId}: {Severity} severity, Manual {Manual}L vs Sensor {Sensor}L",
                    tank.Id, severity, manualVolume, sensorVolume);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send sensor variance notification for Tank {TankId}", tank.Id);
                // Don't throw - notification failure shouldn't prevent closing stock creation
            }
        }

        public class StockReconciliationResult
        {
            public int TankId { get; set; }
            public DateTime Date { get; set; }
            public decimal OpeningStock { get; set; }
            public decimal ExpectedClosingStock { get; set; }
            public decimal ActualClosingStock { get; set; }
            public decimal Variance { get; set; }
            public decimal VariancePercentage { get; set; }

            public decimal TotalDeliveries { get; set; }
            public decimal TotalDispensing { get; set; }
            public decimal TotalTransfersIn { get; set; }
            public decimal TotalTransfersOut { get; set; }

            public string VarianceType { get; set; } = string.Empty; // GAIN, LOSS, BALANCED
            public bool IsSignificantVariance { get; set; }
            public bool RequiresInvestigation { get; set; }
        }

        /// <summary>
        /// Creates an ActiveAlarm for stock reconciliation discrepancy
        /// </summary>
        private async Task CreateDiscrepancyActiveAlarmAsync(
            Tank tank,
            decimal variance,
            decimal variancePercentage,
            string varianceType,
            DiscrepancySeverity severity,
            int discrepancyId,
            CancellationToken cancellationToken)
        {
            try
            {
                string alarmType = $"TankStockDiscrepancy{varianceType}";
                string message = $"Stock discrepancy detected in Tank {tank.Name}: {variance:F2}L ({variancePercentage:F1}%) - {varianceType}";
                string priority = severity
                switch
                {
                    DiscrepancySeverity.Critical => "Critical",
                    DiscrepancySeverity.High => "High",
                    DiscrepancySeverity.Medium => "Medium",
                    DiscrepancySeverity.Low => "Low",
                    _ => "Medium"
                };

                ActiveAlarm? activeAlarm = await _activeAlarmIntegration.CreateActiveAlarmFromDiscrepancy(
                    discrepancyId: discrepancyId,
                    alarmType: alarmType,
                    message: message,
                    severity: severity,
                    siteId: tank.SiteId,
                    tankId: tank.Id,
                    thresholdValue: null, // No specific threshold for stock discrepancy
                    actualValue: Math.Abs(variance),
                    unit: "L",
                    triggeredBy: "ClosingStock-System",
                    cancellationToken: cancellationToken);

                if (activeAlarm != null)
                {
                    _logger.LogInformation("Created ActiveAlarm {AlarmId} for stock discrepancy in Tank {TankId}",
                        activeAlarm.Id, tank.Id);
                }
                else
                {
                    _logger.LogWarning("Failed to create ActiveAlarm for stock discrepancy in Tank {TankId}", tank.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create ActiveAlarm for stock discrepancy in Tank {TankId}", tank.Id);
                // Don't throw - ActiveAlarm creation failure shouldn't prevent closing stock creation
            }
        }

        /// <summary>
        /// Creates an ActiveAlarm for sensor vs manual variance
        /// </summary>
        private async Task CreateSensorVarianceActiveAlarmAsync(
            Tank tank,
            decimal manualVolume,
            decimal sensorVolume,
            decimal variance,
            decimal variancePercentage,
            string recordedBy,
            DiscrepancySeverity severity,
            int discrepancyId,
            CancellationToken cancellationToken)
        {
            try
            {
                string alarmType = "TankSensorVariance";
                string message = $"Sensor vs Manual variance in Tank {tank.Name}: Manual {manualVolume}L vs Sensor {sensorVolume}L, Variance: {variance:+0.00;-0.00;0}L ({variancePercentage:F2}%)";
                string priority = severity
                switch
                {
                    DiscrepancySeverity.Critical => "Critical",
                    DiscrepancySeverity.High => "High",
                    DiscrepancySeverity.Medium => "Medium",
                    DiscrepancySeverity.Low => "Low",
                    _ => "Medium"
                };

                ActiveAlarm? activeAlarm = await _activeAlarmIntegration.CreateActiveAlarmFromDiscrepancy(
                    discrepancyId: discrepancyId,
                    alarmType: alarmType,
                    message: message,
                    severity: severity,
                    siteId: tank.SiteId,
                    tankId: tank.Id,
                    thresholdValue: sensorVolume,
                    actualValue: manualVolume,
                    unit: "L",
                    triggeredBy: recordedBy,
                    cancellationToken: cancellationToken);

                if (activeAlarm != null)
                {
                    _logger.LogInformation("Created ActiveAlarm {AlarmId} for sensor variance in Tank {TankId}",
                        activeAlarm.Id, tank.Id);
                }
                else
                {
                    _logger.LogWarning("Failed to create ActiveAlarm for sensor variance in Tank {TankId}", tank.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create ActiveAlarm for sensor variance in Tank {TankId}", tank.Id);
                // Don't throw - ActiveAlarm creation failure shouldn't prevent closing stock creation
            }
        }

    }
}