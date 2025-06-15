
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.enums;

namespace FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation {
    /// <summary>
    /// Data Transfer Object for ReconciliationPolicyExecution
    /// </summary>
    public class PolicyExecutionDTO {
        public int Id { get; set; }
        public int PolicyId { get; set; }
        public string PolicyName { get; set; } = null!;
        public DateTime ExecutionStartTime { get; set; }
        public DateTime? ExecutionEndTime { get; set; }
        public ReconciliationExecutionStatus Status { get; set; }
        public int TanksEvaluated { get; set; }
        public int DiscrepanciesDetected { get; set; }
        public int TanksReconciled { get; set; }
        public int ReconciliationFailures { get; set; }
        public decimal? TotalVolumeVariance { get; set; }
        public decimal? AveragePercentageVariance { get; set; }
        public long? ExecutionDurationMs { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ExecutionResults { get; set; }
        public string? ExecutionLog { get; set; }

        public List<ReconciliationDiscrepancyDTO> Discrepancies { get; set; } = new List<ReconciliationDiscrepancyDTO>();
    }
}