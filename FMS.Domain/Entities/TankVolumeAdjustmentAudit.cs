using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Audit entity to track all adjustments made to TankVolumeHistory records
    /// Provides immutable audit trail for financial ledger compliance
    /// </summary>
    public class TankVolumeAdjustmentAudit {
        /// <summary>
        /// Gets or sets the unique identifier for the audit record
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the ID of the adjustment that triggered this audit entry
        /// 0 for deletions, actual TankVolumeHistory.Id for adjustments
        /// </summary>
        public int AdjustmentId { get; set; }

        /// <summary>
        /// Gets or sets the ID of the TankVolumeHistory record that was affected
        /// </summary>
        public int AffectedRecordId { get; set; }

        /// <summary>
        /// Gets or sets the original running balance before the adjustment
        /// </summary>
        public decimal OriginalRunningBalance { get; set; }

        /// <summary>
        /// Gets or sets the new running balance after the adjustment
        /// </summary>
        public decimal NewRunningBalance { get; set; }

        /// <summary>
        /// Gets or sets the amount of the adjustment applied
        /// </summary>
        public decimal AdjustmentAmount { get; set; }

        /// <summary>
        /// Gets or sets when this adjustment was processed
        /// </summary>
        public DateTime AdjustmentTimestamp { get; set; }

        /// <summary>
        /// Gets or sets the reason for this adjustment
        /// </summary>
        [MaxLength (255)]
        public string AdjustmentReason { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets who processed this adjustment
        /// </summary>
        [MaxLength (50)]
        public string ProcessedBy { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the tank ID this adjustment relates to
        /// </summary>
        public int TankId { get; set; }

        /// <summary>
        /// Gets or sets the original volume change before adjustment
        /// </summary>
        public decimal? OriginalVolumeChange { get; set; }

        /// <summary>
        /// Gets or sets the new volume change after adjustment
        /// </summary>
        public decimal? NewVolumeChange { get; set; }

        /// <summary>
        /// Gets or sets the operation type (ADJUSTMENT, DELETION, REBASE)
        /// </summary>
        [MaxLength (20)]
        public string OperationType { get; set; } = string.Empty;

        // Navigation properties
        /// <summary>
        /// Navigation property to the affected TankVolumeHistory record
        /// </summary>
        public virtual TankVolumeHistory AffectedRecord { get; set; } = null!;

        /// <summary>
        /// Navigation property to the tank
        /// </summary>
        public virtual Tank Tank { get; set; } = null!;

        /// <summary>
        /// Navigation property to the user who processed the adjustment
        /// </summary>
        public virtual User ProcessedByNavigation { get; set; } = null!;
    }
}