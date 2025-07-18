using System;

namespace FMS.Application.Features.Vehicle.DTOs {
    public class VehicleOdometerDTO {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = null!;
        public string? NumberPlate { get; set; }
        public decimal CurrentOdometer { get; set; }
        public decimal TotalDistance { get; set; }
        public DateTime LastUpdated { get; set; }
        public string Unit { get; set; } = "km";
        public bool HasGPSInstalled { get; set; }
        public int? DeviceId { get; set; }

        // Additional maintenance-related properties
        public decimal? DailyDistance { get; set; }
        public decimal? WeeklyDistance { get; set; }
        public decimal? MonthlyDistance { get; set; }
    }
}