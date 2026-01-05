namespace FMS.Domain.Entities.Features.FuelRule.Rules
{
    /// <summary>
    /// Rule that limits fuel based on daily volume, monthly volume, and per-transaction amount.
    /// All limits are optional - only set limits are enforced.
    /// </summary>
    public class DailyMonthlyLimitRule : FuelingRule
    {
        /// <summary>
        /// Maximum fuel allowed per day in liters (e.g., 200L/day)
        /// </summary>
        public int? DailyLimitLiter { get; set; }

        /// <summary>
        /// Maximum fuel allowed per month in liters (e.g., 3000L/month)
        /// </summary>
        public int? MonthlyLimitLiter { get; set; }

        /// <summary>
        /// Maximum fuel allowed per single transaction in liters (e.g., 100L/refill)
        /// This prevents over-fueling in a single transaction, especially useful for:
        /// - Tippers that shouldn't get more than X liters at once
        /// - Preventing fraud by limiting single transaction size
        /// </summary>
        public int? FuelingLimitPerTransaction { get; set; }

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