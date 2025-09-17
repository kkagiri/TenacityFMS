using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRuleSet;

namespace FMS.Domain.Entities.Features.FuelRule {
    public abstract class FuelingRule {
        public int Id { get; set; }
        public string? RuleName { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? VehicleId { get; set; }
        public virtual Vehicle? Vehicle { get; set; }

        public int? SiteId { get; set; }
        public virtual Site? Site { get; set; }

        public DateTime? UpdatedAt { get; set; }
        public string? Discriminator { get; set; }

        // Foreign key to FuelingRuleSet
        public int FuelingRuleSetId { get; set; }

        // Navigation property to FuelingRuleSet
        public virtual FuelingRuleSet FuelingRuleSet { get; set; } = null!;

        // Properties from DailyMonthlyLimitRule
        public int? DailyLimitLiter { get; set; }
        public int? MonthlyLimitLiter { get; set; }

        // Properties from NoOfRefillRule
        public int? MaxRefillsPerDay { get; set; }
        public int? MaxRefillsPerWeek { get; set; }
        public int? MaxRefillsPerMonth { get; set; }

        public virtual bool Evaluate (FuelingContext context) {
            throw new System.NotImplementedException ("This method should be overridden in derived classes");
        }
    }
}