/**
 * File: VehicleConsumptionRecordDetailDto.cs
 * Purpose: Defines a single raw vehicle consumption record detail for the vehicle module drill-down view.
 * Dependencies: None
 * Last Modified: 2026-04-20
 */
using System;

namespace FMS.Application.Features.Vehicle.DTOs
{
    public class VehicleConsumptionRecordDetailDto
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string VehicleCode { get; set; } = string.Empty;
        public string NumberPlate { get; set; } = string.Empty;
        public string VehicleTypeName { get; set; } = string.Empty;
        public string VehicleModelName { get; set; } = string.Empty;
        public string ManufacturerName { get; set; } = string.Empty;
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string SourceDriverName { get; set; } = string.Empty;
        public string AssignedEmployeeName { get; set; } = string.Empty;
        public decimal ExpectedAverage { get; set; }
        public decimal ActualEfficiency { get; set; }
        public decimal TotalFuel { get; set; }
        public decimal FuelLost { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal EngineHours { get; set; }
        public decimal MaxSpeed { get; set; }
        public decimal AvgSpeed { get; set; }
        public decimal FlowMeterFuelUsed { get; set; }
        public decimal FlowMeterFuelLost { get; set; }
        public decimal FlowMeterEfficiency { get; set; }
        public decimal FlowMeterEngineHours { get; set; }
        public string ReportReference { get; set; } = string.Empty;
        public string Comments { get; set; } = string.Empty;
        public bool IsKmPerLiter { get; set; }
        public bool IsModified { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
}