/**
 * File:          GpsConsumptionAnalyticsDTO.cs
 * Purpose:       DTO for GPS consumption analytics — daily aggregates and by-vehicle-type breakdowns.
 * Dependencies:  None
 * Last Modified: 2026-04-16
 *
 * Key Types:
 * - GpsConsumptionDailyDTO:      One row per date with totals
 * - GpsConsumptionByVehicleTypeDTO: One row per vehicle type
 * - GpsConsumptionAnalyticsDTO:  Envelope returned by the analytics endpoint
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FMS.Consumption
{
    public class GpsConsumptionAnalyticsDTO
    {
        public decimal TotalFuel { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngHours { get; set; }
        public decimal TotalFuelLost { get; set; }
        public decimal AvgSpeed { get; set; }
        public decimal AvgConsumption { get; set; }
        public int TotalRecords { get; set; }
        public int TotalVehicles { get; set; }
        public List<GpsConsumptionDailyDTO> DailyData { get; set; } = new();
        public List<GpsConsumptionByVehicleTypeDTO> ByVehicleType { get; set; } = new();
    }

    public class GpsConsumptionDailyDTO
    {
        public DateTime Date { get; set; }
        public decimal TotalFuel { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngHours { get; set; }
        public decimal AvgSpeed { get; set; }
        public decimal MaxSpeed { get; set; }
        public decimal FuelLost { get; set; }
        public int RecordCount { get; set; }
        public int VehicleCount { get; set; }
    }

    public class GpsConsumptionByVehicleTypeDTO
    {
        public string VehicleType { get; set; } = string.Empty;
        public decimal TotalFuel { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalEngHours { get; set; }
        public int VehicleCount { get; set; }
        public int RecordCount { get; set; }
    }
}
