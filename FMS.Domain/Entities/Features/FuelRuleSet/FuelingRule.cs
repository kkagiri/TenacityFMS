using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRuleSet;

namespace FMS.Domain.Entities.Features.FuelRule
{
    public partial class FuelingRule
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

        public virtual bool Evaluate(FuelingContext context)
        {
            throw new System.NotImplementedException("This method should be overridden in derived classes");
        }
    }
}