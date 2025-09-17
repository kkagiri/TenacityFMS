namespace FMS.Domain.Entities.Features.FuelRule.Rules
{
    public class DailyMonthlyLimitRule : FuelingRule
    {
        public int? DailyLimitLiter { get; set; }
        public int? MonthlyLimitLiter { get; set; }
        public override bool Evaluate(FuelingContext context)
        {
            // If a daily limit is set, check it
            if (DailyLimitLiter.HasValue && context.FuelTakenToday >= DailyLimitLiter.Value)
                return false;

            // If a monthly limit is set, check it
            if (MonthlyLimitLiter.HasValue && context.FuelTakenThisMonth >= MonthlyLimitLiter.Value)
                return false;

            return true; // Passes both checks
        }
    }
}