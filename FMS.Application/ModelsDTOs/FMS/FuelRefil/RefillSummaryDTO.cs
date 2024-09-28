using System;
namespace FMS.Application.ModelsDTOs.FMS.FuelRefil;

public class RefillSummaryDTO
{
    public string VehicleName { get; set; }
    public string SiteName { get; set; }
    public int RefillCount { get; set; }
    public decimal TotalRefillAmount { get; set; }
    
     public string VehicleType { get; set; }

/// <summary>
/// Meter Cummulation is the total meter reading after the refill
/// </summary>
    public decimal DistanceOrEngineHours { get; set; }

}