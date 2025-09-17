namespace FMS.Domain.Entities.Features.FuelRule.Rules
{
    public class NoOfRefillRule : FuelingRule
    {
        public int? MaxRefillsPerDay { get; set; }
        public int? MaxRefillsPerWeek { get; set; }
        public int? MaxRefillsPerMonth { get; set; }

        public override bool Evaluate(FuelingContext context)
        {
            if (MaxRefillsPerDay.HasValue && context.NoOfRefillToday >= MaxRefillsPerDay.Value)
            {
                return false;
            }
            if (MaxRefillsPerWeek.HasValue && context.NoOfRefillThisWeek >= MaxRefillsPerWeek.Value)
            {
                return false;
            }
            if (MaxRefillsPerMonth.HasValue && context.NoOfRefillThisMonth >= MaxRefillsPerMonth.Value)
            {
                return false;
            }

            return true;
        }
    }
}