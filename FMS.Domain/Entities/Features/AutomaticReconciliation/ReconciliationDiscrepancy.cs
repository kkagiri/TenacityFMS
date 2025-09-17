using System;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities.enums;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Represents a detected discrepancy during automated reconciliation
    /// </summary>
    public class ReconciliationDiscrepancy {
        public int Id { get; set; }

        public int PolicyExecutionId { get; set; }

        public int TankId { get; set; }

        public DateTime DetectedAt { get; set; }

        /// <summary>
        /// Current stock value in the tank
        /// </summary>
        public decimal CurrentStock { get; set; }

        /// <summary>
        /// Expected stock value from volume history
        /// </summary>
        public decimal ExpectedStock { get; set; }

        /// <summary>
        /// Absolute variance (CurrentStock - ExpectedStock)
        /// </summary>
        public decimal AbsoluteVariance { get; set; }

        /// <summary>
        /// Percentage variance relative to expected stock
        /// </summary>
        public decimal PercentageVariance { get; set; }

        /// <summary>
        /// Severity assessment of the discrepancy
        /// </summary>
        public DiscrepancySeverity Severity { get; set; }

        /// <summary>
        /// Whether this discrepancy was resolved through reconciliation
        /// </summary>
        public bool IsResolved { get; set; }

        /// <summary>
        /// Timestamp when discrepancy was resolved
        /// </summary>
        public DateTime? ResolvedAt { get; set; }

        /// <summary>
        /// Method used to resolve the discrepancy
        /// </summary>
        [MaxLength (100)]
        public string? ResolutionMethod { get; set; }

        /// <summary>
        /// Additional analysis or notes about the discrepancy
        /// </summary>
        [MaxLength (500)]
        public string? AnalysisNotes { get; set; }

        /// <summary>
        /// Historical trend context for this discrepancy
        /// </summary>
        public string? TrendAnalysis { get; set; }

        /// <summary>
        /// Business impact assessment
        /// </summary>
        public decimal? BusinessImpactScore { get; set; }

        // Navigation properties
        public virtual ReconciliationPolicyExecution PolicyExecution { get; set; } = null!;
        public virtual Tank Tank { get; set; } = null!;
    }
}