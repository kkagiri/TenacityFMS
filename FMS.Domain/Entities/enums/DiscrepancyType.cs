/**
 * File: DiscrepancyType.cs
 * Purpose: Classifies the source/type of a ReconciliationDiscrepancy record
 * Dependencies: None
 * Last Modified: 2026-02-18
 */
namespace FMS.Domain.Entities.enums
{
    /// <summary>
    /// Identifies how/why a reconciliation discrepancy was created.
    /// Stored on every ReconciliationDiscrepancy row to distinguish
    /// closing-stock variances from sensor variances from policy-driven
    /// automated reconciliation checks.
    /// </summary>
    public enum DiscrepancyType
    {
        /// <summary>
        /// Variance detected during manual closing stock entry
        /// (expected closing based on opening + transactions vs actual closing).
        /// </summary>
        ClosingStockReconciliation = 1,

        /// <summary>
        /// Variance between a manual stock entry and the most recent
        /// ATG/sensor reading for the same tank.
        /// </summary>
        SensorVariance = 2,

        /// <summary>
        /// Variance detected by an automated reconciliation policy execution.
        /// </summary>
        PolicyDriven = 3,

        /// <summary>
        /// Variance detected by the daily reconciliation policy service.
        /// </summary>
        DailyReconciliation = 4
    }
}
