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
using Microsoft.Extensions.Primitives;

namespace FMS.Application.Command.DatabaseCommand.Common {
    /// <summary>
    /// Appends a new adjustment in TankVolumeHistory for a given tank,
    /// referencing the transaction's old volume and the new volume.
    /// Optionally ignores negative changes and can re-base subsequent entries.
    /// </summary>
    /// <param name="tankId">The tank to adjust</param>
    /// <param name="referenceID">The ID of the transaction that triggered the adjustment</param>
    /// <param name="oldVolume">The volume before the adjustment</param>
    /// <param name="newVolume">The volume after the adjustment</param>
    /// <param name="reasonEnum">The reason for the adjustment</param>
    /// <param name="ignoreNegatives">Whether to ignore negative changes</param>
    /// <param name="rebaseSubsequentTransactions">Whether to recalculate subsequent ledger entries
    ///  after applying this change</param>
    public interface ITankVolumeAdjustmentService {
        Task AdjustTankVolumeAsync (
            int tankId,
            int referenceID,
            decimal oldVolume,
            decimal newVolume,
            VolumeChangeReasonEnum reasonEnum,
            string recordedBy,
            bool ignoreNegatives = false,
            bool rebaseSubsequentTransactions = true,
            CancellationToken cancellationToken = default
        );
    }

    public class TankVolumeAdjustmentService : ITankVolumeAdjustmentService {
        private readonly GpsdataContext _context;
        private readonly ILogger<TankVolumeAdjustmentService> _logger;

        public TankVolumeAdjustmentService (GpsdataContext context, ILogger<TankVolumeAdjustmentService> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task AdjustTankVolumeAsync (
            int tankId,
            int referenceID,
            decimal oldVolume,
            decimal newVolume,
            VolumeChangeReasonEnum reasonEnum,
            string recordedBy,
            bool ignoreNegatives = false,
            bool rebaseSubsequentTransactions = true,
            CancellationToken cancellationToken = default) {

            var difference = newVolume - oldVolume;

            if (ignoreNegatives && difference < 0) {
                _logger.LogWarning ("Ignoring negative volume change for tank {tankId} from {oldVolume} to {newVolume}", tankId, oldVolume, newVolume);
                return;
            }

            // ✅ Use database transaction for atomicity
            using var transaction = await _context.Database.BeginTransactionAsync (cancellationToken);
            try {
                var newHistoryEntry = new TankVolumeHistory {
                    TankId = tankId,
                    CreatedOn = DateTime.UtcNow,
                    Timestamp = DateTime.UtcNow,
                    NewVolume = newVolume,
                    ChangeReason = reasonEnum,
                    ReferenceId = referenceID,
                    VolumeChange = difference,
                    ReferenceType = reasonEnum.ToString (),
                    RecordedBy = recordedBy
                };

                await _context.TankVolumeHistories.AddAsync (newHistoryEntry, cancellationToken);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Created tank volume adjustment entry {EntryId} for tank {TankId}: {OldVolume} -> {NewVolume} (diff: {Difference})",
                    newHistoryEntry.Id, tankId, oldVolume, newVolume, difference);

                if (rebaseSubsequentTransactions) {
                    await RebaseSubsequentTransactionsWithAuditAsync (tankId, newHistoryEntry.Timestamp, difference, newHistoryEntry.Id, recordedBy, cancellationToken);
                }

                await transaction.CommitAsync (cancellationToken);

                _logger.LogInformation ("Successfully completed tank volume adjustment for tank {TankId} with full audit trail", tankId);
            } catch (Exception ex) {
                await transaction.RollbackAsync (cancellationToken);
                _logger.LogError (ex, "Failed to adjust tank volume for tank {TankId}. Transaction rolled back.", tankId);
                throw;
            }
        }

        /// <summary>
        /// Enhanced rebase method with full audit trail for financial ledger compliance
        /// Tracks all changes made to existing records with original values
        /// </summary>
        private async Task RebaseSubsequentTransactionsWithAuditAsync (
            int tankId,
            DateTime timestamp,
            decimal difference,
            int adjustmentId,
            string processedBy,
            CancellationToken cancellationToken) {

            var subsequentTransactions = await _context.TankVolumeHistories
                .Where (x => x.TankId == tankId && x.Timestamp > timestamp && (x.IsDeleted != true))
                .OrderBy (x => x.Timestamp)
                .ToListAsync (cancellationToken);

            if (!subsequentTransactions.Any ()) {
                _logger.LogInformation ("No subsequent transactions found for tank {TankId} after {Timestamp}", tankId, timestamp);
                return;
            }

            var auditEntries = new List<TankVolumeAdjustmentAudit> ();

            foreach (var transaction in subsequentTransactions) {
                // ✅ Store original values for audit before making changes
                var originalRunningBalance = transaction.NewVolume ?? 0;
                var originalVolumeChange = transaction.VolumeChange ?? 0;
                var newRunningBalance = originalRunningBalance + difference;
                var newVolumeChange = originalVolumeChange + difference;

                // Create audit entry before making changes
                auditEntries.Add (new TankVolumeAdjustmentAudit {
                    AdjustmentId = adjustmentId,
                        AffectedRecordId = transaction.Id,
                        OriginalRunningBalance = originalRunningBalance,
                        NewRunningBalance = newRunningBalance,
                        AdjustmentAmount = difference,
                        OriginalVolumeChange = originalVolumeChange,
                        NewVolumeChange = newVolumeChange,
                        AdjustmentTimestamp = DateTime.UtcNow,
                        AdjustmentReason = "Cascade rebase due to prior adjustment",
                        ProcessedBy = processedBy,
                        TankId = tankId,
                        OperationType = "REBASE"
                });

                // Apply the changes to the original record
                transaction.NewVolume = newRunningBalance;
                transaction.VolumeChange = newVolumeChange;
                _context.TankVolumeHistories.Update (transaction);

                _logger.LogDebug ("Rebased record {RecordId}: {OriginalBalance} -> {NewBalance} (diff: {Difference})",
                    transaction.Id, originalRunningBalance, newRunningBalance, difference);
            }

            // ✅ Save audit entries for complete audit trail
            if (auditEntries.Any ()) {
                await _context.TankVolumeAdjustmentAudits.AddRangeAsync (auditEntries, cancellationToken);
            }

            await _context.SaveChangesAsync (cancellationToken);

            _logger.LogInformation ("Rebased {Count} subsequent transactions for tank {TankId} with adjustment {AdjustmentId}. Full audit trail created.",
                subsequentTransactions.Count, tankId, adjustmentId);
        }

        /// <summary>
        /// Legacy method - kept for backward compatibility
        /// Calls the enhanced version with minimal audit parameters
        /// </summary>
        private async Task RebaseSubsequentTransactionsAsync (int tankId, DateTime timestamp, decimal difference, CancellationToken cancellationToken) {
            await RebaseSubsequentTransactionsWithAuditAsync (tankId, timestamp, difference, 0, "SYSTEM", cancellationToken);
        }

    }
}