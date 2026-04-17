/**
 * File: GpsConsumptionDTO.cs
 * Purpose: DTO for GPS-tracked vehicle consumption reporting results (from vehicleconsumption table).
 * Dependencies: None
 * Last Modified: 2026-06-12
 *
 * Key Types:
 * - GpsConsumptionDTO: Aggregated GPS consumption metrics per vehicle
 */
namespace FMS.Application.Features.FMS.Consumption
{
    public class GpsConsumptionDTO
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string HyoungNo { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public int WorkingSiteId { get; set; }
        public string WorkingSiteName { get; set; } = string.Empty;
        public decimal TotalFuelAmount { get; set; }
        public decimal Consumption { get; set; }
        public decimal ExpectedAverage { get; set; }
        public decimal DistanceOrEngineHours { get; set; }
        public bool IsKmL { get; set; }
        public int RecordCount { get; set; }
        public string? VehicleInfo { get; set; }
        public decimal MaxSpeed { get; set; }
        public decimal AvgSpeed { get; set; }
        public decimal EngHours { get; set; }
        public decimal FuelLost { get; set; }
    }
}
