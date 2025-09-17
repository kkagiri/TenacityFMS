using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Features.ATG {
    public class PumpTransactionDto {
        public string PtsId { get; set; }
        public int PacketId { get; set; }
        public DateTime DateTimeStart { get; set; }
        public DateTime DateTime { get; set; }
        public int Pump { get; set; }
        public int Nozzle { get; set; }
        public int? FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }
        public int Transaction { get; set; }
        public decimal Volume { get; set; }
        public decimal? TCVolume { get; set; }
        public decimal? Price { get; set; }
        public decimal Amount { get; set; }
        public decimal? TotalVolume { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Tag { get; set; }
        public int? UserId { get; set; }
        public string? ConfigurationId { get; set; }

        // Add these fields to match PumpAuthorizeCommand
        public int? TankId { get; set; }
        public string? TankName { get; set; }
        public int? VehicleId { get; set; }
        public string? VehicleName { get; set; } // This will be HyoungNo from Vehicle entity
        public string? VehicleNumberPlate { get; set; }

        // Processing flag
        public bool HasBeenProcessed { get; set; } = false; //Cursor
    }
}