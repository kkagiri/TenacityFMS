using System;

namespace FMS.Application.Dtos
{
    /// <summary>
    /// DTO for comparing GPS odometer readings with database records
    /// Used in bulk odometer reconciliation feature
    /// </summary>
    public class VehicleOdometerComparisonDTO
    {
        public int VehicleId { get; set; }
        public string VehicleCode { get; set; }
        public string NumberPlate { get; set; }

        // GPS Data
        public int? GpsAccumulatorId { get; set; }
        public double? GpsOdometer { get; set; }
        public string GpsUnit { get; set; }
        public DateTime? GpsTimestamp { get; set; }
        public string GpsAccumulatorType { get; set; }

        // Database Data
        public double? DatabaseOdometer { get; set; }
        public DateTime? DatabaseLastUpdated { get; set; }
        public string DatabaseUpdateSource { get; set; }

        // Comparison
        public double? Discrepancy { get; set; }
        public double? DiscrepancyPercentage { get; set; }
        public bool HasSignificantDiscrepancy { get; set; }

        // Mapping Status
        public bool HasGpsMapping { get; set; }
        public string ExternalDeviceId { get; set; }
        public string ProviderName { get; set; }
    }
}
