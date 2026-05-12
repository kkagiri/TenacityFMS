using System;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.FMS.AutomatedReconciliation {
    /// <summary>
    /// Data Transfer Object for ReconciliationPolicy
    /// </summary>
    public class ReconciliationPolicyDTO {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public ReconciliationPolicyType PolicyType { get; set; }
        public string? ScheduleConfiguration { get; set; }
        public decimal? DiscrepancyThreshold { get; set; }
        public decimal? DiscrepancyPercentageThreshold { get; set; }
        public int? SiteId { get; set; }
        public string? SiteName { get; set; }
        public string? TankScopeConfiguration { get; set; }
        public int Priority { get; set; }
        public int? MaxTanksPerExecution { get; set; }
        public string? NotificationConfiguration { get; set; }
        public string CreatedBy { get; set; } = null!;
        public DateTime CreatedOn { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public DateTime? LastExecuted { get; set; }
        public DateTime? NextExecution { get; set; }

        // Execution statistics
        public int TotalExecutions { get; set; }
        public int SuccessfulExecutions { get; set; }
        public decimal? AverageExecutionDurationMs { get; set; }
        public int TotalTanksReconciled { get; set; }
    }
}