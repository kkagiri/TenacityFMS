using System;

namespace FMS.Application.Features.FuelAudit.DTOs
{
    /// <summary>
    /// Detected refuel event from GPS data.
    /// Identifies fuel level increases from track data.
    /// </summary>
    public class RefuelEventDTO
    {
        public int VehicleId { get; set; }
        public string? VehicleName { get; set; }
        public string? NumberPlate { get; set; }

        /// <summary>Timestamp of the refuel event</summary>
        public DateTime EventDate { get; set; }

        /// <summary>Fuel level before refueling (Liters)</summary>
        public decimal FuelLevelBefore { get; set; }

        /// <summary>Fuel level after refueling (Liters)</summary>
        public decimal FuelLevelAfter { get; set; }

        /// <summary>Calculated litres added</summary>
        public decimal FuelAdded { get; set; }

        // Location
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        /// <summary>Reverse geocoded location name if available</summary>
        public string? Location { get; set; }

        // Detection metadata
        /// <summary>Source of detection (GPS, Manual, etc.)</summary>
        public string DetectionSource { get; set; } = "GPS";

        /// <summary>Confidence level of the detection: High, Medium, Low</summary>
        public string? DetectionConfidence { get; set; }

        /// <summary>Confidence level as a decimal (0-1)</summary>
        public decimal? ConfidenceLevel { get; set; }
    }
}
