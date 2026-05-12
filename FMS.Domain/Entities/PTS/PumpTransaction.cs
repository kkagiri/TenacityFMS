using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PumpTransaction
    {
        public int Pump { get; set; }
        public int Transaction { get; set; }
        public string? State { get; set; }
        public DateTime? DateTimeStart { get; set; }
        public DateTime? DateTime { get; set; }
        public int Nozzle { get; set; }
        public double Volume { get; set; }
        public double TCVolume { get; set; }
        public double Price { get; set; }
        public double Amount { get; set; }
        public double TotalVolume { get; set; }
        public double TotalAmount { get; set; }
        public string UserId { get; set; }
    }
}
