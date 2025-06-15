namespace FMS.Domain.Entities.enums {
    /// <summary>
    /// Status of a reconciliation policy execution
    /// </summary>
    public enum ReconciliationExecutionStatus {
        /// <summary>
        /// Execution is in progress
        /// </summary>
        InProgress = 1,

        /// <summary>
        /// Execution completed successfully
        /// </summary>
        Completed = 2,

        /// <summary>
        /// Execution completed with some failures
        /// </summary>
        CompletedWithErrors = 3,

        /// <summary>
        /// Execution failed completely
        /// </summary>
        Failed = 4,

        /// <summary>
        /// Execution was cancelled
        /// </summary>
        Cancelled = 5
    }
}