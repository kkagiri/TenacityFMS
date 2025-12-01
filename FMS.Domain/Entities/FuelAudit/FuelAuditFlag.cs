using System;

namespace FMS.Domain.Entities.FuelAudit
{
    /// <summary>
    /// Stores alert/flag records for a fuel audit.
    /// Tracks anomalies that require investigation.
    /// </summary>
    public class FuelAuditFlag
    {
        public long Id { get; set; }

        /// <summary>
        /// FK to fuel_audits table
        /// </summary>
        public long AuditId { get; set; }

        /// <summary>
        /// Flag type: TankerVariance, FleetVariance, LowFuelEfficiency, MissingData, etc.
        /// </summary>
        public string FlagType { get; set; } = "VarianceExceeded";

        /// <summary>
        /// Severity: Low, Medium, High, Critical
        /// </summary>
        public string Severity { get; set; } = "Medium";

        /// <summary>
        /// Flag status: Open, Acknowledged, Resolved, Dismissed
        /// </summary>
        public string Status { get; set; } = "Open";

        /// <summary>
        /// Category: System, Tanker, Fleet, Vehicle, Quality
        /// </summary>
        public string Category { get; set; } = "System";

        // ===== REFERENCE =====
        /// <summary>
        /// ID of the referenced entity (Tank, Vehicle, etc.)
        /// </summary>
        public long? ReferenceId { get; set; }

        /// <summary>
        /// Type of reference: Tank, Vehicle, Reading
        /// </summary>
        public string? ReferenceType { get; set; }

        /// <summary>
        /// Name of the referenced entity for display
        /// </summary>
        public string? ReferenceName { get; set; }

        // ===== FLAG DETAILS =====
        /// <summary>
        /// Short title of the flag
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Detailed description of the anomaly
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Actual value that triggered the flag
        /// </summary>
        public decimal? ActualValue { get; set; }

        /// <summary>
        /// Expected value
        /// </summary>
        public decimal? ExpectedValue { get; set; }

        /// <summary>
        /// Threshold that was exceeded
        /// </summary>
        public decimal? ThresholdValue { get; set; }

        /// <summary>
        /// Unit of the value: Liters, Percent, KmPerLiter
        /// </summary>
        public string? ValueUnit { get; set; }

        // ===== RESOLUTION =====
        /// <summary>
        /// Resolution notes explaining outcome
        /// </summary>
        public string? ResolutionNotes { get; set; }

        /// <summary>
        /// Resolution type: Explained, Adjusted, Accepted, Dismissed
        /// </summary>
        public string? ResolutionType { get; set; }

        /// <summary>
        /// User who resolved the flag
        /// </summary>
        public long? ResolvedBy { get; set; }

        /// <summary>
        /// When flag was resolved
        /// </summary>
        public DateTime? ResolvedAt { get; set; }

        // ===== PATTERN DETECTION =====
        /// <summary>
        /// Whether this is a recurring pattern
        /// </summary>
        public bool IsRecurringPattern { get; set; } = false;

        /// <summary>
        /// Number of times this pattern has occurred
        /// </summary>
        public int? PatternCount { get; set; }

        /// <summary>
        /// Comma-separated IDs of related flags
        /// </summary>
        public string? RelatedFlagIds { get; set; }

        // ===== AUDIT TRAIL =====
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public long? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long? UpdatedBy { get; set; }

        // ===== NAVIGATION =====
        public virtual FuelAudit? Audit { get; set; }
    }
}
