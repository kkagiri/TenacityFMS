using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelAudit.DTOs
{
    /// <summary>
    /// Request DTO for category-aware fleet audit period fuel positions.
    /// Supports routing to appropriate data sources based on vehicle category.
    /// </summary>
    public class CategoryAuditRequestDTO
    {
        /// <summary>
        /// List of vehicles with their categories for appropriate routing
        /// </summary>
        public List<CategoryVehicleDTO> Vehicles { get; set; } = new();

        /// <summary>Start date (opening stock date)</summary>
        public DateTime StartDate { get; set; }

        /// <summary>End date (closing stock date)</summary>
        public DateTime EndDate { get; set; }

        /// <summary>Optional audit ID for linking readings</summary>
        public int? AuditId { get; set; }

        /// <summary>User ID who triggered the request</summary>
        public int? RequestedBy { get; set; }

        /// <summary>The audit site ID (for context)</summary>
        public int? AuditSiteId { get; set; }
    }

    /// <summary>
    /// Vehicle with category information for routing decisions
    /// </summary>
    public class CategoryVehicleDTO
    {
        /// <summary>Vehicle ID in FMS</summary>
        public int VehicleId { get; set; }

        /// <summary>Vehicle name/number (e.g., Hyoung No or Number Plate)</summary>
        public string? VehicleName { get; set; }

        /// <summary>
        /// Vehicle category (1-5):
        /// 1 = Site GPS Fleet (use REST API)
        /// 2 = Site Full Tank (use Estimation)
        /// 3 = Site Equipment (use FuelRefill only)
        /// 4 = Cross-Site Company (use REST/SOAP based on mapping)
        /// 5 = External Non-Company (no GPS data needed)
        /// </summary>
        public int Category { get; set; }

        /// <summary>Whether vehicle has GPS with fuel sensor</summary>
        public bool HasGPS { get; set; }

        /// <summary>Whether vehicle follows full tank policy</summary>
        public bool IsFullTankPolicy { get; set; }

        /// <summary>Vehicle tank capacity in liters</summary>
        public decimal? FuelTankCapacity { get; set; }

        /// <summary>Average fuel efficiency (km/L or L/hr)</summary>
        public decimal? AverageEfficiency { get; set; }

        /// <summary>Whether efficiency is km/L (true) or L/hr (false)</summary>
        public bool IsKmL { get; set; }

        /// <summary>Total fuel refilled during period (from Step 4)</summary>
        public decimal TotalFuelRefilled { get; set; }

        /// <summary>Number of refills during period</summary>
        public int RefillCount { get; set; }
    }

    /// <summary>
    /// Response DTO for category-aware fleet audit period.
    /// Contains opening and closing fuel with data source tracking.
    /// </summary>
    public class CategoryAuditResponseDTO
    {
        /// <summary>Audit period start date</summary>
        public DateTime StartDate { get; set; }

        /// <summary>Audit period end date</summary>
        public DateTime EndDate { get; set; }

        /// <summary>Total vehicles processed</summary>
        public int TotalVehicles { get; set; }

        /// <summary>Vehicle results by category</summary>
        public List<CategoryResultDTO> CategoryResults { get; set; } = new();

        /// <summary>Summary statistics</summary>
        public CategorySummaryDTO Summary { get; set; } = new();
    }

    /// <summary>
    /// Results for a specific category
    /// </summary>
    public class CategoryResultDTO
    {
        /// <summary>Category number (1-5)</summary>
        public int Category { get; set; }

        /// <summary>Category name</summary>
        public string CategoryName { get; set; } = string.Empty;

        /// <summary>Number of vehicles in this category</summary>
        public int VehicleCount { get; set; }

        /// <summary>Data source used for this category</summary>
        public string DataSource { get; set; } = string.Empty;

        /// <summary>Vehicle fuel results</summary>
        public List<VehicleFuelAuditResultDTO> Vehicles { get; set; } = new();

        /// <summary>Whether all vehicles in this category were processed successfully</summary>
        public bool AllProcessed { get; set; }

        /// <summary>Error message if not all processed</summary>
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Individual vehicle fuel audit result
    /// </summary>
    public class VehicleFuelAuditResultDTO
    {
        /// <summary>Vehicle ID</summary>
        public int VehicleId { get; set; }

        /// <summary>Vehicle name/number</summary>
        public string VehicleName { get; set; } = string.Empty;

        /// <summary>Vehicle category (1-5)</summary>
        public int Category { get; set; }

        #region Opening Stock

        /// <summary>Opening fuel level (liters)</summary>
        public decimal? OpeningFuelLevel { get; set; }

        /// <summary>Opening reading timestamp</summary>
        public DateTime? OpeningTimestamp { get; set; }

        /// <summary>Opening data quality</summary>
        public FuelDataQuality OpeningDataQuality { get; set; }

        /// <summary>Opening data quality explanation</summary>
        public string? OpeningDataQualityReason { get; set; }

        #endregion

        #region Closing Stock

        /// <summary>Closing fuel level (liters)</summary>
        public decimal? ClosingFuelLevel { get; set; }

        /// <summary>Closing reading timestamp</summary>
        public DateTime? ClosingTimestamp { get; set; }

        /// <summary>Closing data quality</summary>
        public FuelDataQuality ClosingDataQuality { get; set; }

        /// <summary>Closing data quality explanation</summary>
        public string? ClosingDataQualityReason { get; set; }

        #endregion

        #region Period Data

        /// <summary>Total fuel refilled during period</summary>
        public decimal TotalFuelRefilled { get; set; }

        /// <summary>Calculated consumption (Opening + Refills - Closing)</summary>
        public decimal? CalculatedConsumption { get; set; }

        /// <summary>External fuel consumed (not from site tanks)</summary>
        public decimal? ExternalFuel { get; set; }

        #endregion

        #region Data Source Tracking

        /// <summary>
        /// Primary data source used:
        /// "GPS_REST" = GPSGate REST API
        /// "GPS_SOAP" = GPSGate SOAP Report
        /// "Estimated" = Full tank estimation
        /// "FuelRefill" = Manual refill records
        /// "Unavailable" = No data available
        /// </summary>
        public string DataSource { get; set; } = "Unavailable";

        /// <summary>Confidence level: HIGH, MEDIUM, LOW, ACCOUNTED</summary>
        public string Confidence { get; set; } = "LOW";

        /// <summary>Whether this vehicle can be audited reliably</summary>
        public bool IsAuditable { get; set; }

        #endregion
    }

    /// <summary>
    /// Summary statistics for category audit
    /// </summary>
    public class CategorySummaryDTO
    {
        /// <summary>Vehicles with GPS data</summary>
        public int VehiclesWithGPS { get; set; }

        /// <summary>Vehicles with estimated data</summary>
        public int VehiclesWithEstimate { get; set; }

        /// <summary>Vehicles with refill data only</summary>
        public int VehiclesWithRefillOnly { get; set; }

        /// <summary>Vehicles with no data</summary>
        public int VehiclesWithNoData { get; set; }

        /// <summary>Total opening fuel (liters)</summary>
        public decimal? TotalOpeningFuel { get; set; }

        /// <summary>Total closing fuel (liters)</summary>
        public decimal? TotalClosingFuel { get; set; }

        /// <summary>Total fuel refilled (liters)</summary>
        public decimal TotalFuelRefilled { get; set; }

        /// <summary>Total calculated consumption (liters)</summary>
        public decimal? TotalCalculatedConsumption { get; set; }

        /// <summary>Data quality breakdown by category</summary>
        public Dictionary<int, string> DataQualityByCategory { get; set; } = new();
    }
}
