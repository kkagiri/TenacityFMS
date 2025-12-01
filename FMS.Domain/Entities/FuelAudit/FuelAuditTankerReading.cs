using System;

namespace FMS.Domain.Entities.FuelAudit
{
    /// <summary>
    /// Stores tanker/storage tank readings for a fuel audit.
    /// Tracks opening and closing stock levels for each tank during audit period.
    /// </summary>
    public class FuelAuditTankerReading
    {
        public long Id { get; set; }

        /// <summary>
        /// FK to fuel_audits table
        /// </summary>
        public long AuditId { get; set; }

        /// <summary>
        /// FK to tanks table
        /// </summary>
        public long TankId { get; set; }

        /// <summary>
        /// Cached tank name for reporting
        /// </summary>
        public string? TankName { get; set; }

        /// <summary>
        /// Tank capacity in liters
        /// </summary>
        public decimal? TankCapacity { get; set; }

        // ===== OPENING READING =====
        /// <summary>
        /// Opening stock level in liters
        /// </summary>
        public decimal? OpeningStock { get; set; }

        /// <summary>
        /// Time of opening reading
        /// </summary>
        public DateTime? OpeningReadingTime { get; set; }

        /// <summary>
        /// Opening reading method: Manual, ATG, Calculated
        /// </summary>
        public string? OpeningMethod { get; set; }

        /// <summary>
        /// Notes for opening reading
        /// </summary>
        public string? OpeningNotes { get; set; }

        // ===== CLOSING READING =====
        /// <summary>
        /// Closing stock level in liters
        /// </summary>
        public decimal? ClosingStock { get; set; }

        /// <summary>
        /// Time of closing reading
        /// </summary>
        public DateTime? ClosingReadingTime { get; set; }

        /// <summary>
        /// Closing reading method: Manual, ATG, Calculated
        /// </summary>
        public string? ClosingMethod { get; set; }

        /// <summary>
        /// Notes for closing reading
        /// </summary>
        public string? ClosingNotes { get; set; }

        // ===== MOVEMENTS =====
        /// <summary>
        /// Fuel received from deliveries
        /// </summary>
        public decimal? FuelReceived { get; set; }

        /// <summary>
        /// Fuel dispensed to vehicles
        /// </summary>
        public decimal? FuelDispensed { get; set; }

        /// <summary>
        /// Fuel transferred out to other tanks
        /// </summary>
        public decimal? FuelTransferredOut { get; set; }

        /// <summary>
        /// Fuel transferred in from other tanks
        /// </summary>
        public decimal? FuelTransferredIn { get; set; }

        // ===== CALCULATED =====
        /// <summary>
        /// Expected closing = Opening + Received + TransferIn - Dispensed - TransferOut
        /// </summary>
        public decimal? ExpectedClosing { get; set; }

        /// <summary>
        /// Variance = Expected - Actual closing
        /// </summary>
        public decimal? Variance { get; set; }

        /// <summary>
        /// Variance as percentage of expected
        /// </summary>
        public decimal? VariancePercent { get; set; }

        /// <summary>
        /// Flag if variance exceeds threshold
        /// </summary>
        public bool HasVarianceFlag { get; set; } = false;

        // ===== DATA SOURCE =====
        /// <summary>
        /// Source of the reading data: Manual, TankVolumeHistory, ATG
        /// </summary>
        public string? DataSource { get; set; }

        /// <summary>
        /// True if this reading was auto-populated from TankVolumeHistory
        /// </summary>
        public bool IsAutoPopulated { get; set; } = false;

        /// <summary>
        /// True if there are data quality issues with this reading
        /// </summary>
        public bool HasDataQualityIssue { get; set; } = false;

        /// <summary>
        /// Notes about data quality issues
        /// </summary>
        public string? DataQualityNotes { get; set; }

        // ===== AUDIT TRAIL =====
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public long? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long? UpdatedBy { get; set; }

        // ===== NAVIGATION =====
        public virtual FuelAudit? Audit { get; set; }
        public virtual Tank? Tank { get; set; }
    }
}
