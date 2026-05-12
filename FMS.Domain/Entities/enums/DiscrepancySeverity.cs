namespace FMS.Domain.Entities.enums {
    /// <summary>
    /// Severity classification for stock discrepancies
    /// </summary>
    public enum DiscrepancySeverity {
        /// <summary>
        /// Minor discrepancy within acceptable operational ranges
        /// </summary>
        Low = 1,

        /// <summary>
        /// Moderate discrepancy requiring attention
        /// </summary>
        Medium = 2,

        /// <summary>
        /// Significant discrepancy requiring immediate attention
        /// </summary>
        High = 3,

        /// <summary>
        /// Critical discrepancy indicating potential system issues
        /// </summary>
        Critical = 4
    }
}