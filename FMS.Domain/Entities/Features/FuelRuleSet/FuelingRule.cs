using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRuleSet;

namespace FMS.Domain.Entities.Features.FuelRule
{
    public abstract class FuelingRule
    {
        public int Id { get; set; }
        public string? RuleName { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
        public string? Discriminator { get; set; }

        // Foreign key to FuelingRuleSet
        public int FuelingRuleSetId { get; set; }

        // Navigation property to FuelingRuleSet
        public virtual FuelingRuleSet FuelingRuleSet { get; set; } = null!;

        public abstract bool Evaluate(FuelingContext context);
    }
}