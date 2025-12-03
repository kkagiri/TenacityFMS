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

// Alias to avoid conflict with namespace FMS.Application.Features.TankManagement.TankVolumeHistory
using TankVolumeHistoryEntity = FMS.Domain.Entities.Features.TankStockManagement.TankVolumeHistory;

namespace FMS.Application.Features.TankManagement.Services
{
    /// <summary>
    /// Service for validating tank volume history data integrity
    /// Detects sequence breaks, calculates corrections, and reports findings
    /// </summary>
    public interface ITankVolumeHistoryValidationService
    {
        Task<ValidationResult> ValidateTankVolumeSequenceAsync(int tankId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
        Task<ValidationResult> ValidateAllTanksAsync(int? siteId = null, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
        Task<List<SequenceBreak>> DetectAllSequenceBreaksAsync(int? siteId = null, DateTime? fromDate = null, CancellationToken cancellationToken = default);
        Task<CorrectionPlan> GenerateCorrectionPlanAsync(List<SequenceBreak> breaks, CancellationToken cancellationToken = default);
    }

    public class TankVolumeHistoryValidationService : ITankVolumeHistoryValidationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<TankVolumeHistoryValidationService> _logger;

        // Tolerance for rounding errors (0.01L)
        private const decimal TOLERANCE = 0.01m;

        public TankVolumeHistoryValidationService(
            GpsdataContext context,
            ILogger<TankVolumeHistoryValidationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ValidationResult> ValidateTankVolumeSequenceAsync(
            int tankId,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Starting volume sequence validation for Tank {TankId} from {FromDate} to {ToDate}",
                    tankId, fromDate?.Date, toDate?.Date);

                // Get all transactions for the tank in the date range
                // Build filter first, then order
                var query = _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId && (h.IsDeleted != true));

                if (fromDate.HasValue)
                    query = query.Where(h => h.Timestamp >= fromDate.Value);
                if (toDate.HasValue)
                    query = query.Where(h => h.Timestamp <= toDate.Value);

                // Order after all filtering is complete
                var transactions = await query
                    .OrderBy(h => h.Timestamp)
                    .ThenBy(h => h.Id)
                    .ToListAsync(cancellationToken);

                if (!transactions.Any())
                {
                    return new ValidationResult
                    {
                        TankId = tankId,
                        IsValid = true,
                        TotalTransactions = 0,
                        SequenceBreaks = new List<SequenceBreak>(),
                        Message = "No transactions found for this tank in the specified date range"
                    };
                }

                var breaks = ValidateSequence(tankId, transactions);

                var result = new ValidationResult
                {
                    TankId = tankId,
                    IsValid = !breaks.Any(),
                    TotalTransactions = transactions.Count,
                    SequenceBreaks = breaks,
                    Message = breaks.Any()
                        ? $"Found {breaks.Count} sequence break(s) in {transactions.Count} transactions"
                        : $"All {transactions.Count} transactions are valid"
                };

                _logger.LogInformation("Tank {TankId} validation complete: {IsValid} - {Message}",
                    tankId, result.IsValid, result.Message);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating tank volume sequence for Tank {TankId}", tankId);
                throw;
            }
        }

        public async Task<ValidationResult> ValidateAllTanksAsync(
            int? siteId = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Starting volume sequence validation for all tanks (SiteId: {SiteId})",
                    siteId);

                var tankQuery = _context.Tanks.AsQueryable();
                if (siteId.HasValue)
                    tankQuery = tankQuery.Where(t => t.SiteId == siteId.Value);

                var tanks = await tankQuery.Select(t => t.Id).ToListAsync(cancellationToken);
                var allBreaks = new List<SequenceBreak>();
                var validTanks = 0;
                var invalidTanks = 0;

                foreach (var tankId in tanks)
                {
                    var result = await ValidateTankVolumeSequenceAsync(tankId, fromDate, toDate, cancellationToken);
                    if (result.IsValid)
                        validTanks++;
                    else
                        invalidTanks++;

                    allBreaks.AddRange(result.SequenceBreaks);
                }

                return new ValidationResult
                {
                    IsValid = !allBreaks.Any(),
                    TotalTransactions = allBreaks.Count,
                    SequenceBreaks = allBreaks,
                    Message = $"Validation complete: {validTanks} tanks valid, {invalidTanks} tanks invalid, {allBreaks.Count} total breaks"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating all tanks");
                throw;
            }
        }

        public async Task<List<SequenceBreak>> DetectAllSequenceBreaksAsync(
            int? siteId = null,
            DateTime? fromDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var allBreaks = new List<SequenceBreak>();

                var tankQuery = _context.Tanks.AsQueryable();
                if (siteId.HasValue)
                    tankQuery = tankQuery.Where(t => t.SiteId == siteId.Value);

                var tanks = await tankQuery.Select(t => t.Id).ToListAsync(cancellationToken);

                foreach (var tankId in tanks)
                {
                    var result = await ValidateTankVolumeSequenceAsync(tankId, fromDate, null, cancellationToken);
                    allBreaks.AddRange(result.SequenceBreaks);
                }

                return allBreaks.OrderBy(b => b.TankId).ThenBy(b => b.AffectedTransactionId).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting sequence breaks");
                throw;
            }
        }

        public async Task<CorrectionPlan> GenerateCorrectionPlanAsync(
            List<SequenceBreak> breaks,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var plan = new CorrectionPlan
                {
                    TotalBreaks = breaks.Count,
                    AffectedTanks = breaks.Select(b => b.TankId).Distinct().Count(),
                    BreaksByTank = new Dictionary<int, List<SequenceBreak>>()
                };

                // Group breaks by tank
                foreach (var tankId in breaks.Select(b => b.TankId).Distinct())
                {
                    var tankBreaks = breaks.Where(b => b.TankId == tankId).ToList();
                    plan.BreaksByTank[tankId] = tankBreaks;

                    // For each tank, generate correction steps
                    var corrections = new List<CorrectionStep>();

                    // Step 1: Get opening stock for the affected date range
                    var minDate = tankBreaks.Min(b => b.TransactionTimestamp).Date;
                    var maxDate = tankBreaks.Max(b => b.TransactionTimestamp).Date;

                    corrections.Add(new CorrectionStep
                    {
                        StepNumber = 1,
                        Action = "IDENTIFY_OPENING_STOCK",
                        Description = $"Identify opening stock for tank {tankId} on {minDate:yyyy-MM-dd}",
                        AffectedTransactionIds = new List<int>()
                    });

                    // Step 2: Recalculate all volumes from opening stock
                    var affectedIds = tankBreaks.Select(b => b.AffectedTransactionId).ToList();
                    corrections.Add(new CorrectionStep
                    {
                        StepNumber = 2,
                        Action = "RECALCULATE_VOLUMES",
                        Description = $"Recalculate NewVolume for {affectedIds.Count} affected transactions",
                        AffectedTransactionIds = affectedIds
                    });

                    // Step 3: Validate recalculation
                    corrections.Add(new CorrectionStep
                    {
                        StepNumber = 3,
                        Action = "VALIDATE_CORRECTION",
                        Description = "Validate that all volumes now form a consistent sequence",
                        AffectedTransactionIds = new List<int>()
                    });

                    plan.CorrectionSteps[tankId] = corrections;
                }

                _logger.LogInformation("Generated correction plan for {BreakCount} breaks affecting {TankCount} tanks",
                    plan.TotalBreaks, plan.AffectedTanks);

                return plan;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating correction plan");
                throw;
            }
        }

        /// <summary>
        /// Validates a sequence of transactions and returns list of breaks
        /// </summary>
        private List<SequenceBreak> ValidateSequence(int tankId, List<TankVolumeHistoryEntity> transactions)
        {
            var breaks = new List<SequenceBreak>();

            if (transactions.Count < 2)
                return breaks;

            for (int i = 1; i < transactions.Count; i++)
            {
                var previous = transactions[i - 1];
                var current = transactions[i];

                // Calculate expected volume
                decimal expectedVolume = (previous.NewVolume ?? 0m) + (current.VolumeChange ?? 0m);
                decimal actualVolume = current.NewVolume ?? 0m;
                decimal variance = actualVolume - expectedVolume;

                // Check if variance exceeds tolerance
                if (Math.Abs(variance) > TOLERANCE)
                {
                    breaks.Add(new SequenceBreak
                    {
                        TankId = tankId,
                        BreakIndex = i,
                        PreviousTransactionId = previous.Id,
                        PreviousTimestamp = previous.Timestamp,
                        PreviousNewVolume = previous.NewVolume ?? 0m,
                        AffectedTransactionId = current.Id,
                        TransactionTimestamp = current.Timestamp,
                        TransactionChangeReason = current.ChangeReason.ToString(),
                        ExpectedVolume = expectedVolume,
                        ActualVolume = actualVolume,
                        Variance = variance,
                        VolumeChange = current.VolumeChange ?? 0m,
                        Severity = CalculateSeverity(variance)
                    });

                    _logger.LogWarning(
                        "Sequence break in Tank {TankId}: Txn {TxnId} at {Timestamp} - " +
                        "Expected {Expected:F2}L, got {Actual:F2}L, variance {Variance:F2}L ({Severity})",
                        tankId, current.Id, current.Timestamp, expectedVolume, actualVolume, variance,
                        CalculateSeverity(variance));
                }
            }

            return breaks;
        }

        private string CalculateSeverity(decimal variance)
        {
            decimal absVariance = Math.Abs(variance);
            return absVariance switch
            {
                >= 1000m => "CRITICAL",
                >= 500m => "HIGH",
                >= 100m => "MEDIUM",
                >= 10m => "LOW",
                _ => "MINIMAL"
            };
        }
    }

    /// <summary>
    /// Represents a break in the transaction sequence
    /// </summary>
    public class SequenceBreak
    {
        public int TankId { get; set; }
        public int BreakIndex { get; set; }
        public int PreviousTransactionId { get; set; }
        public DateTime PreviousTimestamp { get; set; }
        public decimal PreviousNewVolume { get; set; }
        public int AffectedTransactionId { get; set; }
        public DateTime TransactionTimestamp { get; set; }
        public string TransactionChangeReason { get; set; }
        public decimal ExpectedVolume { get; set; }
        public decimal ActualVolume { get; set; }
        public decimal Variance { get; set; }
        public decimal VolumeChange { get; set; }
        public string Severity { get; set; }
    }

    /// <summary>
    /// Result of validation for a tank or group of tanks
    /// </summary>
    public class ValidationResult
    {
        public int? TankId { get; set; }
        public bool IsValid { get; set; }
        public int TotalTransactions { get; set; }
        public List<SequenceBreak> SequenceBreaks { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Plan for correcting volume sequence breaks
    /// </summary>
    public class CorrectionPlan
    {
        public int TotalBreaks { get; set; }
        public int AffectedTanks { get; set; }
        public Dictionary<int, List<SequenceBreak>> BreaksByTank { get; set; } = new();
        public Dictionary<int, List<CorrectionStep>> CorrectionSteps { get; set; } = new();
    }

    /// <summary>
    /// Individual correction step in a plan
    /// </summary>
    public class CorrectionStep
    {
        public int StepNumber { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<int> AffectedTransactionIds { get; set; } = new();
    }
}
