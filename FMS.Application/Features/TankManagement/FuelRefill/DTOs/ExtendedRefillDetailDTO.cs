using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Features.FMS.FuelRefil {
    public class ExtendedRefillDetailDTO {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string TenacyNO { get; set; } // Add this to store the vehicle number (VehicleCode)
        public decimal? ManualFuelrefillAmount { get; set; }
        public DateTime? Date { get; set; }
        public decimal? PreviousMeterReading { get; set; }
        public decimal? CurrentMeterReading { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public string Comment { get; set; }
        public string FuelBy { get; set; }
        public int? PumpTranscationId { get; set; }
        public int? DriverId { get; set; }
        public string DriverName { get; set; } // Add this to store the driver's name
        public int? TankId { get; set; }
        public string TankName { get; set; }
        public decimal DistanceOrEngineHours { get; set; } // New property
        public decimal Consumption { get; set; } // New property
        public bool IsKmL { get; set; } // New property to determine calculation method
    }
}