using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelAudit.DTOs
{
    /// <summary>
    /// Request DTO for fetching fleet fuel positions at a specific date.
    /// </summary>
    public class FleetFuelPositionRequestDTO
    {
        /// <summary>List of vehicle IDs to fetch fuel positions for</summary>
        public List<int> VehicleIds { get; set; } = new();

        /// <summary>Target date for fuel readings</summary>
        public DateTime Date { get; set; }

        /// <summary>Opening or Closing stock reading type</summary>
        public string ReadingType { get; set; } = "opening";

        /// <summary>Optional audit ID to link readings to</summary>
        public int? AuditId { get; set; }

        /// <summary>User ID who triggered the request</summary>
        public int? RequestedBy { get; set; }
    }

    /// <summary>
    /// Response DTO for fleet fuel positions.
    /// </summary>
    public class FleetFuelPositionResponseDTO
    {
        /// <summary>Date of the request</summary>
        public DateTime RequestedDate { get; set; }

        /// <summary>Reading type (opening/closing)</summary>
        public string ReadingType { get; set; } = string.Empty;

        /// <summary>Total vehicles requested</summary>
        public int TotalVehiclesRequested { get; set; }

        /// <summary>Vehicles with successful readings</summary>
        public int VehiclesWithData { get; set; }

        /// <summary>Vehicles without data or errors</summary>
        public int VehiclesWithoutData { get; set; }

        /// <summary>Total fuel across all vehicles (Liters)</summary>
        public decimal? TotalFleetFuel { get; set; }

        /// <summary>Individual vehicle fuel positions</summary>
        public List<VehicleFuelPositionDTO> VehiclePositions { get; set; } = new();

        /// <summary>Summary of data quality across fleet</summary>
        public DataQualitySummaryDTO? DataQualitySummary { get; set; }
    }

    /// <summary>
    /// Summary of data quality across the fleet.
    /// </summary>
    public class DataQualitySummaryDTO
    {
        public int ExactReadings { get; set; }
        public int InterpolatedReadings { get; set; }
        public int UnavailableReadings { get; set; }
        public int NoSensorVehicles { get; set; }
        public int SensorNotReportingVehicles { get; set; }
        public int ManualEntryReadings { get; set; }
        public int EstimatedFromRefillReadings { get; set; }
    }
}
