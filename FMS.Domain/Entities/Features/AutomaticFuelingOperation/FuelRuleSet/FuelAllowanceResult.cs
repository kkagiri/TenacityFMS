using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities.Features.FuelRule
{
    /// <summary>
    /// Result of fuel allowance calculation.
    /// Contains both hard limits (physics) and soft limits (rules),
    /// along with the final calculated maximum fuel allowed.
    /// </summary>
    public class FuelAllowanceResult
    {
        #region Final Result

        /// <summary>
        /// Whether fueling is allowed at all.
        /// False if any rule blocks fueling entirely (e.g., max refills reached, outside time window)
        /// </summary>
        public bool IsAllowed { get; set; }

        /// <summary>
        /// Maximum fuel allowed for this transaction in liters.
        /// This is the MINIMUM of all applicable limits (hard + soft).
        /// </summary>
        public decimal MaxFuelAllowed { get; set; }

        /// <summary>
        /// Human-readable reason if fueling is blocked or limited
        /// </summary>
        public string? Message { get; set; }

        /// <summary>
        /// If blocked, the reason why
        /// </summary>
        public string? BlockedReason { get; set; }

        #endregion

        #region Hard Limits (Physics - Tank Capacity)

        /// <summary>
        /// Maximum fuel that can physically fit in the tank.
        /// = TankCapacity - CurrentFuelLevel (if GPS sensor available)
        /// = TankCapacity (if no GPS sensor)
        /// </summary>
        public decimal HardLimit { get; set; }

        /// <summary>
        /// Source of the hard limit for logging/display
        /// </summary>
        public string HardLimitSource { get; set; } = "Tank Capacity";

        /// <summary>
        /// Vehicle's total tank capacity
        /// </summary>
        public decimal TankCapacity { get; set; }

        /// <summary>
        /// Current fuel in tank (from GPS if available)
        /// </summary>
        public decimal? CurrentFuelInTank { get; set; }

        /// <summary>
        /// Whether GPS fuel sensor data was used
        /// </summary>
        public bool UsedGpsFuelSensor { get; set; }

        #endregion

        #region Soft Limits (Rules)

        /// <summary>
        /// Individual soft limits from rules.
        /// Key = limit type (e.g., "DailyLimit", "PerTransaction"), Value = limit amount
        /// </summary>
        public Dictionary<string, decimal> SoftLimits { get; set; } = new();

        /// <summary>
        /// The most restrictive soft limit type
        /// </summary>
        public string? LimitingFactor { get; set; }

        /// <summary>
        /// List of rule sets that were applied
        /// </summary>
        public List<AppliedRuleSetInfo> AppliedRuleSets { get; set; } = new();

        #endregion

        #region Usage Summary

        /// <summary>
        /// Fuel already taken today
        /// </summary>
        public decimal FuelUsedToday { get; set; }

        /// <summary>
        /// Daily limit from rules
        /// </summary>
        public decimal? DailyLimit { get; set; }

        /// <summary>
        /// Daily limit remaining
        /// </summary>
        public decimal? DailyRemaining => DailyLimit.HasValue ? DailyLimit.Value - FuelUsedToday : null;

        /// <summary>
        /// Fuel already taken this month
        /// </summary>
        public decimal FuelUsedThisMonth { get; set; }

        /// <summary>
        /// Monthly limit from rules
        /// </summary>
        public decimal? MonthlyLimit { get; set; }

        /// <summary>
        /// Monthly limit remaining
        /// </summary>
        public decimal? MonthlyRemaining => MonthlyLimit.HasValue ? MonthlyLimit.Value - FuelUsedThisMonth : null;

        /// <summary>
        /// Per-transaction limit from rules
        /// </summary>
        public decimal? PerTransactionLimit { get; set; }

        /// <summary>
        /// Number of refills today
        /// </summary>
        public int RefillsToday { get; set; }

        /// <summary>
        /// Max refills per day from rules
        /// </summary>
        public int? MaxRefillsPerDay { get; set; }

        /// <summary>
        /// Refills remaining today
        /// </summary>
        public int? RefillsRemainingToday => MaxRefillsPerDay.HasValue ? MaxRefillsPerDay.Value - RefillsToday : null;

        #endregion

        #region Time Window

        /// <summary>
        /// Whether fueling is within allowed time window
        /// </summary>
        public bool IsWithinTimeWindow { get; set; } = true;

        /// <summary>
        /// Time window start (if rule exists)
        /// </summary>
        public TimeSpan? TimeWindowStart { get; set; }

        /// <summary>
        /// Time window end (if rule exists)
        /// </summary>
        public TimeSpan? TimeWindowEnd { get; set; }

        #endregion

        #region Factory Methods

        /// <summary>
        /// Creates a successful result with the specified max fuel allowed
        /// </summary>
        public static FuelAllowanceResult Success(decimal maxFuelAllowed, string? message = null)
        {
            return new FuelAllowanceResult
            {
                IsAllowed = true,
                MaxFuelAllowed = maxFuelAllowed,
                Message = message ?? $"Fueling allowed: up to {maxFuelAllowed:F1}L"
            };
        }

        /// <summary>
        /// Creates a blocked result with the specified reason
        /// </summary>
        public static FuelAllowanceResult Blocked(string reason)
        {
            return new FuelAllowanceResult
            {
                IsAllowed = false,
                MaxFuelAllowed = 0,
                BlockedReason = reason,
                Message = $"Fueling blocked: {reason}"
            };
        }

        #endregion
    }

    /// <summary>
    /// Information about an applied rule set
    /// </summary>
    public class AppliedRuleSetInfo
    {
        public int RuleSetId { get; set; }
        public string RuleSetName { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;  // Site, VehicleType, Vehicle, Tag
        public string TargetName { get; set; } = string.Empty;
        public int Priority { get; set; }
        public List<string> RulesApplied { get; set; } = new();
    }
}
