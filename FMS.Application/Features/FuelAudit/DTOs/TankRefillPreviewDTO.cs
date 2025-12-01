using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelAudit.DTOs
{
    /// <summary>
    /// DTO for fuel refill preview data used in audit wizard step 4
    /// Shows vehicles that were fueled from selected tanks during the audit period
    /// </summary>
    public class TankRefillPreviewDTO
    {
        /// <summary>
        /// Fuel refill record ID
        /// </summary>
        public int RefillId { get; set; }

        /// <summary>
        /// Vehicle ID
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// Vehicle number/plate (HyoungNo)
        /// </summary>
        public string VehicleNo { get; set; } = string.Empty;

        /// <summary>
        /// Tank ID the fuel came from
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Tank name
        /// </summary>
        public string TankName { get; set; } = string.Empty;

        /// <summary>
        /// Driver ID
        /// </summary>
        public int? DriverId { get; set; }

        /// <summary>
        /// Driver name
        /// </summary>
        public string DriverName { get; set; } = string.Empty;

        /// <summary>
        /// Date of refill
        /// </summary>
        public DateTime? RefillDate { get; set; }

        /// <summary>
        /// Amount of fuel dispensed (liters)
        /// </summary>
        public decimal FuelAmount { get; set; }

        /// <summary>
        /// Previous meter/odometer reading
        /// </summary>
        public decimal? PreviousMeterReading { get; set; }

        /// <summary>
        /// Current meter/odometer reading
        /// </summary>
        public decimal? CurrentMeterReading { get; set; }

        /// <summary>
        /// Distance traveled (difference between meter readings)
        /// </summary>
        public decimal? DistanceTraveled =>
            (CurrentMeterReading.HasValue && PreviousMeterReading.HasValue)
                ? CurrentMeterReading.Value - PreviousMeterReading.Value
                : null;

        /// <summary>
        /// Fuel consumption rate (km per liter) - calculated
        /// </summary>
        public decimal? KmPerLiter =>
            (DistanceTraveled.HasValue && FuelAmount > 0)
                ? Math.Round(DistanceTraveled.Value / FuelAmount, 2)
                : null;

        /// <summary>
        /// Site ID where refill occurred
        /// </summary>
        public int SiteId { get; set; }

        /// <summary>
        /// Site name
        /// </summary>
        public string SiteName { get; set; } = string.Empty;

        /// <summary>
        /// Fuel tag ID if available
        /// </summary>
        public string? TagId { get; set; }

        /// <summary>
        /// Comment/notes
        /// </summary>
        public string? Comment { get; set; }

        /// <summary>
        /// User who performed the fueling
        /// </summary>
        public string? FuelBy { get; set; }
    }

    /// <summary>
    /// Request DTO for getting tank refills preview
    /// </summary>
    public class GetTankRefillsPreviewRequest
    {
        /// <summary>
        /// List of tank IDs to get refills from
        /// </summary>
        public List<int> TankIds { get; set; } = new();

        /// <summary>
        /// Start date of the audit period
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// End date of the audit period
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Site ID (optional, for additional filtering)
        /// </summary>
        public int? SiteId { get; set; }
    }

    /// <summary>
    /// Summary of refills grouped by vehicle
    /// </summary>
    public class VehicleRefillSummaryDTO
    {
        public int VehicleId { get; set; }
        public string VehicleNo { get; set; } = string.Empty;
        public int? DriverId { get; set; }
        public string DriverName { get; set; } = string.Empty;

        /// <summary>
        /// Vehicle type ID for grouping
        /// </summary>
        public int? VehicleTypeId { get; set; }

        /// <summary>
        /// Vehicle type name (e.g., "Truck", "Excavator", "Generator")
        /// </summary>
        public string VehicleTypeName { get; set; } = string.Empty;

        /// <summary>
        /// True = uses km/L (distance-based vehicles like trucks)
        /// False = uses L/hr (hour-based equipment like generators, excavators)
        /// </summary>
        public bool IsKmL { get; set; }

        #region Vehicle Classification (5 Categories)

        /// <summary>
        /// Vehicle category (1-5):
        /// 1 = Site GPS Fleet (at audit site, has GPS)
        /// 2 = Site Full Tank (at audit site, no GPS, isKmL=true)
        /// 3 = Site Equipment (at audit site, no GPS, isKmL=false)
        /// 4 = Cross-Site Company (different site, isCompanyVehicle=true)
        /// 5 = External Non-Company (not company owned)
        /// </summary>
        public int VehicleCategory { get; set; }

        /// <summary>
        /// Human-readable category name
        /// </summary>
        public string VehicleCategoryName { get; set; } = string.Empty;

        /// <summary>
        /// Whether vehicle has GPS with fuel sensor installed
        /// </summary>
        public bool HasGPS { get; set; }

        /// <summary>
        /// Whether this is a company-owned vehicle
        /// </summary>
        public bool IsCompanyVehicle { get; set; }

        /// <summary>
        /// Whether vehicle's WorkingSiteId matches the audit site
        /// </summary>
        public bool BelongsToAuditSite { get; set; }

        /// <summary>
        /// Primary data source for opening/closing readings:
        /// "GPS_REST" = GPSGate REST API (real-time)
        /// "GPS_SOAP" = GPSGate SOAP Report 212 (refuel events)
        /// "Estimated" = Calculated from refill patterns
        /// "FuelRefill" = Manual FuelRefill table only
        /// "Unavailable" = Cannot determine opening/closing
        /// </summary>
        public string DataSourcePrimary { get; set; } = "Unavailable";

        /// <summary>
        /// Data confidence level:
        /// "HIGH" = GPS data available (Categories 1, 4)
        /// "MEDIUM" = Estimated from full tank policy (Category 2)
        /// "LOW" = Equipment with no reliable estimate (Category 3)
        /// "ACCOUNTED" = External vehicle, fuel issued only (Category 5)
        /// </summary>
        public string DataConfidence { get; set; } = "LOW";

        /// <summary>
        /// Whether vehicle follows full tank policy (from Vehicle.IsFullTankPolicy)
        /// Used to determine if we can estimate consumption from refill amounts
        /// </summary>
        public bool IsFullTankPolicy { get; set; }

        /// <summary>
        /// Vehicle's fuel tank capacity in liters (from Vehicle.FuelTankCapacity)
        /// Used for estimate calculations and sanity checks
        /// </summary>
        public decimal? FuelTankCapacity { get; set; }

        /// <summary>
        /// Icon for UI display based on category
        /// </summary>
        public string CategoryIcon => VehicleCategory switch
        {
            1 => "fa-satellite",      // GPS Fleet
            2 => "fa-truck",          // Full Tank
            3 => "fa-gear",           // Equipment
            4 => "fa-arrow-right-arrow-left", // Cross-Site
            5 => "fa-user-plus",      // External
            _ => "fa-question"
        };

        /// <summary>
        /// Badge color class for UI display
        /// </summary>
        public string CategoryBadgeColor => VehicleCategory switch
        {
            1 => "green",   // HIGH confidence
            2 => "yellow",  // MEDIUM confidence
            3 => "orange",  // LOW confidence
            4 => "cyan",    // HIGH confidence (cross-site)
            5 => "pink",    // ACCOUNTED only
            _ => "gray"
        };

        #endregion

        /// <summary>
        /// Display label for efficiency unit
        /// </summary>
        public string EfficiencyUnit => IsKmL ? "km/L" : "L/hr";

        /// <summary>
        /// Total number of refills during the period
        /// </summary>
        public int RefillCount { get; set; }

        /// <summary>
        /// Total fuel amount dispensed (liters)
        /// </summary>
        public decimal TotalFuelAmount { get; set; }

        /// <summary>
        /// Total distance traveled (km) or engine hours
        /// </summary>
        public decimal? TotalDistanceOrHours { get; set; }

        /// <summary>
        /// Calculated efficiency based on vehicle type:
        /// - For km/L vehicles: distance / fuel (higher is better)
        /// - For L/hr vehicles: fuel / hours (lower is better)
        /// </summary>
        public decimal? Efficiency { get; set; }

        /// <summary>
        /// First refill date in the period
        /// </summary>
        public DateTime? FirstRefillDate { get; set; }

        /// <summary>
        /// Last refill date in the period
        /// </summary>
        public DateTime? LastRefillDate { get; set; }

        /// <summary>
        /// List of individual refill records
        /// </summary>
        public List<TankRefillPreviewDTO> Refills { get; set; } = new();
    }
}
