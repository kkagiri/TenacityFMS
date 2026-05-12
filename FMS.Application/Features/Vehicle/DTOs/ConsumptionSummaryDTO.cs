using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// DTO for consumption summary grouped by site
    /// </summary>
    public class ConsumptionSummaryBySiteDTO
    {
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public int VehicleCount { get; set; }
        public decimal TotalFuelConsumed { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngineHours { get; set; }
        public decimal AverageConsumption { get; set; }
        public decimal AverageEfficiency { get; set; }
        public int RefillCount { get; set; }
        public List<ConsumptionByVehicleDTO> Vehicles { get; set; } = new List<ConsumptionByVehicleDTO>();
    }

    /// <summary>
    /// DTO for consumption data by individual vehicle within a site
    /// </summary>
    public class ConsumptionByVehicleDTO
    {
        public int VehicleId { get; set; }
        public string VehicleCode { get; set; }
        public string VehicleType { get; set; }
        public string VehicleModel { get; set; }
        public string Manufacturer { get; set; }
        public decimal TotalFuelConsumed { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngineHours { get; set; }
        public decimal AverageConsumption { get; set; }
        public decimal FuelEfficiency { get; set; }
        public decimal ExpectedAverage { get; set; }
        public decimal EfficiencyVariance { get; set; }
        public int RefillCount { get; set; }
        public bool IsKmPerLiter { get; set; }
        public DateTime? LastRefillDate { get; set; }
    }

    /// <summary>
    /// DTO for consumption summary grouped by vehicle model (for charts)
    /// </summary>
    public class ConsumptionByVehicleModelDTO
    {
        public string VehicleModel { get; set; }
        public string VehicleType { get; set; }
        public string Manufacturer { get; set; }
        public int VehicleCount { get; set; }
        public decimal TotalFuelConsumed { get; set; }
        public decimal AverageConsumption { get; set; }
        public decimal AverageEfficiency { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngineHours { get; set; }
        public decimal ExpectedAverage { get; set; }
        public decimal EfficiencyVariance { get; set; } // Difference from expected
        public int RefillCount { get; set; }
    }

    /// <summary>
    /// DTO for consumption summary grouped by vehicle type (for comparison charts)
    /// </summary>
    public class ConsumptionByVehicleTypeDTO
    {
        public string VehicleType { get; set; }
        public int VehicleCount { get; set; }
        public int ModelCount { get; set; }
        public decimal TotalFuelConsumed { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngineHours { get; set; }
        public decimal AverageConsumption { get; set; }
        public decimal AverageEfficiency { get; set; }
        public decimal ExpectedAverage { get; set; }
        public decimal EfficiencyVariance { get; set; }
        public int RefillCount { get; set; }
    }

    /// <summary>
    /// DTO for overall consumption summary metrics
    /// </summary>
    public class ConsumptionOverallSummaryDTO
    {
        public decimal TotalFuelConsumed { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngineHours { get; set; }
        public decimal AverageConsumption { get; set; }
        public decimal AverageEfficiency { get; set; }
        public int TotalVehicles { get; set; }
        public int TotalRefills { get; set; }
        public int TotalSites { get; set; }
        public decimal FuelCostEstimate { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }

    /// <summary>
    /// DTO for consumption report with all summaries
    /// </summary>
    public class ConsumptionReportSummaryDTO
    {
        public ConsumptionOverallSummaryDTO OverallSummary { get; set; }
        public List<ConsumptionSummaryBySiteDTO> SiteSummaries { get; set; } = new List<ConsumptionSummaryBySiteDTO>();
        public List<ConsumptionByVehicleModelDTO> ModelSummaries { get; set; } = new List<ConsumptionByVehicleModelDTO>();
        public List<ConsumptionByVehicleTypeDTO> TypeSummaries { get; set; } = new List<ConsumptionByVehicleTypeDTO>();
        public List<ConsumptionTrendDataDTO> TrendData { get; set; } = new List<ConsumptionTrendDataDTO>();
        public List<VehicleComparisonDTO> VehicleComparisons { get; set; } = new List<VehicleComparisonDTO>();
    }

    /// <summary>
    /// DTO for individual vehicle comparison data
    /// </summary>
    public class VehicleComparisonDTO
    {
        public int VehicleId { get; set; }
        public string VehicleCode { get; set; }
        public string VehicleType { get; set; }
        public string VehicleModel { get; set; }
        public string Manufacturer { get; set; }
        public string SiteName { get; set; }
        public decimal TotalFuelConsumed { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngineHours { get; set; }
        public decimal AverageConsumption { get; set; }
        public decimal FuelEfficiency { get; set; }
        public decimal ExpectedAverage { get; set; }
        public decimal EfficiencyVariance { get; set; }
        public int RefillCount { get; set; }
        public bool IsKmPerLiter { get; set; }
    }

    /// <summary>
    /// DTO for consumption trend data (for time-based charts)
    /// </summary>
    public class ConsumptionTrendDataDTO
    {
        public DateTime Date { get; set; }
        public string Period { get; set; } // Week, Month, Quarter, Year
        public decimal TotalFuelConsumed { get; set; }
        public decimal AverageConsumption { get; set; }
        public int VehicleCount { get; set; }
        public int RefillCount { get; set; }
    }

    /// <summary>
    /// DTO for detailed vehicle consumption (for details page)
    /// </summary>
    public class VehicleConsumptionDetailDTO
    {
        public int VehicleId { get; set; }
        public string VehicleCode { get; set; }
        public string VehicleType { get; set; }
        public string VehicleModel { get; set; }
        public string Manufacturer { get; set; }
        public string NumberPlate { get; set; }
        public string WorkingSiteName { get; set; }
        public int WorkingSiteId { get; set; }

        // Consumption summary for the period
        public decimal TotalFuelConsumed { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngineHours { get; set; }
        public decimal AverageConsumption { get; set; }
        public decimal FuelEfficiency { get; set; }
        public bool IsKmPerLiter { get; set; }

        // Refill history
        public List<RefillRecordDTO> RefillHistory { get; set; } = new List<RefillRecordDTO>();

        // Daily consumption data for graphs
        public List<DailyConsumptionDTO> DailyConsumption { get; set; } = new List<DailyConsumptionDTO>();

        // GPS tracking data placeholder
        public VehicleGPSTrackingDTO GPSData { get; set; }
    }

    /// <summary>
    /// DTO for refill records
    /// </summary>
    public class RefillRecordDTO
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public decimal FuelAmount { get; set; }
        public decimal PreviousMeterReading { get; set; }
        public decimal CurrentMeterReading { get; set; }
        public decimal DistanceOrEngineHours { get; set; }
        public decimal Consumption { get; set; }
        public string SiteName { get; set; }
        public string FuelBy { get; set; }
        public string DriverName { get; set; }
        public string Comment { get; set; }
    }

    /// <summary>
    /// DTO for daily consumption data (for fuel graph)
    /// </summary>
    public class DailyConsumptionDTO
    {
        public DateTime Date { get; set; }
        public decimal FuelConsumed { get; set; }
        public decimal Distance { get; set; }
        public decimal EngineHours { get; set; }
        public decimal Consumption { get; set; }
        public decimal Efficiency { get; set; }
    }

    /// <summary>
    /// DTO for GPS tracking data (placeholder - to be populated from VehicleTrackingController)
    /// </summary>
    public class VehicleGPSTrackingDTO
    {
        public bool IsOnline { get; set; }
        public DateTime? LastUpdate { get; set; }
        public decimal? CurrentLatitude { get; set; }
        public decimal? CurrentLongitude { get; set; }
        public decimal? CurrentSpeed { get; set; }
        public decimal? TotalOdometer { get; set; }
        public decimal? TotalEngineHours { get; set; }
        public List<GPSTrackPointDTO> TrackHistory { get; set; } = new List<GPSTrackPointDTO>();
    }

    /// <summary>
    /// DTO for GPS track points
    /// </summary>
    public class GPSTrackPointDTO
    {
        public DateTime Timestamp { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal Speed { get; set; }
        public decimal? FuelLevel { get; set; }
    }
}
