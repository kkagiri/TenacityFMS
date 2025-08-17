using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Services {
    /// <summary>
    /// Service for validating tank volume history deletions with audit impact checking
    /// Ensures financial ledger compliance by preventing deletions that would affect audit trail
    /// </summary>
    public interface ITankVolumeHistoryDeletionService {
        Task<DeletionValidationResult> ValidateDeletionAsync (int recordId, CancellationToken cancellationToken = default);
        Task<DeletionValidationResult> ValidateBulkDeletionAsync (int tankId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);
    }

    public class TankVolumeHistoryDeletionService : ITankVolumeHistoryDeletionService {
        private readonly GpsdataContext _context;
        private readonly ILogger<TankVolumeHistoryDeletionService> _logger;

        public TankVolumeHistoryDeletionService (GpsdataContext context, ILogger<TankVolumeHistoryDeletionService> logger) {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Validates if a single record can be safely deleted without affecting audit trail
        /// </summary>
        public async Task<DeletionValidationResult> ValidateDeletionAsync (int recordId, CancellationToken cancellationToken = default) {
            var record = await _context.TankVolumeHistories
                .FirstOrDefaultAsync (x => x.Id == recordId && x.IsDeleted != true, cancellationToken);

            if (record == null) {
                return new DeletionValidationResult {
                IsAllowed = false,
                Reason = "Record not found or already deleted",
                RecommendedAction = "Verify the record exists and is not already soft-deleted"
                };
            }

            return await ValidateRecordDeletionAsync (record, cancellationToken);
        }

        /// <summary>
        /// Validates if multiple records can be safely deleted without affecting audit trail
        /// </summary>
        public async Task<DeletionValidationResult> ValidateBulkDeletionAsync (int tankId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default) {
            var records = await _context.TankVolumeHistories
                .Where (x => x.TankId == tankId &&
                    x.Timestamp >= fromDate &&
                    x.Timestamp <= toDate &&
                    x.IsDeleted != true)
                .ToListAsync (cancellationToken);

            if (!records.Any ()) {
                return new DeletionValidationResult {
                    IsAllowed = false,
                        Reason = "No records found in the specified date range",
                        RecommendedAction = "Verify the date range and tank ID are correct"
                };
            }

            // Check each record for audit impact
            foreach (var record in records) {
                var validation = await ValidateRecordDeletionAsync (record, cancellationToken);
                if (!validation.IsAllowed) {
                    return new DeletionValidationResult {
                        IsAllowed = false,
                            Reason = $"Record {record.Id} cannot be deleted: {validation.Reason}",
                            RecommendedAction = validation.RecommendedAction,
                            AffectedRecordId = record.Id
                    };
                }
            }

            return new DeletionValidationResult {
                IsAllowed = true,
                    Reason = $"All {records.Count} records can be safely deleted",
                    AffectedRecords = records.Count
            };
        }

        /// <summary>
        /// Validates a single record for deletion impact
        /// </summary>
        private async Task<DeletionValidationResult> ValidateRecordDeletionAsync (FMS.Domain.Entities.TankVolumeHistory record, CancellationToken cancellationToken) {
            // ✅ Check if this record has been used in subsequent adjustments
            var hasSubsequentAdjustments = await _context.TankVolumeAdjustmentAudits
                .AnyAsync (x => x.TankId == record.TankId &&
                    x.AdjustmentTimestamp > record.Timestamp, cancellationToken);

            if (hasSubsequentAdjustments) {
                var adjustmentCount = await _context.TankVolumeAdjustmentAudits
                    .CountAsync (x => x.TankId == record.TankId &&
                        x.AdjustmentTimestamp > record.Timestamp, cancellationToken);

                return new DeletionValidationResult {
                    IsAllowed = false,
                        Reason = $"Record has been used in {adjustmentCount} subsequent adjustments",
                        RecommendedAction = "Use a correction entry instead of deletion to maintain audit trail integrity",
                        AffectedRecordId = record.Id,
                        SubsequentAdjustments = adjustmentCount
                };
            }

            // ✅ Check if this record itself is an adjustment that affected other records
            var isAdjustmentRecord = await _context.TankVolumeAdjustmentAudits
                .AnyAsync (x => x.AdjustmentId == record.Id, cancellationToken);

            if (isAdjustmentRecord) {
                var affectedRecordsCount = await _context.TankVolumeAdjustmentAudits
                    .CountAsync (x => x.AdjustmentId == record.Id, cancellationToken);

                return new DeletionValidationResult {
                    IsAllowed = false,
                        Reason = $"This adjustment record affected {affectedRecordsCount} other records",
                        RecommendedAction = "Deleting this adjustment would require reversal of all affected adjustments. Use correction entry instead.",
                        AffectedRecordId = record.Id,
                        AffectedOtherRecords = affectedRecordsCount
                };
            }

            // ✅ Check if there are future records that would be affected by this deletion
            var futureRecordsCount = await _context.TankVolumeHistories
                .CountAsync (x => x.TankId == record.TankId &&
                    x.Timestamp > record.Timestamp &&
                    x.IsDeleted != true, cancellationToken);

            if (futureRecordsCount > 0) {
                _logger.LogWarning ("Deleting record {RecordId} will require rebalancing {FutureRecords} future records",
                    record.Id, futureRecordsCount);
            }

            return new DeletionValidationResult {
                IsAllowed = true,
                    Reason = "Record can be safely deleted",
                    RecommendedAction = futureRecordsCount > 0 ?
                    $"Deletion will trigger rebalancing of {futureRecordsCount} future records" :
                    "No additional impact expected",
                    AffectedRecordId = record.Id,
                    FutureRecordsToRebalance = futureRecordsCount
            };
        }
    }

    /// <summary>
    /// Result of deletion validation with detailed impact analysis
    /// </summary>
    public class DeletionValidationResult {
        /// <summary>
        /// Whether the deletion is allowed
        /// </summary>
        public bool IsAllowed { get; set; }

        /// <summary>
        /// Reason for the validation result
        /// </summary>
        public string Reason { get; set; } = string.Empty;

        /// <summary>
        /// Recommended action to take
        /// </summary>
        public string RecommendedAction { get; set; } = string.Empty;

        /// <summary>
        /// ID of the primary affected record
        /// </summary>
        public int? AffectedRecordId { get; set; }

        /// <summary>
        /// Number of records affected in bulk operations
        /// </summary>
        public int AffectedRecords { get; set; }

        /// <summary>
        /// Number of subsequent adjustments that would be affected
        /// </summary>
        public int SubsequentAdjustments { get; set; }

        /// <summary>
        /// Number of other records this adjustment affected
        /// </summary>
        public int AffectedOtherRecords { get; set; }

        /// <summary>
        /// Number of future records that would need rebalancing
        /// </summary>
        public int FutureRecordsToRebalance { get; set; }
    }
}