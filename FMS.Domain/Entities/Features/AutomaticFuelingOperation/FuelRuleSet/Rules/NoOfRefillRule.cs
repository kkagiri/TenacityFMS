namespace FMS.Domain.Entities.Features.FuelRule.Rules
{
    public class NoOfRefillRule : FuelingRule
    {
        // Note: MaxRefillsPerDay, MaxRefillsPerWeek, MaxRefillsPerMonth are inherited from FuelingRule base class
        // This is required for EF Core TPH (Table Per Hierarchy) inheritance pattern
        // Do NOT redefine these properties here as it causes property hiding/shadowing issues

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