namespace FMS.Domain.Entities.enums {
    /// <summary>
    /// Defines the types of automated reconciliation policies
    /// </summary>
    public enum ReconciliationPolicyType {
        /// <summary>
        /// Time-based policy executed on a schedule
        /// </summary>
        Scheduled = 1,

        /// <summary>
        /// Threshold-based policy triggered by discrepancy amount
        /// </summary>
        DiscrepancyThreshold = 2,

        /// <summary>
        /// Hybrid policy combining schedule and threshold conditions
        /// </summary>
        Hybrid = 3,

        /// <summary>
        /// Event-driven policy triggered by specific system events
        /// </summary>
        EventDriven = 4
    }
}