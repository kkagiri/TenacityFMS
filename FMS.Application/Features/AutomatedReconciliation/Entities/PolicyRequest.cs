using System.Collections.Generic;

namespace FMS.Application.Features.AutomatedReconciliation.Entities {
    public class CreatePolicyRequest {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string PolicyType { get; set; } = null!;
        public string? ScheduleConfiguration { get; set; }
        public decimal? DiscrepancyThreshold { get; set; }
        public decimal? DiscrepancyPercentageThreshold { get; set; }
        public int? SiteId { get; set; }
        public string? TankScopeConfiguration { get; set; }
        public int Priority { get; set; }
        public int? MaxTanksPerExecution { get; set; }
        public string? NotificationConfiguration { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdatePolicyRequest : CreatePolicyRequest {
        public int Id { get; set; }
    }

    public class ManualExecutionRequest {
        public int PolicyId { get; set; }
        public int? SiteId { get; set; }
        public List<int> ? TankIds { get; set; }
        public string? Reason { get; set; }
    }
}