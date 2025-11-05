using System;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// Represents a single point in a vehicle's historical track
    /// </summary>
    public class TrackPointDTO
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal? Altitude { get; set; }
        public decimal? Speed { get; set; }
        public decimal? Heading { get; set; }
        public DateTime Timestamp { get; set; }
        public string? Address { get; set; }
        public decimal? Odometer { get; set; }
    }
}
