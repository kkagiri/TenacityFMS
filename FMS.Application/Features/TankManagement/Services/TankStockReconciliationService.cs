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
                var volumeHistory = await _context.TankVolumeHistories
                    .Where(vh => vh.TankId == tankId &&
                           vh.Timestamp.Date == date.Date &&
                           (vh.IsDeleted == null || vh.IsDeleted == false))
                    .OrderBy(vh => vh.Timestamp)
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

    #endregion
}
