using System;

namespace FMS.Domain.Entities.FuelAudit
{
    /// <summary>
    /// Stores calculated variances for a fuel audit.
    /// Breaks down variance by category for analysis.
    /// </summary>
    public class FuelAuditVariance
    {
        public long Id { get; set; }

        /// <summary>
        /// FK to fuel_audits table
        /// </summary>
        public long AuditId { get; set; }

        /// <summary>
        /// Variance category: System, Tanker, Fleet, Vehicle
        /// </summary>
        public string Category { get; set; } = "System";

        /// <summary>
        /// Reference ID (Tank ID, Vehicle ID, etc.)
        /// </summary>
        public long? ReferenceId { get; set; }

        /// <summary>
        /// Reference name for display
        /// </summary>
        public string? ReferenceName { get; set; }

        // ===== VARIANCE VALUES =====
        /// <summary>
        /// Expected value based on calculation
        /// </summary>
        public decimal? ExpectedValue { get; set; }

        /// <summary>
        /// Actual measured/reported value
        /// </summary>
        public decimal? ActualValue { get; set; }

        /// <summary>
        /// Variance amount (Actual - Expected)
        /// </summary>
        public decimal? VarianceAmount { get; set; }

        /// <summary>
        /// Variance as percentage of expected
        /// </summary>
        public decimal? VariancePercent { get; set; }

        /// <summary>
        /// Direction: Shortage, Excess, Neutral
        /// </summary>
        public string? VarianceDirection { get; set; }

        // ===== THRESHOLDS =====
        /// <summary>
        /// Absolute threshold value in liters
        /// </summary>
        public decimal? ThresholdAbsolute { get; set; }

        /// <summary>
        /// Percentage threshold
        /// </summary>
        public decimal? ThresholdPercent { get; set; }

        /// <summary>
        /// Whether variance exceeds threshold
        /// </summary>
        public bool ExceedsThreshold { get; set; } = false;

        // ===== CLASSIFICATION =====
        /// <summary>
        /// Severity: Low, Medium, High, Critical
        /// </summary>
        public string? Severity { get; set; }

        /// <summary>
        /// Possible cause: MeasurementError, Evaporation, Theft, DataGap, etc.
        /// </summary>
        public string? PossibleCause { get; set; }

        /// <summary>
        /// Additional notes
        /// </summary>
        public string? Notes { get; set; }

        // ===== DATA QUALITY =====
        /// <summary>
        /// Confidence in the data: High, Medium, Low
        /// </summary>
        public string? DataConfidence { get; set; }

        /// <summary>
        /// Factors affecting confidence (JSON or text)
        /// </summary>
        public string? ConfidenceFactors { get; set; }

        // ===== AUDIT TRAIL =====
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ===== NAVIGATION =====
        public virtual FuelAudit? Audit { get; set; }
    }
}
