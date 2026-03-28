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
using FMS.Application.Services.TankStock;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand
{
    public record ClosingStockCommand(int TankId, decimal ClosingStock, string RecordedBy, DateTime? EntryDate = null, decimal? ClosingMeter = null, bool ConfirmOverride = false) : IRequest<FMSResponseMessage>;

    public class ClosingStockCommandHandler : IRequestHandler<ClosingStockCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ClosingStockCommandHandler> _logger;
        private readonly IMediator _mediator;
        //Cursor - Added TankVolumeHistoryIntegrationService dependency
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly IEventExpressionEngine _eventEngine;
        private readonly IConfiguration _configuration;

        public ClosingStockCommandHandler(GpsdataContext context, ILogger<ClosingStockCommandHandler> logger, IMediator mediator, TankVolumeHistoryIntegrationService tankVolumeHistoryService, TankStockFutureRecordsService futureRecordsService, IEventExpressionEngine eventEngine, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
            _eventEngine = eventEngine;
            _configuration = configuration;
        }

        public async Task<FMSResponseMessage> Handle(ClosingStockCommand request, CancellationToken cancellationToken)
        {

            try
            {
                // Always use UTC for internal storage
                var entryDate = request.EntryDate?.Date ?? DateTime.UtcNow.Date;

                var tank = await _context.Tanks.FindAsync(request.TankId, cancellationToken);
                if (tank == null) return new FMSResponseMessage(false, $"TankID {request.TankId} not found ");

                // CRITICAL VALIDATION: Closing stock cannot be negative or zero
                // Tank volume must always be a positive value
                if (request.ClosingStock < 0)
                {
                    return new FMSResponseMessage(false,
                        $"Invalid closing stock: {request.ClosingStock:F2}L. Tank stock cannot be negative. " +
                        "Please enter a valid positive closing stock value.");
                }

                if (request.ClosingStock == 0)
                {
                    return new FMSResponseMessage(false,
                        "Closing stock cannot be zero. If the tank is empty, please verify this is correct " +
                        "and enter a small minimum value or contact system administrator.");
                }

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

                // Find opening stock FIRST so we can define the business day range
                // Opening stock lookup uses .Date which works because opening timestamp always
                // shares the same UTC calendar date as entryDate
                var openingStock = await _context.TankVolumeHistories.Where(x => x.TankId == request.TankId &&
                        x.Timestamp.Date == entryDate.Date && x.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                        (x.IsDeleted != true))
                    .SingleOrDefaultAsync(cancellationToken);

                if (openingStock == null) return new FMSResponseMessage(false, $"Cannot record closing stock for this date if no Opening stock not found for TankID {request.TankId} is not Found");

                // FIX: Define business day boundaries based on actual opening stock timestamp.
                // The business day spans from opening (e.g. 21:05 UTC = 00:05 local) to closing
                // (e.g. 20:55 UTC next day = 23:55 local), crossing the UTC midnight boundary.
                // Using .Date == entryDate.Date missed transactions on the next UTC calendar day.
                var businessDayStart = openingStock.Timestamp;
                var closingStockTimestamp = openingStock.Timestamp.AddHours(23).AddMinutes(50);
                var businessDayEnd = openingStock.Timestamp.AddDays(1); // generous upper bound for queries

                // Check for existing closing stock using timestamp range instead of .Date equality
                var existingClosingStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.TankId &&
                        x.Timestamp >= businessDayStart &&
                        x.Timestamp <= businessDayEnd &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                        (x.IsDeleted != true))
                    .SingleOrDefaultAsync(cancellationToken);

                if (existingClosingStock != null) return new FMSResponseMessage(false, "A closing stock entry already exists for today. You cannot create multiple closing stocks for the same day.");

                // VALIDATION: Check chronological order - opening must not be in the future
                if (openingStock.Timestamp > DateTime.UtcNow)
                {
                    return new FMSResponseMessage(false,
                        $"Invalid opening stock timestamp: Opening stock recorded at ({openingStock.Timestamp:yyyy-MM-dd HH:mm:ss} UTC) is in the future. " +
                        "Transaction timestamps cannot be in the future.");
                }

                // VALIDATION: Check that all transactions for this business day are AFTER opening stock
                // FIX: Use timestamp range instead of .Date equality
                var transactionsBeforeOpening = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                  tvh.Timestamp >= businessDayStart &&
                                  tvh.Timestamp < businessDayEnd &&
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

                // VALIDATION: Check that closing stock timestamp is reasonable and after all transactions
                // FIX: Use timestamp range instead of .Date equality
                var latestTransactionBeforeClosing = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                  tvh.Timestamp >= businessDayStart &&
                                  tvh.Timestamp < businessDayEnd &&
                                  tvh.ChangeReason != VolumeChangeReasonEnum.ClosingStock &&
                                  (tvh.IsDeleted != true))
                    .OrderByDescending(tvh => tvh.Timestamp)
                    .ThenByDescending(tvh => tvh.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                // VALIDATION: Validate closing stock reflects transactions
                // FIX: Use timestamp range instead of .Date equality
                var allTransactionsForDay = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                  tvh.Timestamp > businessDayStart &&
                                  tvh.Timestamp < closingStockTimestamp &&
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

                // Clean up any soft-deleted TankStock entries for this tank on this date
                // This handles the case where unique constraint doesn't respect IsDeleted flag
                var deletedEntries = await _context.Tankstocks
                    .Where(x => x.TankId == request.TankId &&
                        x.EntryDate.Date == entryDate.Date &&
                        x.IsDeleted == true)
                    .ToListAsync(cancellationToken);

                if (deletedEntries.Any())
                {
                    _context.Tankstocks.RemoveRange(deletedEntries);
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Cleaned up {Count} soft-deleted TankStock entries for tank {TankId} on {Date}",
                        deletedEntries.Count, request.TankId, entryDate.ToString("yyyy-MM-dd"));
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

                // Get all transactions for the business day using timestamp range
                // FIX: Use timestamp range instead of .Date equality to capture cross-UTC-midnight transactions
                var transactions = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                  tvh.Timestamp >= businessDayStart &&
                                  tvh.Timestamp <= businessDayEnd &&
                                  (tvh.IsDeleted != true))
                    .ToListAsync();

                var totalRefills = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing || t.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing).Sum(t => t.VolumeChange);
                var totalDeliveries = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.Delivery).Sum(t => t.VolumeChange);

                // FIX: Only count transfers that reference an active tanktransfer record.
                // Orphaned TVH entries (whose tanktransfer rows were wiped/deleted) must be
                // excluded so they do not skew expectedClosingStock and inflate the variance.
                var transferTvhReferenceIds = transactions
                    .Where(t => (t.ChangeReason == VolumeChangeReasonEnum.TransferIn ||
                                 t.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                                && t.ReferenceId.HasValue)
                    .Select(t => t.ReferenceId!.Value)
                    .Distinct()
                    .ToList();

                var validTransferIds = (await _context.TankTransfers
                    .Where(tt => transferTvhReferenceIds.Contains(tt.Id) && !tt.IsDeleted)
                    .Select(tt => tt.Id)
                    .ToListAsync())
                    .ToHashSet();

                var totalTransfersIn = transactions
                    .Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferIn
                                && t.ReferenceId.HasValue
                                && validTransferIds.Contains(t.ReferenceId.Value))
                    .Sum(t => t.VolumeChange);

                var totalTransfersOut = transactions
                    .Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferOut
                                && t.ReferenceId.HasValue
                                && validTransferIds.Contains(t.ReferenceId.Value))
                    .Sum(t => t.VolumeChange);

                // ─── VALIDATION: Detect likely unrecorded delivery ───
                // If closing stock is significantly higher than expected and no deliveries/transfers-in were recorded,
                // the user likely forgot to record a delivery. Block unless they explicitly confirm.
                if (!request.ConfirmOverride)
                {
                    decimal openingStockValue = openingStock.NewVolume ?? 0;
                    decimal expectedWithoutDelivery = openingStockValue + (totalRefills ?? 0) + (totalTransfersIn ?? 0) + (totalTransfersOut ?? 0);
                    decimal gainOverExpected = request.ClosingStock - expectedWithoutDelivery;
                    bool noDeliveriesRecorded = (totalDeliveries ?? 0) == 0;
                    bool noTransfersInRecorded = (totalTransfersIn ?? 0) == 0;

                    // Threshold: closing stock is at least 500L above expected AND no deliveries/transfers-in
                    const decimal unrecordedDeliveryThresholdLiters = 500m;

                    if (gainOverExpected >= unrecordedDeliveryThresholdLiters && noDeliveriesRecorded && noTransfersInRecorded)
                    {
                        _logger.LogWarning(
                            "Possible unrecorded delivery detected for Tank {TankId}: Closing={ClosingStock}L, Expected={Expected}L, Gain={Gain}L with 0 deliveries/transfers-in",
                            request.TankId, request.ClosingStock, expectedWithoutDelivery, gainOverExpected);

                        return new FMSResponseMessage(false,
                            $"UNRECORDED_DELIVERY_WARNING: Closing stock ({request.ClosingStock:N0}L) is {gainOverExpected:N0}L higher than expected ({expectedWithoutDelivery:N0}L) " +
                            $"with no recorded deliveries or transfers-in for this day. " +
                            $"Please record the delivery first, or confirm this entry if the stock level is correct.");
                    }
                }

                // ─── Detailed transaction breakdown for event template placeholders ───
                var totalManualDispensing = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing).Sum(t => t.VolumeChange);
                var totalAutomatedDispensing = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing).Sum(t => t.VolumeChange);
                var totalInTankDeliveries = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.InTankDelivery).Sum(t => t.VolumeChange);
                var totalAdjustments = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.Adjustment).Sum(t => t.VolumeChange);
                var netMovement = transactions
                    .Where(t => t.ChangeReason != VolumeChangeReasonEnum.OpeningStock && t.ChangeReason != VolumeChangeReasonEnum.ClosingStock)
                    .Sum(t => t.VolumeChange);
                var transactionCount = transactions
                    .Count(t => t.ChangeReason != VolumeChangeReasonEnum.OpeningStock && t.ChangeReason != VolumeChangeReasonEnum.ClosingStock);

                // Update the existing TankStock entry
                _context.Tankstocks.Update(existingTankStock);

                // Save changes to get the updated entry
                await _context.SaveChangesAsync(cancellationToken);

                // FIX: Use the closing stock timestamp derived from opening stock (which preserves
                // the actual timezone offset) instead of entryDate.AddHours(23).AddMinutes(55) which
                // computed the wrong UTC time when entryDate.Date stripped the timezone offset.
                // closingStockTimestamp is already defined above as openingStock.Timestamp.AddHours(23).AddMinutes(50)

                // Get the most recent transaction before closing stock to calculate volume change
                var previousTransaction = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId &&
                                   tvh.Timestamp < closingStockTimestamp &&
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
                    timestamp: closingStockTimestamp, // FIX: Use opening-stock-derived timestamp instead of entryDate-based
                    volumeChange: volumeChange,
                    stockId: existingTankStock.EntryId,  // Use existing entry ID
                    isOpening: false, // This is a closing stock
                    actionType: ActionType.Create, // This is a new closing stock
                    recordedBy: request.RecordedBy,
                    newPhysicalStockValue: request.ClosingStock, // Pass the physical stock value
                    physicalStockSource: "Manual Closing Stock", // Pass the physical stock source
                    cancellationToken: cancellationToken);

                // Track downstream warnings — these should not block the core closing stock write
                var warnings = new List<string>();

                if (!volumeUpdateResult.Success)
                {
                    _logger.LogWarning("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                    warnings.Add($"Volume history update failed: {volumeUpdateResult.Message}");
                }

                // Perform reconciliation analysis after successful closing stock entry
                StockReconciliationResult reconciliationResult = null;
                try
                {
                    reconciliationResult = await PerformReconciliationAnalysis(
                        openingStock.NewVolume ?? 0,
                        request.ClosingStock,
                        totalDeliveries ?? 0,
                        totalRefills ?? 0,
                        totalTransfersIn ?? 0,
                        totalTransfersOut ?? 0,
                        tank,
                        entryDate,
                        businessDayStart,
                        closingStockTimestamp,
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Reconciliation analysis failed for Tank {TankId}", request.TankId);
                    warnings.Add("Reconciliation analysis failed");
                }

                // Enrich reconciliation result with detailed breakdown for event templates
                if (reconciliationResult != null)
                {
                    reconciliationResult.TotalManualDispensing = totalManualDispensing ?? 0;
                    reconciliationResult.TotalAutomatedDispensing = totalAutomatedDispensing ?? 0;
                    reconciliationResult.TotalInTankDeliveries = totalInTankDeliveries ?? 0;
                    reconciliationResult.TotalAdjustments = totalAdjustments ?? 0;
                    reconciliationResult.NetMovement = netMovement ?? 0;
                    reconciliationResult.TransactionCount = transactionCount;
                }

                // Perform additional sensor vs manual variance analysis
                try
                {
                    await PerformSensorVarianceAnalysis(
                        tank,
                        request.ClosingStock,
                        entryDate,
                        request.RecordedBy,
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Sensor variance analysis failed for Tank {TankId}", request.TankId);
                    warnings.Add("Sensor variance analysis failed");
                }

                // Log reconciliation results
                if (reconciliationResult?.IsSignificantVariance == true)
                {
                    _logger.LogWarning("Significant variance detected in closing stock for Tank {TankId}: {Variance}L ({VariancePercentage}%)",
                        request.TankId, reconciliationResult.Variance, reconciliationResult.VariancePercentage);
                }

                var successMessage = "Closing stock created successfully";
                if (warnings.Count > 0)
                    successMessage += $" (with {warnings.Count} warning(s): {string.Join("; ", warnings)})";
                return new FMSResponseMessage(true, successMessage);
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
            Tank tank,
            DateTime entryDate,
            DateTime businessDayStart,
            DateTime closingStockTimestamp,
            CancellationToken cancellationToken = default)
        {
            var tankId = tank.Id;
            decimal expectedClosingStock = openingStock + totalDeliveries + totalTransfersIn + totalRefills + totalTransfersOut;
            decimal actualClosingStock = closingStock;
            decimal variance = actualClosingStock - expectedClosingStock;
            decimal variancePercentage = expectedClosingStock > 0 ? variance / expectedClosingStock * 100 : 0;

            // Determine variance type
            string varianceType = variance > 0 ? "GAIN" : variance < 0 ? "LOSS" : "BALANCED";

            // Hardcoded thresholds for discrepancy record creation (business logic).
            // Alarm/notification decisions are delegated entirely to the EventExpressionEngine
            // where users configure thresholds, severity filters, cooldowns, and recipients.
            const decimal significanceThresholdLiters = 50m;
            const decimal significanceThresholdPercentage = 5m;
            const decimal investigationThresholdLiters = 100m;
            const decimal investigationThresholdPercentage = 10m;

            bool isSignificantVariance = Math.Abs(variance) >= significanceThresholdLiters ||
                Math.Abs(variancePercentage) >= significanceThresholdPercentage;

            bool requiresInvestigation = Math.Abs(variance) >= investigationThresholdLiters ||
                Math.Abs(variancePercentage) >= investigationThresholdPercentage;

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
                BusinessWindowStartUtc = businessDayStart,
                BusinessWindowEndUtc = closingStockTimestamp,
                VarianceType = varianceType,
                IsSignificantVariance = isSignificantVariance,
                RequiresInvestigation = requiresInvestigation
            };

            // If significant variance detected, create a ReconciliationDiscrepancy record
            if (isSignificantVariance)
            {
                try
                {
                    // Tank is passed from caller — no need to re-query
                    {
                        // Determine severity based on variance magnitude
                        DiscrepancySeverity severity = DetermineSeverity(variance, variancePercentage,
                            significanceThresholdLiters, significanceThresholdPercentage,
                            investigationThresholdLiters, investigationThresholdPercentage);

                        var discrepancy = new ReconciliationDiscrepancy
                        {
                            DiscrepancyType = DiscrepancyType.ClosingStockReconciliation,
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
                            BusinessImpactScore = await CalculateBusinessImpactAsync(variance, tank, cancellationToken)
                        };

                        _context.ReconciliationDiscrepancies.Add(discrepancy);
                        await _context.SaveChangesAsync(cancellationToken);

                        _logger.LogInformation("ReconciliationDiscrepancy record created for Tank {TankId}: {Variance}L ({VariancePercentage}%)",
                            tankId, variance, variancePercentage);

                        // Fire event through the configurable Event Expression Engine
                        // The engine handles notifications, cooldown, severity matching — no direct notification needed
                        await FireDiscrepancyEventAsync(tank, variance, variancePercentage, varianceType, severity, discrepancy.Id, result, cancellationToken);
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

        private DiscrepancySeverity DetermineSeverity(decimal varianceLiters, decimal variancePercentage,
            decimal significanceThresholdLiters, decimal significanceThresholdPercent,
            decimal investigationThresholdLiters, decimal investigationThresholdPercent)
        {
            decimal absVarianceLiters = Math.Abs(varianceLiters);
            decimal absVariancePercentage = Math.Abs(variancePercentage);

            // High = investigation level, Medium = significance level, Low = below both
            if (absVarianceLiters > investigationThresholdLiters || absVariancePercentage > investigationThresholdPercent)
            {
                return DiscrepancySeverity.High;
            }

            if (absVarianceLiters > significanceThresholdLiters || absVariancePercentage > significanceThresholdPercent)
            {
                return DiscrepancySeverity.Medium;
            }

            return DiscrepancySeverity.Low;
        }

        private Task<decimal> CalculateBusinessImpactAsync(decimal varianceLiters, Tank tank, CancellationToken cancellationToken = default)
        {
            decimal absVariance = Math.Abs(varianceLiters);

            // Business impact scoring — hardcoded defaults.
            // Alarm decisions are handled by the EventExpressionEngine.
            const decimal litersPerPoint = 10m;
            const decimal maxScore = 100m;
            const decimal capacityWeightMultiplier = 2m;

            // Base impact score
            decimal impactScore = litersPerPoint > 0 ? Math.Min(absVariance / litersPerPoint, maxScore) : 0;

            // Adjust based on tank capacity if available
            if (tank.TankVolume > 0)
            {
                decimal percentageOfCapacity = absVariance / tank.TankVolume * 100;
                impactScore = Math.Max(impactScore, percentageOfCapacity * capacityWeightMultiplier);
            }

            return Task.FromResult(Math.Round(impactScore, 2));
        }

        /// <summary>
        /// Performs sensor vs manual variance analysis for closing stock entries
        /// Compares manual closing stock entry with recent sensor readings
        /// </summary>
        /// <summary>
        /// Performs sensor vs manual variance analysis for closing stock entries.
        /// Always fires SensorVarianceEvent through the EventExpressionEngine — the engine
        /// handles enable/disable, thresholds, severity filtering, cooldown, and notifications.
        /// </summary>
        private async Task PerformSensorVarianceAnalysis(
            Tank tank,
            decimal manualClosingStock,
            DateTime entryDate,
            string recordedBy,
            CancellationToken cancellationToken)
        {
            var tankId = tank.Id;
            try
            {
                if (tank.PtsId == null)
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

                // Determine severity from raw variance values (no AlertConfig dependency)
                var severity = DetermineSensorVarianceSeverity(absVariance, variancePercentage);

                // Always create discrepancy record for any non-trivial variance (> 1L)
                // The EventExpressionEngine decides whether to alarm based on user-configured expressions
                if (absVariance > 1m)
                {
                    var discrepancy = new ReconciliationDiscrepancy
                    {
                        DiscrepancyType = DiscrepancyType.SensorVariance,
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
                        BusinessImpactScore = await CalculateBusinessImpactAsync(absVariance, tank, cancellationToken)
                    };

                    _context.ReconciliationDiscrepancies.Add(discrepancy);
                    await _context.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation("Sensor vs Manual variance recorded for Tank {TankId}: Manual {Manual}L vs Sensor {Sensor}L, Variance: {Variance}L ({VariancePercentage:F2}%)",
                        tankId, manualClosingStock, sensorVolume, variance, variancePercentage);

                    // Fire event through the EventExpressionEngine — it handles all alarm decisions:
                    // enable/disable, condition evaluation, severity filtering, cooldown, notifications
                    await FireSensorVarianceEventAsync(
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
                    _logger.LogInformation("Sensor vs Manual variance negligible for Tank {TankId}: {Variance}L ({VariancePercentage:F2}%)",
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
        /// Determines severity for sensor vs manual variance using fixed severity bands.
        /// The EventExpressionEngine applies user-configured MinimumSeverity filtering.
        /// </summary>
        private static DiscrepancySeverity DetermineSensorVarianceSeverity(decimal absVarianceLiters, decimal variancePercentage)
        {
            if (absVarianceLiters >= 20m || variancePercentage >= 10m)
                return DiscrepancySeverity.Critical;
            if (absVarianceLiters >= 10m || variancePercentage >= 5m)
                return DiscrepancySeverity.High;
            if (absVarianceLiters >= 5m || variancePercentage >= 2m)
                return DiscrepancySeverity.Medium;
            return DiscrepancySeverity.Low;
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

            // ─── Transaction Breakdown ───
            public decimal TotalDeliveries { get; set; }
            public decimal TotalDispensing { get; set; }          // Dispensing + AutomatedDispensing combined
            public decimal TotalManualDispensing { get; set; }    // Manual Dispensing only
            public decimal TotalAutomatedDispensing { get; set; } // PTS AutomatedDispensing only
            public decimal TotalTransfersIn { get; set; }
            public decimal TotalTransfersOut { get; set; }
            public decimal TotalInTankDeliveries { get; set; }    // PTS auto-detected in-tank deliveries
            public decimal TotalAdjustments { get; set; }         // Manual adjustments

            // ─── Report / Summary ───
            public decimal NetMovement { get; set; }              // Sum of all VolumeChange
            public int TransactionCount { get; set; }             // Count of transactions (excl. opening/closing)
            public DateTime BusinessWindowStartUtc { get; set; }
            public DateTime BusinessWindowEndUtc { get; set; }

            public string VarianceType { get; set; } = string.Empty; // GAIN, LOSS, BALANCED
            public bool IsSignificantVariance { get; set; }
            public bool RequiresInvestigation { get; set; }
        }

        /// <summary>
        /// Builds a deep-link URL to the TankVolumeHistory report filtered for a specific tank and date.
        /// </summary>
        private string BuildTankVolumeHistoryUrl(int tankId, int siteId, DateTime windowStartUtc, DateTime windowEndUtc)
        {
            try
            {
                var baseUrl = _configuration["IssueTracker:FrontendBaseUrl"]
                           ?? _configuration["App:FrontendBaseUrl"]
                           ?? _configuration["FrontendBaseUrl"]
                           ?? _configuration["AppSettings:FrontendBaseUrl"]
                           ?? "http://localhost:3000";

                var startText = Uri.EscapeDataString(windowStartUtc.ToString("yyyy-MM-ddTHH:mm:ss"));
                var endText = Uri.EscapeDataString(windowEndUtc.ToString("yyyy-MM-ddTHH:mm:ss"));
                return $"{baseUrl.TrimEnd('/')}/reports/tank-volume-history?autoApply=1&startDate={startText}&endDate={endText}&tankIds={tankId}&siteIds={siteId}";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to build TankVolumeHistory report URL for Tank {TankId}", tankId);
                return string.Empty;
            }
        }

        /// <summary>
        /// Fires TankClosingStockEvent through the Event Expression Engine for stock discrepancy
        /// </summary>
        private async Task FireDiscrepancyEventAsync(
            Tank tank,
            decimal variance,
            decimal variancePercentage,
            string varianceType,
            DiscrepancySeverity severity,
            int discrepancyId,
            StockReconciliationResult reconciliation,
            CancellationToken cancellationToken)
        {
            try
            {
                // Get site name for the alarm message
                var site = await _context.Sites.FindAsync(tank.SiteId);
                var siteName = site?.Name ?? $"Site {tank.SiteId}";
                var businessDate = reconciliation.Date.ToString("dd MMM yyyy");

                string alarmType = $"TankStockDiscrepancy{varianceType}";

                // Build detailed alarm message with fuel day summary
                var msgBuilder = new System.Text.StringBuilder();
                msgBuilder.Append($"{siteName} | Tank {tank.Name} | {businessDate}: ");
                msgBuilder.Append($"{varianceType} of {Math.Abs(variance):N2}L ({Math.Abs(variancePercentage):F1}%). ");
                msgBuilder.Append($"Opening: {reconciliation.OpeningStock:N2}L");

                // Add non-zero transaction types
                if (reconciliation.TotalDispensing != 0)
                    msgBuilder.Append($", Dispensed: {reconciliation.TotalDispensing:N2}L");
                if (reconciliation.TotalDeliveries != 0)
                    msgBuilder.Append($", Deliveries: +{reconciliation.TotalDeliveries:N2}L");
                if (reconciliation.TotalTransfersIn != 0)
                    msgBuilder.Append($", TransfersIn: +{reconciliation.TotalTransfersIn:N2}L");
                if (reconciliation.TotalTransfersOut != 0)
                    msgBuilder.Append($", TransfersOut: {reconciliation.TotalTransfersOut:N2}L");

                if (reconciliation.TotalDispensing == 0 && reconciliation.TotalDeliveries == 0 &&
                    reconciliation.TotalTransfersIn == 0 && reconciliation.TotalTransfersOut == 0)
                    msgBuilder.Append(", NO TRANSACTIONS RECORDED");

                msgBuilder.Append($", Expected: {reconciliation.ExpectedClosingStock:N2}L");
                msgBuilder.Append($", Actual: {reconciliation.ActualClosingStock:N2}L");

                string message = msgBuilder.ToString();
                string priority = severity
                switch
                {
                    DiscrepancySeverity.Critical => "Critical",
                    DiscrepancySeverity.High => "High",
                    DiscrepancySeverity.Medium => "Medium",
                    DiscrepancySeverity.Low => "Low",
                    _ => "Medium"
                };

                // Build report deep-link URL for TankVolumeHistory
                var reportUrl = BuildTankVolumeHistoryUrl(
                    tank.Id,
                    tank.SiteId,
                    reconciliation.BusinessWindowStartUtc,
                    reconciliation.BusinessWindowEndUtc);

                // Fire TankClosingStockEvent through the event expression engine
                var stockEvent = new TankClosingStockEvent
                {
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Severity = priority,
                    Message = message,
                    TankName = tank.Name ?? "",
                    ProductName = tank.FuelGradeName ?? "",
                    SiteName = siteName,
                    // Stock Levels
                    OpeningStock = reconciliation.OpeningStock,
                    ClosingStock = reconciliation.ActualClosingStock,
                    ExpectedClosingStock = reconciliation.ExpectedClosingStock,
                    Variance = reconciliation.Variance,
                    VariancePercentage = reconciliation.VariancePercentage,
                    VarianceType = reconciliation.VarianceType,
                    // Transaction Breakdown
                    TotalDeliveries = reconciliation.TotalDeliveries,
                    TotalDispensing = reconciliation.TotalDispensing,
                    TotalManualDispensing = reconciliation.TotalManualDispensing,
                    TotalAutomatedDispensing = reconciliation.TotalAutomatedDispensing,
                    TotalTransfersIn = reconciliation.TotalTransfersIn,
                    TotalTransfersOut = reconciliation.TotalTransfersOut,
                    TotalInTankDeliveries = reconciliation.TotalInTankDeliveries,
                    TotalAdjustments = reconciliation.TotalAdjustments,
                    // Report / Summary
                    NetMovement = reconciliation.NetMovement,
                    TransactionCount = reconciliation.TransactionCount,
                    BusinessDate = businessDate,
                    BusinessDateUtc = reconciliation.Date,
                    BusinessWindowStartUtc = reconciliation.BusinessWindowStartUtc,
                    BusinessWindowEndUtc = reconciliation.BusinessWindowEndUtc,
                    ReportUrl = reportUrl,
                };
                var result = await _eventEngine.ProcessAsync(stockEvent, cancellationToken);
                _logger.LogInformation("Stock discrepancy event processed for Tank {TankId}: {TriggeredCount} triggered, {SuppressedCount} suppressed",
                    tank.Id, result.TriggeredCount, result.SuppressedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process stock discrepancy event for Tank {TankId}", tank.Id);
            }
        }

        /// <summary>
        /// Fires SensorVarianceEvent through the Event Expression Engine for sensor variance
        /// </summary>
        private async Task FireSensorVarianceEventAsync(
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

                // Fire SensorVarianceEvent through the event expression engine
                var sensorEvent = new SensorVarianceEvent
                {
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Severity = priority,
                    Message = $"Sensor vs Manual variance in Tank {tank.Name}: Manual {manualVolume}L vs Sensor {sensorVolume}L, Variance: {variance:+0.00;-0.00;0}L ({variancePercentage:F2}%)",
                    TankName = tank.Name ?? "",
                    ManualReading = manualVolume,
                    SensorReading = sensorVolume,
                    Variance = variance,
                    VariancePercentage = variancePercentage,
                    TriggeredBy = recordedBy,
                };
                var result = await _eventEngine.ProcessAsync(sensorEvent, cancellationToken);
                _logger.LogInformation("Sensor variance event processed for Tank {TankId}: {TriggeredCount} triggered, {SuppressedCount} suppressed",
                    tank.Id, result.TriggeredCount, result.SuppressedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process sensor variance event for Tank {TankId}", tank.Id);
            }
        }

    }
}