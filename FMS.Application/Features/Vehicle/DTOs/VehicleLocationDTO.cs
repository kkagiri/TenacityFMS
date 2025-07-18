using System;

namespace FMS.Application.Features.Vehicle.DTOs {
    public class VehicleLocationDTO {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = null!;
        public string? NumberPlate { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public DateTime LastUpdated { get; set; }
        public decimal? Speed { get; set; }
        public decimal? Heading { get; set; }
        public decimal? Altitude { get; set; }
        public bool IsOnline { get; set; }
        public string? Address { get; set; }
        public bool HasGPSInstalled { get; set; }
        public int? DeviceId { get; set; }

        // Status properties
        public string Status => IsOnline ? "Online" : "Offline";
        public bool IsMoving => Speed.HasValue && Speed > 5; // Moving if speed > 5 km/h
    }
}