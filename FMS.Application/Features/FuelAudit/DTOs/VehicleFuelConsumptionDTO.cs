using System;

namespace FMS.Application.Features.FuelAudit.DTOs
{
    /// <summary>
    /// Fuel consumption data for a vehicle over a period.
    /// Aggregates consumption metrics from GPS tracking.
    /// </summary>
    public class VehicleFuelConsumptionDTO
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string? NumberPlate { get; set; }
        public string? HyoungNo { get; set; }

        // Period
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        // Opening/Closing Fuel Levels
        /// <summary>Opening fuel level (Liters)</summary>
        public decimal? OpeningFuelLevel { get; set; }

        /// <summary>Closing fuel level (Liters)</summary>
        public decimal? ClosingFuelLevel { get; set; }

        // Consumption Metrics
        /// <summary>Gross consumption = Opening - Closing (Liters)</summary>
        public decimal? GrossConsumption { get; set; }

        /// <summary>Total fuel consumed from fuel probe (Liters)</summary>
        public decimal? TotalFuelConsumed { get; set; }

        /// <summary>Total fuel from flow meter if available (Liters)</summary>
        public decimal? FlowMeterFuelUsed { get; set; }

        /// <summary>Total distance traveled (Kilometers)</summary>
        public decimal? TotalDistance { get; set; }

        /// <summary>Total engine hours</summary>
        public decimal? EngineHours { get; set; }

        // Calculated Efficiency
        /// <summary>
        /// Fuel efficiency value.
        /// Check IsKmperLiter to determine if this is km/L or L/hr
        /// </summary>
        public decimal? FuelEfficiency { get; set; }

        /// <summary>
        /// If true, FuelEfficiency is in km/L (kilometers per liter).
        /// If false, FuelEfficiency is in L/hr (liters per hour) - for stationary/generator vehicles.
        /// Comes from Vehicleconsumption.IsKmperLiter field.
        /// </summary>
        public bool IsKmperLiter { get; set; } = true;

        /// <summary>Convenience property - Fuel efficiency (km/L)</summary>
        public decimal? FuelEfficiencyKmPerL { get; set; }

        /// <summary>Convenience property - Fuel efficiency (L/100km)</summary>
        public decimal? FuelEfficiencyLPer100Km { get; set; }

        // Data Quality
        public FuelDataQuality OpeningDataQuality { get; set; }
        public FuelDataQuality ClosingDataQuality { get; set; }
        public bool HasCompleteData { get; set; }
        public string? DataQualityNotes { get; set; }
    }
}
