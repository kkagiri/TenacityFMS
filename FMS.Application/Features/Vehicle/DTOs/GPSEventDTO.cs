using System;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// Represents a GPS event or alert for a vehicle
    /// </summary>
    public class GPSEventDTO
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string EventName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public GPSEventSeverity Severity { get; set; }
        public DateTime Timestamp { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? Address { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public string? AcknowledgedBy { get; set; }
        public string? AdditionalData { get; set; } // JSON for extra info
    }

    public enum GPSEventSeverity
    {
        Info = 0,
        Warning = 1,
        Critical = 2
    }
}
