using System;

namespace FMS.Domain.Entities.FuelAudit
{
    /// <summary>
    /// Stores GPS fuel readings for fuel audit records.
    /// Used to cache readings and avoid repeated API calls for the same date.
    /// </summary>
    public class FuelAuditGPSReading
    {
        public int Id { get; set; }

        /// <summary>
        /// FK to fuel_audits table (if linked to specific audit)
        /// </summary>
        public int? AuditId { get; set; }

        /// <summary>
        /// FK to vehicles table
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// The date we requested fuel reading for
        /// </summary>
        public DateTime ReadingDate { get; set; }

        /// <summary>
        /// Opening or closing stock reading
        /// </summary>
        public string ReadingType { get; set; } = "opening";

        // Fuel Data
        /// <summary>
        /// Fuel level in liters
        /// </summary>
        public decimal? FuelLevel { get; set; }

        public string FuelLevelUnit { get; set; } = "Liters";

        // Timestamp
        /// <summary>
        /// Actual timestamp from GPS track
        /// </summary>
        public DateTime? ReadingTimestamp { get; set; }

        /// <summary>
        /// Date of actual data (may differ from reading_date if interpolated)
        /// </summary>
        public DateTime? ActualDataDate { get; set; }

        // Data Quality
        /// <summary>
        /// Quality indicator: 1=Exact, 2=Interpolated, 3=Unavailable, 4=NoSensor, 5=SensorNotReporting
        /// </summary>
        public int DataQuality { get; set; } = 1;

        /// <summary>
        /// Human-readable reason for data quality status
        /// </summary>
        public string? DataQualityReason { get; set; }

        // Vehicle Status at Reading
        /// <summary>
        /// Was vehicle online at reading time
        /// </summary>
        public bool WasOnline { get; set; }

        /// <summary>
        /// GPS latitude at reading
        /// </summary>
        public decimal? Latitude { get; set; }

        /// <summary>
        /// GPS longitude at reading
        /// </summary>
        public decimal? Longitude { get; set; }

        /// <summary>
        /// Vehicle ignition status at reading
        /// </summary>
        public bool? IgnitionStatus { get; set; }

        // Source Tracking
        /// <summary>
        /// GPSGate user/device ID used
        /// </summary>
        public string? GPSDeviceId { get; set; }

        /// <summary>
        /// GPSGate trackInfoId for traceability
        /// </summary>
        public int? TrackInfoId { get; set; }

        // Audit Trail
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who triggered the reading
        /// </summary>
        public int? CreatedBy { get; set; }

        // Navigation properties
        public virtual Vehicle? Vehicle { get; set; }
    }
}
