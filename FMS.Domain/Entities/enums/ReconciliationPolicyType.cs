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
        EventDriven = 4,

        /// <summary>
        /// Manual policy executed on demand by user
        /// </summary>
        //Cursor - Added Manual type for manual execution
        // This is useful for ad-hoc reconciliations initiated by users
        // It allows flexibility in executing policies without a predefined schedule
        // or event trigger.
        Manual = 5
    }
}