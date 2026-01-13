namespace FMS.Domain.Entities.Features.FuelRule.Rules
{
    /// <summary>
    /// Rule that limits fuel based on daily volume, monthly volume, and per-transaction amount.
    /// All limits are optional - only set limits are enforced.
    /// Note: DailyLimitLiter, MonthlyLimitLiter, and FuelingLimitPerTransaction are inherited from FuelingRule base class.
    /// This is required for EF Core TPH (Table Per Hierarchy) inheritance pattern.
    /// Do NOT redefine these properties here as it causes property hiding/shadowing issues.
    /// </summary>
    public class DailyMonthlyLimitRule : FuelingRule
    {
        public override bool Evaluate(FuelingContext context)
        {
            // If a daily limit is set, check remaining allowance
            if (DailyLimitLiter.HasValue && context.FuelTakenToday >= DailyLimitLiter.Value)
                return false;

            // If a monthly limit is set, check remaining allowance
            if (MonthlyLimitLiter.HasValue && context.FuelTakenThisMonth >= MonthlyLimitLiter.Value)
                return false;

            // Per-transaction limit is checked during fuel calculation, not in boolean Evaluate
            // This method only checks if fueling is allowed at all

            return true; // Passes all checks
        }

        /// <summary>
        /// Calculates the maximum fuel allowed for this rule based on current usage
        /// </summary>
        public decimal CalculateMaxAllowed(FuelingContext context)
        {
            decimal maxAllowed = decimal.MaxValue;

            // Daily limit remaining
            if (DailyLimitLiter.HasValue)
            {
                var dailyRemaining = DailyLimitLiter.Value - context.FuelTakenToday;
                maxAllowed = Math.Min(maxAllowed, dailyRemaining);
            }

            // Monthly limit remaining
            if (MonthlyLimitLiter.HasValue)
            {
                var monthlyRemaining = MonthlyLimitLiter.Value - context.FuelTakenThisMonth;
                maxAllowed = Math.Min(maxAllowed, monthlyRemaining);
            }

            // Per-transaction limit
            if (FuelingLimitPerTransaction.HasValue)
            {
                maxAllowed = Math.Min(maxAllowed, FuelingLimitPerTransaction.Value);
            }

            return Math.Max(0, maxAllowed);
        }
    }
}