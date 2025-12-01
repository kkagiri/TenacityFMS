using System;

namespace FMS.Application.Features.FuelAudit.DTOs
{
    /// <summary>
    /// Fuel position for a vehicle at a specific point in time.
    /// Used to capture opening/closing stock for fuel audit.
    /// </summary>
    public class VehicleFuelPositionDTO
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string? NumberPlate { get; set; }
        public string? HyoungNo { get; set; }

        // Fuel Data
        /// <summary>Fuel level in liters</summary>
        public decimal? FuelLevel { get; set; }
        public string FuelLevelUnit { get; set; } = "Liters";

        /// <summary>When this reading was taken</summary>
        public DateTime? ReadingTimestamp { get; set; }

        /// <summary>The date we asked for (opening or closing)</summary>
        public DateTime ReadingDate { get; set; }

        /// <summary>Reading type: "opening" or "closing"</summary>
        public string ReadingType { get; set; } = "opening";

        // Data Quality
        public FuelDataQuality DataQuality { get; set; }
        public string? DataQualityReason { get; set; }

        /// <summary>How many days back we had to search for data</summary>
        public int DaysFromRequestedDate { get; set; }

        // Vehicle Status at Reading Time
        public bool WasOnline { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool? IgnitionStatus { get; set; }

        // For Audit Trail
        /// <summary>The date we asked for (alias for ReadingDate)</summary>
        public DateTime RequestedDate => ReadingDate;

        /// <summary>The actual date of the data (may differ from requested if interpolated)</summary>
        public DateTime? ActualDataDate { get; set; }

        // Source Tracking
        /// <summary>GPSGate device/user ID</summary>
        public string? GPSDeviceId { get; set; }

        /// <summary>GPSGate trackInfoId for traceability</summary>
        public int? TrackInfoId { get; set; }

        /// <summary>Raw JSON data from GPS provider (for debugging/audit)</summary>
        public string? RawData { get; set; }
    }
}
