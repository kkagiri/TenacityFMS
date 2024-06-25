using System;

namespace FMS.Application.ModelsDTOs.FMS.FuelRefil
{

    public class FuelRefilDTO
    {
    public int Id { get; set; }
     public int VehicleId { get; set; }

    public decimal? ManualFuelrefilAmount { get; set; }

    public DateTime Date { get; set; }

    public int? PreviousMeterReading { get; set; }

    public int? CurrentMeterReading { get; set; }

    public int SiteId { get; set; }

    public string? Comment { get; set; }

    public string FuelBy { get; set; } = null!;

    public int? PumpTranscationId { get; set; }

    public int? DriverId { get; set; }

        public int? TankId { get; set; }
    }
}