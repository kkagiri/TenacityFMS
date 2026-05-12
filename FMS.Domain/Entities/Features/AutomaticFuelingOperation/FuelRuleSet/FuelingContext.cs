using System.ComponentModel;

namespace FMS.Domain.Entities.Features.FuelRule
{
    /// <summary>
    /// Context containing all information needed to evaluate fueling rules
    /// and calculate the maximum fuel allowance for a fueling request.
    /// </summary>
    public class FuelingContext
    {
        #region Vehicle Information

        /// <summary>
        /// The vehicle being fueled
        /// </summary>
        public Vehicle Vehicle { get; set; } = null!;

        /// <summary>
        /// Vehicle ID for lookup
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// Vehicle type ID for rule lookup
        /// </summary>
        public int? VehicleTypeId { get; set; }

        #endregion

        #region Tag Information

        /// <summary>
        /// The fuel tag being used (if any)
        /// </summary>
        public FuelTag? Tag { get; set; }

        /// <summary>
        /// Tag ID for rule lookup
        /// </summary>
        public int? TagId { get; set; }

        /// <summary>
        /// Tag number/name for display
        /// </summary>
        public string? TagName { get; set; }

        #endregion

        #region Site Information

        /// <summary>
        /// Site where fueling is occurring
        /// </summary>
        public int SiteId { get; set; }

        #endregion

        #region Tank Capacity - HARD LIMITS (Physics)

        /// <summary>
        /// Vehicle's total tank capacity in liters.
        /// This is an ABSOLUTE limit - cannot be overridden by any rule.
        /// </summary>
        public decimal TankCapacity { get; set; }

        /// <summary>
        /// Current fuel level in the tank (from GPS sensor if available).
        /// Null if vehicle doesn't have a fuel sensor or data is unavailable.
        /// </summary>
        public decimal? CurrentFuelLevel { get; set; }

        /// <summary>
        /// Whether the vehicle has an active GPS fuel sensor.
        /// If true, CurrentFuelLevel can be used for precise calculation.
        /// If false, we must use TankCapacity as the hard limit.
        /// </summary>
        public bool HasFuelSensor { get; set; }

        /// <summary>
        /// Timestamp when CurrentFuelLevel was last updated.
        /// Used to determine if the reading is recent enough to be reliable.
        /// </summary>
        public DateTime? FuelLevelTimestamp { get; set; }

        /// <summary>
        /// Calculates the maximum physical fuel that can fit in the tank.
        /// This is the HARD LIMIT that no rule can override.
        ///
        /// If GPS sensor is available and tank capacity is known: TankCapacity - CurrentFuelLevel
        /// If GPS sensor but no tank capacity: Uses current fuel level as limit (assumes roughly half tank)
        /// If no GPS sensor: TankCapacity (assume empty for safety, but prevents overfill if known)
        /// </summary>
        public decimal MaxPhysicalFuelAllowed
        {
            get
            {
                if (HasFuelSensor && CurrentFuelLevel.HasValue)
                {
                    if (TankCapacity > 0)
                    {
                        // GPS sensor available with known tank capacity - precise calculation
                        // Available space = Tank capacity - Current fuel level
                        return Math.Max(0, TankCapacity - CurrentFuelLevel.Value);
                    }
                    else
                    {
                        // GPS sensor available but tank capacity unknown
                        // We cannot safely calculate available space without tank capacity
                        // Log warning and return a safe maximum (current fuel suggests tank size)
                        // Estimate available as same as current fuel (assumes ~50% full)
                        return CurrentFuelLevel.Value;
                    }
                }
                else
                {
                    // No GPS sensor - use full tank capacity as limit
                    // This prevents fueling more than the tank can hold
                    return TankCapacity;
                }
            }
        }

        #endregion

        #region Usage Tracking - For Soft Limits

        /// <summary>
        /// Total fuel taken today (for daily limit rules)
        /// </summary>
        public decimal FuelTakenToday { get; set; }

        /// <summary>
        /// Total fuel taken this month (for monthly limit rules)
        /// </summary>
        public decimal FuelTakenThisMonth { get; set; }

        /// <summary>
        /// Number of refills completed today (for refill count rules)
        /// </summary>
        public int NoOfRefillToday { get; set; }

        /// <summary>
        /// Number of refills completed this week (for refill count rules)
        /// </summary>
        public int NoOfRefillThisWeek { get; set; }

        /// <summary>
        /// Number of refills completed this month (for refill count rules)
        /// </summary>
        public int NoOfRefillThisMonth { get; set; }

        #endregion

        #region Request Information

        /// <summary>
        /// The fuel amount being requested (if pre-set fueling)
        /// </summary>
        public decimal? RequestedFuelAmount { get; set; }

        /// <summary>
        /// Current time for time window rule evaluation.
        /// This should be set to LOCAL time (converted from UTC using system timezone)
        /// since time window rules are configured in local time by users.
        /// </summary>
        public DateTime CurrentTime { get; set; } = DateTime.Now;

        #endregion
    }
}