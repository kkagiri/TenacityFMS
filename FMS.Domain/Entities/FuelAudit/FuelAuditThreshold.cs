using System;

namespace FMS.Domain.Entities.FuelAudit
{
    /// <summary>
    /// Stores configurable threshold settings for fuel audit flags.
    /// Allows different thresholds per category and vehicle type.
    /// </summary>
    public class FuelAuditThreshold
    {
        public long Id { get; set; }

        /// <summary>
        /// Category: Tanker, Fleet, Vehicle, Quality, System
        /// </summary>
        public string Category { get; set; } = "System";

        /// <summary>
        /// Threshold type: TankerVariance, FleetVariance, VehicleVariance, FuelEfficiency, DataQuality, UnexplainedVariance
        /// </summary>
        public string ThresholdType { get; set; } = "TankerVariance";

        /// <summary>
        /// Human-readable name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Description of what this threshold monitors
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Threshold value (percentage or absolute)
        /// </summary>
        public decimal ThresholdValue { get; set; }

        /// <summary>
        /// Unit: Percent, Liters, KmPerLiter
        /// </summary>
        public string Unit { get; set; } = "Percent";

        /// <summary>
        /// Severity: Low, Medium, High, Critical
        /// </summary>
        public string Severity { get; set; } = "Medium";

        /// <summary>
        /// Whether this threshold is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Whether to automatically apply this threshold
        /// </summary>
        public bool AutoApply { get; set; } = true;

        /// <summary>
        /// Optional vehicle type filter: GPS, Pickup, Manual, null = all
        /// </summary>
        public string? VehicleTypeFilter { get; set; }

        // ===== AUDIT TRAIL =====
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public long? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long? UpdatedBy { get; set; }
    }
}
