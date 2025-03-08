using FMS.Domain.Entities.Features.FuelRule;

namespace FMS.Domain.Entities.Features.FuelRuleSet
{
    public class FuelingRuleSet
    {
        public int Id { get; set; }
        public String Name { get; set; }
        public string? Description { get; set; }
        public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();

        public virtual ICollection<FuelingRule> Rules { get; set; } = new List<FuelingRule>();
    }
}