/**
 * File: ManualDispenseConsumptionDTO.cs
 * Purpose: DTOs for manual-refill vehicle consumption reporting results.
 * Dependencies: None
 * Last Modified: 2026-03-11
 *
 * Key Types:
 * - ManualDispenseConsumptionDTO: Aggregated consumption metrics per vehicle
 * - RefillDetailDTO: Optional refill-level detail rows
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using NLog;

namespace FMS.Application.Features.FMS.Consumption
{
    public class ManualDispenseConsumptionDTO
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string? VehicleCode { get; set; }
        public string? VehicleType { get; set; }
        public int WorkingSiteId { get; set; }
        public string? WorkingSiteName { get; set; }
        public decimal TotalFuelAmount { get; set; }
        public decimal Consumption { get; set; }
        public decimal ExpectedAverage { get; set; }
        public decimal DistanceOrEngineHours { get; set; }
        public bool IsKmL { get; set; }
        public List<RefillDetailDTO> Refills { get; set; } = new(); // Add this line
        public int RefillCount { get; set; }

        public string? VehicleInfo { get; set; }
        public string? DriverName { get; set; }
        public string? Passenger { get; set; }
    }

    public class RefillDetailDTO
    {
        public DateTime? Date { get; set; }
        public decimal? ManualFuelrefilAmount { get; set; }
        public int? PreviousMeterReading { get; set; }
        public int? CurrentMeterReading { get; set; }
        public int DistanceOrEngineHours { get; set; }
        public decimal Consumption { get; set; }
        public string? Site { get; set; }
    }
}