using System;

namespace FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation {
    /// <summary>
    /// Data Transfer Object for DiscrepancyRecord
    /// </summary>
    public class DiscrepancyRecordDTO {
        public int Id { get; set; }
        public int TankId { get; set; }
        public string TankName { get; set; } = null!;
        public int PolicyId { get; set; }
        public string PolicyName { get; set; } = null!;
        public int ExecutionId { get; set; }
        public DateTime DetectedAt { get; set; }
        public decimal VarianceLiters { get; set; }
        public decimal VariancePercentage { get; set; }
        public bool IsResolved { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? ResolutionMethod { get; set; }
        public string? ResolutionNotes { get; set; }
    }
}