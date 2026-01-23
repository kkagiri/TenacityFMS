using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Services
{
    /// <summary>
    /// Service to reconcile data between TankStock and TankVolumeHistory
    /// Ensures consistency for analysis and reporting
    /// </summary>
    public class TankStockReconciliationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<TankStockReconciliationService> _logger;

        public TankStockReconciliationService(
            GpsdataContext context,
            ILogger<TankStockReconciliationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Reconcile TankStock with TankVolumeHistory for a specific tank and date
        /// </summary>
        public async Task<ReconciliationResult> ReconcileTankStockForDateAsync(
            int tankId,
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            var result = new ReconciliationResult
            {
                TankId = tankId,
                ReconciliationDate = date.Date,
                StartTime = DateTime.UtcNow
            };

            try
            {
                // Get TankStock entry for this date
                var tankStock = await _context.Tankstocks
                    .Where(ts => ts.TankId == tankId &&
                           ts.EntryDate.Date == date.Date &&
                           !ts.IsDeleted)
                    .FirstOrDefaultAsync(cancellationToken);

                if (tankStock == null)
                {
                    result.Status = "NO_TANKSTOCK";
                    result.Message = $"No TankStock entry found for Tank {tankId} on {date:yyyy-MM-dd}";
                    return result;
                }

                // Get TankVolumeHistory records for this date
                // CRITICAL: Secondary sort by Id ensures consistent ordering for same-timestamp transactions
                var volumeHistory = await _context.TankVolumeHistories
                    .Where(vh => vh.TankId == tankId &&
                           vh.Timestamp.Date == date.Date &&
                           (vh.IsDeleted == null || vh.IsDeleted == false))
                    .OrderBy(vh => vh.Timestamp)
                    .ThenBy(vh => vh.Id)  // Secondary sort for deterministic ordering
                    .ToListAsync(cancellationToken);

                if (!volumeHistory.Any())
                {
                    result.Status = "NO_VOLUME_HISTORY";
                    result.Message = $"No TankVolumeHistory records found for Tank {tankId} on {date:yyyy-MM-dd}";
                    return result;
                }

                // Compare Opening Stock
                var openingHistory = volumeHistory.FirstOrDefault(vh => vh.ChangeReason == VolumeChangeReasonEnum.OpeningStock);
                if (openingHistory != null && tankStock.ManualOpeningLevel.HasValue)
                {
                    var openingDiff = Math.Abs(openingHistory.NewVolume.GetValueOrDefault() - tankStock.ManualOpeningLevel.Value);
                    if (openingDiff > 0.01m) // Allow 0.01 tolerance
                    {
                        result.DiscrepanciesFound++;
                        result.Discrepancies.Add(new Discrepancy
                        {
                            Field = "OpeningStock",
                            TankStockValue = tankStock.ManualOpeningLevel.Value,
                            VolumeHistoryValue = openingHistory.NewVolume.GetValueOrDefault(),
                            Difference = openingDiff,
                            VolumeHistoryId = openingHistory.Id
                        });
                    }
                }

                // Compare Closing Stock
                var closingHistory = volumeHistory.FirstOrDefault(vh => vh.ChangeReason == VolumeChangeReasonEnum.ClosingStock);
                if (closingHistory != null && tankStock.ManualClosingLevel.HasValue)
                {
                    var closingDiff = Math.Abs(closingHistory.NewVolume.GetValueOrDefault() - tankStock.ManualClosingLevel.Value);
                    if (closingDiff > 0.01m)
                    {
                        result.DiscrepanciesFound++;
                        result.Discrepancies.Add(new Discrepancy
                        {
                            Field = "ClosingStock",
                            TankStockValue = tankStock.ManualClosingLevel.Value,
                            VolumeHistoryValue = closingHistory.NewVolume.GetValueOrDefault(),
                            Difference = closingDiff,
                            VolumeHistoryId = closingHistory.Id
                        });
                    }
                }

                // Compare Deliveries
                var deliverySum = volumeHistory
                    .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Delivery)
                    .Sum(vh => vh.VolumeChange ?? 0);

                if (deliverySum > 0 && tankStock.DeliveryAmount.HasValue)
                {
                    var deliveryDiff = Math.Abs(deliverySum - tankStock.DeliveryAmount.Value);
                    if (deliveryDiff > 0.01m)
                    {
                        result.DiscrepanciesFound++;
                        result.Discrepancies.Add(new Discrepancy
                        {
                            Field = "Delivery",
                            TankStockValue = tankStock.DeliveryAmount.Value,
                            VolumeHistoryValue = deliverySum,
                            Difference = deliveryDiff
                        });
                    }
                }

                // Compare Transfers In
                var transferInSum = volumeHistory
                    .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                    .Sum(vh => vh.VolumeChange ?? 0);

                if (transferInSum > 0 && tankStock.TransferInAmount.HasValue)
                {
                    var transferInDiff = Math.Abs(transferInSum - tankStock.TransferInAmount.Value);
                    if (transferInDiff > 0.01m)
                    {
                        result.DiscrepanciesFound++;
                        result.Discrepancies.Add(new Discrepancy
                        {
                            Field = "TransferIn",
                            TankStockValue = tankStock.TransferInAmount.Value,
                            VolumeHistoryValue = transferInSum,
                            Difference = transferInDiff
                        });
                    }
                }

                // Compare Transfers Out
                var transferOutSum = Math.Abs(volumeHistory
                    .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                    .Sum(vh => vh.VolumeChange ?? 0));

                if (transferOutSum > 0 && tankStock.TransferOutAmount.HasValue)
                {
                    var transferOutDiff = Math.Abs(transferOutSum - tankStock.TransferOutAmount.Value);
                    if (transferOutDiff > 0.01m)
                    {
                        result.DiscrepanciesFound++;
                        result.Discrepancies.Add(new Discrepancy
                        {
                            Field = "TransferOut",
                            TankStockValue = tankStock.TransferOutAmount.Value,
                            VolumeHistoryValue = transferOutSum,
                            Difference = transferOutDiff
                        });
                    }
                }

                result.Status = result.DiscrepanciesFound > 0 ? "DISCREPANCIES_FOUND" : "RECONCILED";
                result.Message = result.DiscrepanciesFound > 0
                    ? $"Found {result.DiscrepanciesFound} discrepancies between TankStock and TankVolumeHistory"
                    : "Data is consistent between TankStock and TankVolumeHistory";

                result.TankStockEntryId = tankStock.EntryId;
                result.VolumeHistoryRecordCount = volumeHistory.Count;

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reconciling TankStock for Tank {TankId} on {Date}", tankId, date);
                result.Status = "ERROR";
                result.Message = $"Error during reconciliation: {ex.Message}";
                return result;
            }
            finally
            {
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime.Value - result.StartTime;
            }
        }

        /// <summary>
        /// Fix discrepancies by updating TankVolumeHistory to match TankStock (TankStock is source of truth)
        /// </summary>
        public async Task<FixResult> FixDiscrepanciesAsync(
            ReconciliationResult reconciliationResult,
            string fixedBy,
            CancellationToken cancellationToken = default)
        {
            var fixResult = new FixResult
            {
                TankId = reconciliationResult.TankId,
                ReconciliationDate = reconciliationResult.ReconciliationDate,
                StartTime = DateTime.UtcNow
            };

            if (reconciliationResult.DiscrepanciesFound == 0)
            {
                fixResult.Status = "NO_FIXES_NEEDED";
                fixResult.Message = "No discrepancies to fix";
                return fixResult;
            }

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                foreach (var discrepancy in reconciliationResult.Discrepancies)
                {
                    if (discrepancy.VolumeHistoryId.HasValue)
                    {
                        // Fix specific volume history record
                        var volumeHistory = await _context.TankVolumeHistories
                            .FindAsync(new object[] { discrepancy.VolumeHistoryId.Value }, cancellationToken);

                        if (volumeHistory != null)
                        {
                            var oldValue = volumeHistory.NewVolume;
                            volumeHistory.NewVolume = discrepancy.TankStockValue;

                            // Recalculate VolumeChange if it was a stock entry
                            if (volumeHistory.ChangeReason == VolumeChangeReasonEnum.OpeningStock ||
                                volumeHistory.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                            {
                                var previousRecord = await _context.TankVolumeHistories
                                    .Where(vh => vh.TankId == volumeHistory.TankId &&
                                           vh.Timestamp < volumeHistory.Timestamp &&
                                           (vh.IsDeleted == null || vh.IsDeleted == false))
                                    .OrderByDescending(vh => vh.Timestamp)
                                    .FirstOrDefaultAsync(cancellationToken);

                                if (previousRecord != null && previousRecord.NewVolume.HasValue)
                                {
                                    volumeHistory.VolumeChange = discrepancy.TankStockValue - previousRecord.NewVolume.Value;
                                }
                            }

                            fixResult.RecordsFixed++;
                            fixResult.FixDetails.Add($"Fixed {discrepancy.Field}: {oldValue} → {discrepancy.TankStockValue}");

                            _logger.LogInformation(
                                "Fixed {Field} for Tank {TankId} on {Date}: {OldValue} → {NewValue}",
                                discrepancy.Field, reconciliationResult.TankId,
                                reconciliationResult.ReconciliationDate, oldValue, discrepancy.TankStockValue);
                        }
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                fixResult.Status = "SUCCESS";
                fixResult.Message = $"Successfully fixed {fixResult.RecordsFixed} records";

                return fixResult;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error fixing discrepancies for Tank {TankId} on {Date}",
                    reconciliationResult.TankId, reconciliationResult.ReconciliationDate);

                fixResult.Status = "ERROR";
                fixResult.Message = $"Error fixing discrepancies: {ex.Message}";
                return fixResult;
            }
            finally
            {
                fixResult.EndTime = DateTime.UtcNow;
                fixResult.Duration = fixResult.EndTime.Value - fixResult.StartTime;
            }
        }

        /// <summary>
        /// Batch reconciliation for a date range
        /// </summary>
        public async Task<BatchReconciliationResult> ReconcileDateRangeAsync(
            int tankId,
            DateTime startDate,
            DateTime endDate,
            bool autoFix = false,
            string fixedBy = "SYSTEM",
            CancellationToken cancellationToken = default)
        {
            var batchResult = new BatchReconciliationResult
            {
                TankId = tankId,
                StartDate = startDate.Date,
                EndDate = endDate.Date,
                StartTime = DateTime.UtcNow
            };

            try
            {
                for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
                {
                    var reconciliation = await ReconcileTankStockForDateAsync(tankId, date, cancellationToken);
                    batchResult.Results.Add(reconciliation);
                    batchResult.TotalDaysProcessed++;

                    if (reconciliation.DiscrepanciesFound > 0)
                    {
                        batchResult.TotalDiscrepancies += reconciliation.DiscrepanciesFound;
                        batchResult.DaysWithDiscrepancies++;

                        if (autoFix)
                        {
                            var fixResult = await FixDiscrepanciesAsync(reconciliation, fixedBy, cancellationToken);
                            if (fixResult.Status == "SUCCESS")
                            {
                                batchResult.TotalRecordsFixed += fixResult.RecordsFixed;
                            }
                        }
                    }
                }

                batchResult.Status = batchResult.TotalDiscrepancies > 0
                    ? (autoFix ? "FIXED" : "DISCREPANCIES_FOUND")
                    : "RECONCILED";

                batchResult.Message = autoFix && batchResult.TotalRecordsFixed > 0
                    ? $"Processed {batchResult.TotalDaysProcessed} days, found {batchResult.TotalDiscrepancies} discrepancies, fixed {batchResult.TotalRecordsFixed} records"
                    : $"Processed {batchResult.TotalDaysProcessed} days, found {batchResult.TotalDiscrepancies} discrepancies";

                return batchResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch reconciliation for Tank {TankId}", tankId);
                batchResult.Status = "ERROR";
                batchResult.Message = $"Batch reconciliation error: {ex.Message}";
                return batchResult;
            }
            finally
            {
                batchResult.EndTime = DateTime.UtcNow;
                batchResult.Duration = batchResult.EndTime.Value - batchResult.StartTime;
            }
        }

        /// <summary>
        /// Reconcile all tanks for a specific date
        /// </summary>
        public async Task<List<ReconciliationResult>> ReconcileAllTanksForDateAsync(
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            // Get distinct tank IDs from Tankstock for the specified date
            var tankIds = await _context.Tankstocks
                .Where(ts => ts.EntryDate.Date == date.Date && (ts.IsDeleted == null || ts.IsDeleted == false))
                .Select(ts => ts.TankId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var results = new List<ReconciliationResult>();

            foreach (var tankId in tankIds)
            {
                var result = await ReconcileTankStockForDateAsync(tankId, date, cancellationToken);
                results.Add(result);
            }

            return results;
        }

        /// <summary>
        /// Detect tanks with critically negative CurrentStock values
        /// These indicate data integrity issues that need immediate attention
        /// </summary>
        /// <param name="threshold">The negative threshold (e.g., -1000 means flag tanks with stock below -1000L)</param>
        public async Task<List<CriticallyNegativeTankResult>> DetectCriticallyNegativeTanksAsync(
            decimal threshold = -1000,
            CancellationToken cancellationToken = default)
        {
            var results = new List<CriticallyNegativeTankResult>();

            try
            {
                var criticalTanks = await _context.Tanks
                    .Where(t => t.CurrentStock < threshold)
                    .Include(t => t.Site)
                    .ToListAsync(cancellationToken);

                foreach (var tank in criticalTanks)
                {
                    // Get the latest volume history to understand the discrepancy
                    var latestHistory = await _context.TankVolumeHistories
                        .Where(h => h.TankId == tank.Id && (h.IsDeleted == null || h.IsDeleted == false))
                        .OrderByDescending(h => h.Timestamp)
                        .ThenByDescending(h => h.Id)
                        .FirstOrDefaultAsync(cancellationToken);

                    var result = new CriticallyNegativeTankResult
                    {
                        TankId = tank.Id,
                        TankName = tank.Name ?? $"Tank {tank.Id}",
                        SiteId = tank.SiteId,
                        SiteName = tank.Site?.Name ?? "Unknown",
                        CurrentStock = tank.CurrentStock ?? 0,
                        PhysicalStockValue = tank.PhysicalStockValue ?? 0,
                        LastStockUpdate = tank.LastStockUpdate,
                        LatestVolumeHistoryValue = latestHistory?.NewVolume ?? 0,
                        LatestVolumeHistoryTimestamp = latestHistory?.Timestamp,
                        Discrepancy = (latestHistory?.NewVolume ?? 0) - (tank.CurrentStock ?? 0),
                        Severity = GetSeverity(tank.CurrentStock ?? 0, threshold)
                    };

                    results.Add(result);

                    _logger.LogWarning(
                        "[StockReconciliation] 🚨 CRITICALLY NEGATIVE TANK DETECTED: Tank {TankId} ({TankName}) at Site {SiteName}, " +
                        "CurrentStock={CurrentStock:N0}L, PhysicalStock={PhysicalStock:N0}L, LatestHistoryValue={HistoryValue:N0}L, Severity={Severity}",
                        tank.Id, tank.Name, tank.Site?.Name,
                        tank.CurrentStock, tank.PhysicalStockValue, latestHistory?.NewVolume, result.Severity);
                }

                _logger.LogInformation(
                    "[StockReconciliation] Detected {Count} critically negative tanks (threshold: {Threshold:N0}L)",
                    results.Count, threshold);

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StockReconciliation] Error detecting critically negative tanks");
                throw;
            }
        }

        private string GetSeverity(decimal currentStock, decimal threshold)
        {
            if (currentStock < threshold * 10) return "CRITICAL"; // 10x threshold
            if (currentStock < threshold * 5) return "HIGH";      // 5x threshold
            if (currentStock < threshold * 2) return "MEDIUM";    // 2x threshold
            return "LOW";
        }

        /// <summary>
        /// Sync Tank.CurrentStock with the latest TankVolumeHistory record
        /// This fixes cases where CurrentStock has drifted from the ledger
        /// </summary>
        public async Task<TankStockSyncResult> SyncTankCurrentStockWithHistoryAsync(
            int tankId,
            string syncedBy = "SYSTEM",
            CancellationToken cancellationToken = default)
        {
            var result = new TankStockSyncResult
            {
                TankId = tankId,
                SyncedBy = syncedBy,
                SyncedAt = DateTime.UtcNow
            };

            try
            {
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);

                if (tank == null)
                {
                    result.Success = false;
                    result.Message = $"Tank {tankId} not found";
                    return result;
                }

                // Get the latest volume history for this tank
                var latestHistory = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId && (h.IsDeleted == null || h.IsDeleted == false))
                    .OrderByDescending(h => h.Timestamp)
                    .ThenByDescending(h => h.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                result.OldCurrentStock = tank.CurrentStock ?? 0;
                result.OldPhysicalStock = tank.PhysicalStockValue ?? 0;
                result.LatestHistoryValue = latestHistory?.NewVolume ?? 0;
                result.LatestHistoryTimestamp = latestHistory?.Timestamp;

                if (latestHistory == null || !latestHistory.NewVolume.HasValue)
                {
                    result.Success = false;
                    result.Message = $"No volume history found for Tank {tankId}";
                    return result;
                }

                var oldStock = tank.CurrentStock ?? 0;
                var newStock = latestHistory.NewVolume.Value;
                var difference = newStock - oldStock;

                // Only update if there's a significant difference (more than 0.01L)
                if (Math.Abs(difference) > 0.01m)
                {
                    tank.CurrentStock = newStock;
                    tank.LastStockUpdate = DateTime.UtcNow;

                    // Create a reconciliation entry in volume history
                    var reconciliationRecord = new global::FMS.Domain.Entities.Features.TankStockManagement.TankVolumeHistory
                    {
                        TankId = tankId,
                        Timestamp = DateTime.UtcNow,
                        VolumeChange = difference,
                        NewVolume = newStock,
                        ChangeReason = VolumeChangeReasonEnum.Reconciliation,
                        RecordedBy = syncedBy,
                        ReferenceType = "STOCK_SYNC",
                        CreatedOn = DateTime.UtcNow
                    };

                    _context.TankVolumeHistories.Add(reconciliationRecord);
                    _context.Tanks.Update(tank);
                    await _context.SaveChangesAsync(cancellationToken);

                    result.Success = true;
                    result.NewCurrentStock = newStock;
                    result.Adjustment = difference;
                    result.ReconciliationRecordId = reconciliationRecord.Id;
                    result.Message = $"Tank {tankId} CurrentStock synced: {oldStock:N2}L → {newStock:N2}L (adjustment: {difference:N2}L)";

                    _logger.LogInformation(
                        "[StockReconciliation] ✅ Tank {TankId} CurrentStock synced with history: {OldStock:N2}L → {NewStock:N2}L (adjustment: {Diff:N2}L)",
                        tankId, oldStock, newStock, difference);
                }
                else
                {
                    result.Success = true;
                    result.NewCurrentStock = oldStock;
                    result.Adjustment = 0;
                    result.Message = $"Tank {tankId} CurrentStock already in sync with history";
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StockReconciliation] Error syncing Tank {TankId} CurrentStock", tankId);
                result.Success = false;
                result.Message = $"Error syncing tank: {ex.Message}";
                return result;
            }
        }

        /// <summary>
        /// Fix all critically negative tanks by syncing with their latest volume history
        /// </summary>
        public async Task<BatchTankSyncResult> FixCriticallyNegativeTanksAsync(
            decimal threshold = -1000,
            string fixedBy = "DAILY_RECONCILIATION",
            CancellationToken cancellationToken = default)
        {
            var batchResult = new BatchTankSyncResult
            {
                StartTime = DateTime.UtcNow,
                Threshold = threshold,
                FixedBy = fixedBy
            };

            try
            {
                // First detect all critically negative tanks
                var criticalTanks = await DetectCriticallyNegativeTanksAsync(threshold, cancellationToken);
                batchResult.TotalCriticalTanks = criticalTanks.Count;

                foreach (var criticalTank in criticalTanks)
                {
                    var syncResult = await SyncTankCurrentStockWithHistoryAsync(
                        criticalTank.TankId, fixedBy, cancellationToken);

                    batchResult.SyncResults.Add(syncResult);

                    if (syncResult.Success && syncResult.Adjustment != 0)
                    {
                        batchResult.TanksFixed++;
                    }
                }

                batchResult.EndTime = DateTime.UtcNow;
                batchResult.Success = true;
                batchResult.Message = $"Processed {batchResult.TotalCriticalTanks} critical tanks, fixed {batchResult.TanksFixed}";

                _logger.LogInformation(
                    "[StockReconciliation] Batch fix completed: {Total} critical tanks found, {Fixed} fixed",
                    batchResult.TotalCriticalTanks, batchResult.TanksFixed);

                return batchResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StockReconciliation] Error in batch fix of critically negative tanks");
                batchResult.Success = false;
                batchResult.Message = $"Error: {ex.Message}";
                batchResult.EndTime = DateTime.UtcNow;
                return batchResult;
            }
        }

        /// <summary>
        /// Clean up corrupted TankVolumeHistory records for a tank and optionally create a fresh starting point.
        /// This method soft-deletes all existing TankVolumeHistory records and creates a new opening stock entry
        /// based on the current Tank.CurrentStock or Tank.PhysicalStockValue.
        /// </summary>
        /// <param name="tankId">The ID of the tank to clean up</param>
        /// <param name="usePhysicalStock">If true, uses PhysicalStockValue as the new baseline; otherwise uses CurrentStock</param>
        /// <param name="createNewOpeningStock">If true, creates a new opening stock entry as the starting point</param>
        /// <param name="cleanedBy">The user/system performing the cleanup</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result of the cleanup operation</returns>
        public async Task<VolumeHistoryCleanupResult> CleanupCorruptedVolumeHistoryAsync(
            int tankId,
            bool usePhysicalStock = false,
            bool createNewOpeningStock = true,
            string cleanedBy = "SYSTEM_CLEANUP",
            CancellationToken cancellationToken = default)
        {
            var result = new VolumeHistoryCleanupResult
            {
                TankId = tankId,
                CleanupTime = DateTime.UtcNow,
                CleanedBy = cleanedBy
            };

            try
            {
                // Get the tank
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);

                if (tank == null)
                {
                    result.Success = false;
                    result.Message = $"Tank with ID {tankId} not found";
                    return result;
                }

                result.TankName = tank.Name ?? $"Tank {tankId}";

                // Determine the new baseline value
                var newBaselineValue = usePhysicalStock
                    ? (tank.PhysicalStockValue ?? tank.CurrentStock ?? 0)
                    : (tank.CurrentStock ?? tank.PhysicalStockValue ?? 0);

                if (newBaselineValue <= 0)
                {
                    result.Success = false;
                    result.Message = $"Cannot cleanup tank {tankId}: Both CurrentStock ({tank.CurrentStock}) and PhysicalStockValue ({tank.PhysicalStockValue}) are zero or negative. Please set a valid stock value first.";
                    return result;
                }

                _logger.LogWarning(
                    "[StockReconciliation] 🧹 Starting cleanup for Tank {TankId} ({TankName}). " +
                    "CurrentStock: {CurrentStock:N2}L, PhysicalStock: {PhysicalStock:N2}L, " +
                    "New Baseline: {NewBaseline:N2}L (using {Source})",
                    tankId, result.TankName, tank.CurrentStock, tank.PhysicalStockValue,
                    newBaselineValue, usePhysicalStock ? "PhysicalStockValue" : "CurrentStock");

                // Get all TankVolumeHistory records for this tank
                var allHistoryRecords = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId && (h.IsDeleted == null || h.IsDeleted == false))
                    .ToListAsync(cancellationToken);

                if (allHistoryRecords.Any())
                {
                    // Soft-delete all records
                    foreach (var record in allHistoryRecords)
                    {
                        record.IsDeleted = true;
                    }
                    result.RecordsSoftDeleted = allHistoryRecords.Count;

                    _logger.LogInformation(
                        "[StockReconciliation] Soft-deleted {Count} TankVolumeHistory records for Tank {TankId}",
                        allHistoryRecords.Count, tankId);
                }

                // Create a new opening stock entry as the fresh starting point
                if (createNewOpeningStock)
                {
                    var now = DateTime.UtcNow;
                    var newOpeningRecord = new global::FMS.Domain.Entities.Features.TankStockManagement.TankVolumeHistory
                    {
                        TankId = tankId,
                        Timestamp = now,
                        VolumeChange = newBaselineValue, // Full amount as the opening
                        NewVolume = newBaselineValue,
                        ChangeReason = VolumeChangeReasonEnum.OpeningStock,
                        RecordedBy = cleanedBy,
                        ReferenceType = "CLEANUP_RESET",
                        CreatedOn = now
                    };

                    _context.TankVolumeHistories.Add(newOpeningRecord);
                    result.NewOpeningStockCreated = true;
                    result.NewOpeningStockValue = newBaselineValue;

                    // Update tank's CurrentStock to match
                    tank.CurrentStock = newBaselineValue;
                    tank.LastStockUpdate = now;
                    _context.Tanks.Update(tank);

                    _logger.LogInformation(
                        "[StockReconciliation] Created new opening stock entry for Tank {TankId}: {Volume:N2}L",
                        tankId, newBaselineValue);
                }

                await _context.SaveChangesAsync(cancellationToken);

                result.Success = true;
                result.Message = $"Successfully cleaned up Tank {tankId} ({result.TankName}). " +
                    $"Soft-deleted {result.RecordsSoftDeleted} records. " +
                    (createNewOpeningStock ? $"Created new opening stock: {newBaselineValue:N2}L" : "No new opening stock created.");

                _logger.LogWarning(
                    "[StockReconciliation] ✅ CLEANUP COMPLETE for Tank {TankId}: " +
                    "Deleted {DeletedCount} records, New Opening Stock: {NewOpening:N2}L",
                    tankId, result.RecordsSoftDeleted, result.NewOpeningStockValue);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StockReconciliation] Error cleaning up Tank {TankId}", tankId);
                result.Success = false;
                result.Message = $"Error during cleanup: {ex.Message}";
                return result;
            }
        }

        /// <summary>
        /// Clean up corrupted TankVolumeHistory for multiple tanks based on a threshold
        /// </summary>
        public async Task<List<VolumeHistoryCleanupResult>> CleanupCorruptedTanksAsync(
            decimal corruptionThreshold = -10000,
            bool usePhysicalStock = false,
            string cleanedBy = "BATCH_CLEANUP",
            CancellationToken cancellationToken = default)
        {
            var results = new List<VolumeHistoryCleanupResult>();

            try
            {
                // Find tanks where the latest TankVolumeHistory.NewVolume is severely negative
                // but Tank.CurrentStock or PhysicalStockValue is positive
                var corruptedTankIds = await _context.TankVolumeHistories
                    .Where(h => h.IsDeleted != true)
                    .GroupBy(h => h.TankId)
                    .Select(g => new
                    {
                        TankId = g.Key,
                        LatestVolume = g.OrderByDescending(h => h.Timestamp).ThenByDescending(h => h.Id).FirstOrDefault()!.NewVolume
                    })
                    .Where(x => x.LatestVolume < corruptionThreshold)
                    .Select(x => x.TankId)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation(
                    "[StockReconciliation] Found {Count} tanks with severely corrupted history (threshold: {Threshold:N0}L)",
                    corruptedTankIds.Count, corruptionThreshold);

                // Now filter to only tanks where CurrentStock is positive
                var tanksToCleanup = await _context.Tanks
                    .Where(t => corruptedTankIds.Contains(t.Id) &&
                        ((t.CurrentStock ?? 0) > 0 || (t.PhysicalStockValue ?? 0) > 0))
                    .Select(t => t.Id)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation(
                    "[StockReconciliation] {Count} tanks have positive stock values and will be cleaned up",
                    tanksToCleanup.Count);

                foreach (var tankId in tanksToCleanup)
                {
                    var cleanupResult = await CleanupCorruptedVolumeHistoryAsync(
                        tankId, usePhysicalStock, true, cleanedBy, cancellationToken);
                    results.Add(cleanupResult);
                }

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StockReconciliation] Error in batch cleanup of corrupted tanks");
                throw;
            }
        }
    }

    #region Result Classes

    public class ReconciliationResult
    {
        public int TankId { get; set; }
        public DateTime ReconciliationDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int DiscrepanciesFound { get; set; }
        public List<Discrepancy> Discrepancies { get; set; } = new();
        public int? TankStockEntryId { get; set; }
        public int VolumeHistoryRecordCount { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public TimeSpan? Duration { get; set; }
    }

    public class Discrepancy
    {
        public string Field { get; set; } = string.Empty;
        public decimal TankStockValue { get; set; }
        public decimal VolumeHistoryValue { get; set; }
        public decimal Difference { get; set; }
        public int? VolumeHistoryId { get; set; }
    }

    public class FixResult
    {
        public int TankId { get; set; }
        public DateTime ReconciliationDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int RecordsFixed { get; set; }
        public List<string> FixDetails { get; set; } = new();
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public TimeSpan? Duration { get; set; }
    }

    public class BatchReconciliationResult
    {
        public int TankId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int TotalDaysProcessed { get; set; }
        public int DaysWithDiscrepancies { get; set; }
        public int TotalDiscrepancies { get; set; }
        public int TotalRecordsFixed { get; set; }
        public List<ReconciliationResult> Results { get; set; } = new();
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public TimeSpan? Duration { get; set; }
    }

    /// <summary>
    /// Result for detecting critically negative tanks
    /// </summary>
    public class CriticallyNegativeTankResult
    {
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public int? SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public decimal CurrentStock { get; set; }
        public decimal PhysicalStockValue { get; set; }
        public DateTime? LastStockUpdate { get; set; }
        public decimal LatestVolumeHistoryValue { get; set; }
        public DateTime? LatestVolumeHistoryTimestamp { get; set; }
        public decimal Discrepancy { get; set; }
        public string Severity { get; set; } = "LOW";
    }

    /// <summary>
    /// Result for syncing tank CurrentStock with volume history
    /// </summary>
    public class TankStockSyncResult
    {
        public int TankId { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal OldCurrentStock { get; set; }
        public decimal OldPhysicalStock { get; set; }
        public decimal NewCurrentStock { get; set; }
        public decimal Adjustment { get; set; }
        public decimal LatestHistoryValue { get; set; }
        public DateTime? LatestHistoryTimestamp { get; set; }
        public int? ReconciliationRecordId { get; set; }
        public string SyncedBy { get; set; } = string.Empty;
        public DateTime SyncedAt { get; set; }
    }

    /// <summary>
    /// Result for batch fixing critically negative tanks
    /// </summary>
    public class BatchTankSyncResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal Threshold { get; set; }
        public string FixedBy { get; set; } = string.Empty;
        public int TotalCriticalTanks { get; set; }
        public int TanksFixed { get; set; }
        public List<TankStockSyncResult> SyncResults { get; set; } = new();
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
    }

    /// <summary>
    /// Result for cleaning up corrupted TankVolumeHistory records
    /// </summary>
    public class VolumeHistoryCleanupResult
    {
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int RecordsDeleted { get; set; }
        public int RecordsSoftDeleted { get; set; }
        public bool NewOpeningStockCreated { get; set; }
        public decimal? NewOpeningStockValue { get; set; }
        public DateTime CleanupTime { get; set; }
        public string CleanedBy { get; set; } = string.Empty;
    }

    #endregion
}
