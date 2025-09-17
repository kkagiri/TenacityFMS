using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities.enums;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Tracks execution history of reconciliation policies
    /// </summary>
    public class ReconciliationPolicyExecution {
        public int Id { get; set; }

        public int PolicyId { get; set; }

        public DateTime ExecutionStartTime { get; set; }

        public string ExecutedBy { get; set; } = null!;

        public DateTime? ExecutionEndTime { get; set; }

        public ReconciliationExecutionStatus Status { get; set; }

        /// <summary>
        /// Number of tanks evaluated for discrepancies
        /// </summary>
        public int TanksEvaluated { get; set; }

        /// <summary>
        /// Number of discrepancies detected
        /// </summary>
        public int DiscrepanciesDetected { get; set; }

        /// <summary>
        /// Number of tanks successfully reconciled
        /// </summary>
        public int TanksReconciled { get; set; }

        /// <summary>
        /// Number of reconciliation failures
        /// </summary>
        public int ReconciliationFailures { get; set; }

        /// <summary>
        /// Total volume variance detected (absolute sum)
        /// </summary>
        public decimal? TotalVolumeVariance { get; set; }

        /// <summary>
        /// Average percentage variance across all tanks
        /// </summary>
        public decimal? AveragePercentageVariance { get; set; }

        /// <summary>
        /// Execution duration in milliseconds
        /// </summary>
        public long? ExecutionDurationMs { get; set; }

        /// <summary>
        /// Error message if execution failed
        /// </summary>
        [MaxLength (1000)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// JSON configuration of execution results
        /// </summary>
        public string? ExecutionResults { get; set; }

        /// <summary>
        /// JSON log of significant events during execution
        /// </summary>
        public string? ExecutionLog { get; set; }

        // Navigation properties
        public virtual ReconciliationPolicy Policy { get; set; } = null!;
        public virtual ICollection<ReconciliationDiscrepancy> Discrepancies { get; set; } = new List<ReconciliationDiscrepancy> ();
    }
}