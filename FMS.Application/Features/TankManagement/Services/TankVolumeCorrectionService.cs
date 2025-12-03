using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Services
{
    /// <summary>
    /// Service for correcting corrupted tank volume history data
    /// Implements three correction strategies:
    /// 1. RECALCULATE - Rebuild NewVolume values from opening stock and volume changes
    /// 2. MANUAL - Allow admin to manually correct specific transactions
    /// 3. ROLLBACK - Restore from backup or delete affected period
    /// </summary>
    public interface ITankVolumeCorrectionService
    {
        Task<CorrectionExecutionResult> RecalculateTankVolumesAsync(int tankId, DateTime fromDate, DateTime toDate, string executedBy, CancellationToken cancellationToken = default);
        Task<CorrectionExecutionResult> ManualCorrectTransactionAsync(int transactionId, decimal newVolume, string reason, string executedBy, CancellationToken cancellationToken = default);
        Task<CorrectionExecutionResult> RecalculateSingleTransactionAsync(int transactionId, string executedBy, CancellationToken cancellationToken = default);
        Task<CorrectionExecutionResult> RecalculateFromTransactionAsync(int startTransactionId, DateTime toDate, string executedBy, CancellationToken cancellationToken = default);
        Task<BulkCorrectionResult> ExecuteBulkCorrectionAsync(List<BulkCorrectionRequest> corrections, string executedBy, CancellationToken cancellationToken = default);
    }

    public class TankVolumeCorrectionService : ITankVolumeCorrectionService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<TankVolumeCorrectionService> _logger;
        private const decimal TOLERANCE = 0.01m;

        public TankVolumeCorrectionService(
            GpsdataContext context,
            ILogger<TankVolumeCorrectionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// STRATEGY 1: RECALCULATE
        /// Rebuilds all NewVolume values from opening stock through all transactions
        /// Most reliable but requires valid opening stock
        /// </summary>
        public async Task<CorrectionExecutionResult> RecalculateTankVolumesAsync(
            int tankId,
            DateTime fromDate,
            DateTime toDate,
            string executedBy,
            CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                _logger.LogInformation("Starting bulk recalculation for Tank {TankId} from {FromDate} to {ToDate}",
                    tankId, fromDate.Date, toDate.Date);

                var result = new CorrectionExecutionResult
                {
                    TankId = tankId,
                    Strategy = "RECALCULATE",
                    StartDate = fromDate.Date,
                    EndDate = toDate.Date,
                    ExecutedBy = executedBy,
                    Timestamp = DateTime.UtcNow
                };

                // Get opening stock for the fromDate
                var openingStock = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.Timestamp.Date == fromDate.Date &&
                                h.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                                (h.IsDeleted != true))
                    .FirstOrDefaultAsync(cancellationToken);

                if (openingStock == null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    result.Success = false;
                    result.ErrorMessage = $"No opening stock found for Tank {tankId} on {fromDate.Date:yyyy-MM-dd}. " +
                        "Cannot recalculate without valid opening stock baseline.";
                    _logger.LogError(result.ErrorMessage);
                    return result;
                }

                // Get all transactions in the date range ordered by timestamp and ID
                var transactions = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.Timestamp.Date >= fromDate.Date &&
                                h.Timestamp.Date <= toDate.Date &&
                                (h.IsDeleted != true))
                    .OrderBy(h => h.Timestamp)
                    .ThenBy(h => h.Id)
                    .ToListAsync(cancellationToken);

                if (!transactions.Any())
                {
                    result.Success = false;
                    result.ErrorMessage = "No transactions found for the specified date range";
                    return result;
                }

                _logger.LogInformation("Found {TransactionCount} transactions to recalculate for Tank {TankId}",
                    transactions.Count, tankId);

                // Recalculate each transaction's NewVolume
                decimal currentVolume = openingStock.NewVolume ?? 0m;
                var correctedTransactions = new List<(int Id, decimal OldVolume, decimal NewVolume, bool Changed)>();

                for (int i = 0; i < transactions.Count; i++)
                {
                    var txn = transactions[i];

                    // Skip opening stock - it's the baseline
                    if (txn.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    {
                        currentVolume = txn.NewVolume ?? 0m;
                        continue;
                    }

                    decimal expectedNewVolume = currentVolume + (txn.VolumeChange ?? 0m);
                    decimal oldNewVolume = txn.NewVolume ?? 0m;
                    bool changed = Math.Abs(expectedNewVolume - oldNewVolume) > TOLERANCE;

                    correctedTransactions.Add((
                        Id: txn.Id,
                        OldVolume: oldNewVolume,
                        NewVolume: expectedNewVolume,
                        Changed: changed
                    ));

                    // Update the transaction
                    txn.NewVolume = expectedNewVolume;
                    _context.TankVolumeHistories.Update(txn);

                    currentVolume = expectedNewVolume;

                    if (changed)
                    {
                        _logger.LogInformation(
                            "Corrected Txn {TransactionId}: {Reason} at {Timestamp} - " +
                            "Volume {OldVolume:F2}L -> {NewVolume:F2}L (Change: {VolumeChange:F2}L)",
                            txn.Id, txn.ChangeReason, txn.Timestamp, oldNewVolume, expectedNewVolume,
                            txn.VolumeChange);
                    }
                }

                // Save all corrections
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                // Prepare result
                var changedCount = correctedTransactions.Count(c => c.Changed);
                result.Success = true;
                result.TransactionsProcessed = transactions.Count;
                result.TransactionsCorrect = transactions.Count - changedCount;
                result.TransactionsCorrected = changedCount;
                result.Message = $"Successfully recalculated {transactions.Count} transactions, " +
                    $"corrected {changedCount} volumes, {transactions.Count - changedCount} were already correct";

                _logger.LogInformation(result.Message);

                return result;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error during tank volume recalculation for Tank {TankId}", tankId);

                return new CorrectionExecutionResult
                {
                    TankId = tankId,
                    Strategy = "RECALCULATE",
                    Success = false,
                    ErrorMessage = $"Error during recalculation: {ex.Message}",
                    Timestamp = DateTime.UtcNow,
                    ExecutedBy = executedBy
                };
            }
        }

        /// <summary>
        /// STRATEGY 2: MANUAL
        /// Allows admin to manually correct a single transaction and cascade fixes downstream
        /// </summary>
        public async Task<CorrectionExecutionResult> ManualCorrectTransactionAsync(
            int transactionId,
            decimal newVolume,
            string reason,
            string executedBy,
            CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                _logger.LogInformation("Starting manual correction for Transaction {TransactionId}: NewVolume={NewVolume}L, Reason: {Reason}",
                    transactionId, newVolume, reason);

                var result = new CorrectionExecutionResult
                {
                    Strategy = "MANUAL",
                    ExecutedBy = executedBy,
                    Timestamp = DateTime.UtcNow
                };

                // Get the transaction to correct
                var txn = await _context.TankVolumeHistories
                    .FirstOrDefaultAsync(h => h.Id == transactionId && (h.IsDeleted != true), cancellationToken);

                if (txn == null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    result.Success = false;
                    result.ErrorMessage = $"Transaction {transactionId} not found";
                    return result;
                }

                result.TankId = txn.TankId;
                decimal volumeDifference = newVolume - (txn.NewVolume ?? 0m);

                // Update the transaction
                decimal oldVolume = txn.NewVolume ?? 0m;
                txn.NewVolume = newVolume;
                _context.TankVolumeHistories.Update(txn);
                await _context.SaveChangesAsync(cancellationToken);

                // CASCADE: Update all subsequent transactions for this tank
                var affectedTransactions = await _context.TankVolumeHistories
                    .Where(h => h.TankId == txn.TankId &&
                                h.Timestamp > txn.Timestamp &&
                                (h.IsDeleted != true))
                    .OrderBy(h => h.Timestamp)
                    .ThenBy(h => h.Id)
                    .ToListAsync(cancellationToken);

                var cascadeCount = 0;
                foreach (var affectedTxn in affectedTransactions)
                {
                    if (affectedTxn.NewVolume.HasValue)
                    {
                        affectedTxn.NewVolume += volumeDifference;
                        _context.TankVolumeHistories.Update(affectedTxn);
                        cascadeCount++;
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                result.Success = true;
                result.TransactionsProcessed = 1;
                result.TransactionsCorrected = 1;
                result.Message = $"Transaction {transactionId} corrected: {oldVolume:F2}L -> {newVolume:F2}L. " +
                    $"Cascaded correction to {cascadeCount} downstream transactions with +{volumeDifference:F2}L";

                _logger.LogInformation(result.Message);

                return result;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error during manual correction for Transaction {TransactionId}", transactionId);

                return new CorrectionExecutionResult
                {
                    Strategy = "MANUAL",
                    Success = false,
                    ErrorMessage = $"Error during manual correction: {ex.Message}",
                    Timestamp = DateTime.UtcNow,
                    ExecutedBy = executedBy
                };
            }
        }

        /// <summary>
        /// STRATEGY 3: RECALCULATE FROM POINT
        /// Recalculates a single transaction based on previous, then cascades corrections downstream
        /// </summary>
        public async Task<CorrectionExecutionResult> RecalculateSingleTransactionAsync(
            int transactionId,
            string executedBy,
            CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var txn = await _context.TankVolumeHistories
                    .FirstOrDefaultAsync(h => h.Id == transactionId && (h.IsDeleted != true), cancellationToken);

                if (txn == null)
                {
                    var result = new CorrectionExecutionResult { Success = false, ErrorMessage = "Transaction not found" };
                    return result;
                }

                // Get previous transaction
                var previous = await _context.TankVolumeHistories
                    .Where(h => h.TankId == txn.TankId &&
                                h.Timestamp < txn.Timestamp &&
                                (h.IsDeleted != true))
                    .OrderByDescending(h => h.Timestamp)
                    .ThenByDescending(h => h.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                decimal previousVolume = previous?.NewVolume ?? 0m;
                decimal expectedVolume = previousVolume + (txn.VolumeChange ?? 0m);
                decimal oldVolume = txn.NewVolume ?? 0m;
                decimal volumeDifference = expectedVolume - oldVolume;

                // Update this transaction
                txn.NewVolume = expectedVolume;
                _context.TankVolumeHistories.Update(txn);
                await _context.SaveChangesAsync(cancellationToken);

                // Cascade corrections downstream
                var affectedTransactions = await _context.TankVolumeHistories
                    .Where(h => h.TankId == txn.TankId &&
                                h.Timestamp > txn.Timestamp &&
                                (h.IsDeleted != true))
                    .OrderBy(h => h.Timestamp)
                    .ThenBy(h => h.Id)
                    .ToListAsync(cancellationToken);

                foreach (var affected in affectedTransactions)
                {
                    if (affected.NewVolume.HasValue)
                    {
                        affected.NewVolume += volumeDifference;
                        _context.TankVolumeHistories.Update(affected);
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return new CorrectionExecutionResult
                {
                    TankId = txn.TankId,
                    Strategy = "RECALCULATE_SINGLE",
                    Success = true,
                    TransactionsProcessed = 1 + affectedTransactions.Count,
                    TransactionsCorrected = 1 + affectedTransactions.Count,
                    Message = $"Recalculated Txn {transactionId}: {oldVolume:F2}L -> {expectedVolume:F2}L. " +
                        $"Corrected {affectedTransactions.Count} downstream transactions",
                    ExecutedBy = executedBy,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new CorrectionExecutionResult
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    ExecutedBy = executedBy,
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        /// <summary>
        /// STRATEGY 4: RECALCULATE FROM POINT FORWARD
        /// Recalculates from a starting transaction through to end date
        /// </summary>
        public async Task<CorrectionExecutionResult> RecalculateFromTransactionAsync(
            int startTransactionId,
            DateTime toDate,
            string executedBy,
            CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var startTxn = await _context.TankVolumeHistories
                    .FirstOrDefaultAsync(h => h.Id == startTransactionId && (h.IsDeleted != true), cancellationToken);

                if (startTxn == null)
                {
                    var result = new CorrectionExecutionResult { Success = false, ErrorMessage = "Start transaction not found" };
                    return result;
                }

                // Get all transactions from start through toDate
                var transactionsToFix = await _context.TankVolumeHistories
                    .Where(h => h.TankId == startTxn.TankId &&
                                h.Timestamp >= startTxn.Timestamp &&
                                h.Timestamp <= toDate &&
                                (h.IsDeleted != true))
                    .OrderBy(h => h.Timestamp)
                    .ThenBy(h => h.Id)
                    .ToListAsync(cancellationToken);

                if (!transactionsToFix.Any())
                {
                    var result = new CorrectionExecutionResult { Success = false, ErrorMessage = "No transactions found in range" };
                    return result;
                }

                // Get baseline: transaction before start
                var baseline = await _context.TankVolumeHistories
                    .Where(h => h.TankId == startTxn.TankId &&
                                h.Timestamp < startTxn.Timestamp &&
                                (h.IsDeleted != true))
                    .OrderByDescending(h => h.Timestamp)
                    .ThenByDescending(h => h.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                decimal currentVolume = baseline?.NewVolume ?? 0m;
                var correctedCount = 0;

                foreach (var txn in transactionsToFix)
                {
                    decimal expectedVolume = currentVolume + (txn.VolumeChange ?? 0m);
                    if (Math.Abs(expectedVolume - (txn.NewVolume ?? 0m)) > TOLERANCE)
                    {
                        txn.NewVolume = expectedVolume;
                        correctedCount++;
                    }
                    _context.TankVolumeHistories.Update(txn);
                    currentVolume = expectedVolume;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return new CorrectionExecutionResult
                {
                    TankId = startTxn.TankId,
                    Strategy = "RECALCULATE_FROM_POINT",
                    Success = true,
                    TransactionsProcessed = transactionsToFix.Count,
                    TransactionsCorrected = correctedCount,
                    Message = $"Recalculated {transactionsToFix.Count} transactions from Txn {startTransactionId}, corrected {correctedCount}",
                    ExecutedBy = executedBy,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new CorrectionExecutionResult
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    ExecutedBy = executedBy,
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        /// <summary>
        /// Execute multiple corrections as a batch operation
        /// </summary>
        public async Task<BulkCorrectionResult> ExecuteBulkCorrectionAsync(
            List<BulkCorrectionRequest> corrections,
            string executedBy,
            CancellationToken cancellationToken = default)
        {
            var bulkResult = new BulkCorrectionResult
            {
                TotalRequests = corrections.Count,
                ExecutedBy = executedBy,
                StartTime = DateTime.UtcNow
            };

            foreach (var correction in corrections)
            {
                CorrectionExecutionResult result = correction.CorrectionType switch
                {
                    "RECALCULATE" => await RecalculateTankVolumesAsync(
                        correction.TankId,
                        correction.FromDate ?? DateTime.MinValue,
                        correction.ToDate ?? DateTime.MaxValue,
                        executedBy,
                        cancellationToken),

                    "MANUAL" => await ManualCorrectTransactionAsync(
                        correction.TransactionId ?? 0,
                        correction.NewVolume ?? 0m,
                        correction.Reason ?? "",
                        executedBy,
                        cancellationToken),

                    "RECALCULATE_SINGLE" => await RecalculateSingleTransactionAsync(
                        correction.TransactionId ?? 0,
                        executedBy,
                        cancellationToken),

                    _ => new CorrectionExecutionResult { Success = false, ErrorMessage = "Unknown correction type" }
                };

                bulkResult.Results.Add(result);
                if (result.Success)
                    bulkResult.SuccessfulCorrectionCount++;
                else
                    bulkResult.FailedCorrectionCount++;
            }

            bulkResult.EndTime = DateTime.UtcNow;
            bulkResult.Duration = bulkResult.EndTime.Value - bulkResult.StartTime;

            return bulkResult;
        }
    }

    public class CorrectionExecutionResult
    {
        public int? TankId { get; set; }
        public bool Success { get; set; }
        public string Strategy { get; set; } = string.Empty;
        public int TransactionsProcessed { get; set; }
        public int TransactionsCorrect { get; set; }
        public int TransactionsCorrected { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public string ExecutedBy { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class BulkCorrectionResult
    {
        public int TotalRequests { get; set; }
        public int SuccessfulCorrectionCount { get; set; }
        public int FailedCorrectionCount { get; set; }
        public List<CorrectionExecutionResult> Results { get; set; } = new();
        public string ExecutedBy { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public TimeSpan Duration { get; set; }
    }

    public class BulkCorrectionRequest
    {
        public string CorrectionType { get; set; } = string.Empty; // RECALCULATE, MANUAL, RECALCULATE_SINGLE
        public int TankId { get; set; }
        public int? TransactionId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public decimal? NewVolume { get; set; }
        public string? Reason { get; set; }
    }
}
