using System;

namespace FMS.Application.Features.GPSGate.DTOs
{
    /// <summary>
    /// DTO for Fuel Consumption Report (Report ID: 208)
    /// Contains vehicle fuel consumption data with engine hours, distance, and speed metrics
    /// </summary>
    public class FuelConsumptionReportDto
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; }
        public decimal? EngineHours { get; set; }
        public decimal? TotalFuelProbe { get; set; }
        public decimal? FlowMeterEngineHours { get; set; }
        public decimal? FlowMeterFuelUsed { get; set; }
        public string LastLocation { get; set; }
        public decimal? TotalDistance { get; set; }
        public decimal? AverageSpeed { get; set; }
        public decimal? MaxSpeed { get; set; }
        public decimal? TotalFuelNormal { get; set; }
        public decimal? TotalFuelIdle { get; set; }
        public decimal? EngineHoursNormal { get; set; }
        public decimal? EngineHoursIdle { get; set; }
        public DateTime? ReportDate { get; set; }
    }
}
