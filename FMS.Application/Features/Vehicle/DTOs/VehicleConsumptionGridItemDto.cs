/**
 * File: VehicleConsumptionGridItemDto.cs
 * Purpose: Defines raw vehicle consumption grid rows for the vehicle module landing page.
 * Dependencies: None
 * Last Modified: 2026-04-20
 */
using System;

namespace FMS.Application.Features.Vehicle.DTOs
{
    public class VehicleConsumptionGridItemDto
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string HyoungNo { get; set; } = string.Empty;
        public string NumberPlate { get; set; } = string.Empty;
        public int VehicleTypeId { get; set; }
        public string VehicleTypeName { get; set; } = string.Empty;
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public decimal ExpectedAverage { get; set; }
        public decimal ActualEfficiency { get; set; }
        public decimal TotalFuel { get; set; }
        public decimal FuelLost { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal EngineHours { get; set; }
        public decimal MaxSpeed { get; set; }
        public decimal AvgSpeed { get; set; }
        public string ReportReference { get; set; } = string.Empty;
        public string Comments { get; set; } = string.Empty;
        public bool IsKmPerLiter { get; set; }
    }
}