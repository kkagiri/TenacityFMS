using System;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// DTO for vehicle consumption data
    /// </summary>
    public class ConsumptionDTO
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public int SiteId { get; set; }
        public DateTime Date { get; set; }
        public decimal? MaxSpeed { get; set; }
        public decimal? AvgSpeed { get; set; }
        public decimal? ExpectedConsumption { get; set; }
        public decimal? TotalDistance { get; set; }
        public string? EmployeeName { get; set; }

        /// <summary>
        /// Alternative name for EmployeeName, used by some clients
        /// </summary>
        public string? DriverName
        {
            get { return EmployeeName; }
            set { EmployeeName = value; }
        }

        public string Comments { get; set; }
        public decimal? FuelLost { get; set; }
        public decimal? FuelEfficiency { get; set; }
        public decimal? TotalFuel { get; set; }
        public decimal? FlowMeterFuelUsed { get; set; }
        public decimal? FlowMeterFuelLost { get; set; }
        public decimal? FlowMeterEffiency { get; set; }
        public decimal? EngHours { get; set; }
        public decimal? FlowMeterEngineHrs { get; set; }
        public decimal? ExcessWorkingHrsCost { get; set; }
        public bool IsNightShift { get; set; }
        public bool IsKmperLiter { get; set; }
        public string? ReportId { get; set; }

        /// <summary>
        /// Flag indicating whether existing records should be overwritten
        /// </summary>
        public bool OverwriteExisting { get; set; } = false;

        /// <summary>
        /// Flag indicating whether to skip this record if it's a duplicate
        /// This is only used during import and is not persisted to the database
        /// </summary>
        public bool SkipDuplicates { get; set; } = false;

        /// <summary>
        /// For tracking row index during import for error reporting
        /// </summary>
        public int? RowIndex { get; set; }

        /// <summary>
        /// Flag indicating whether the record has been modified
        /// Maps to the sbyte IsModified in Vehicleconsumption entity
        /// </summary>
        public sbyte? IsModified { get; set; }
    }
}