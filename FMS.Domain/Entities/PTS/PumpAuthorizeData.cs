using FMS.Domain.Entities.PTS.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PumpAuthorizeData
    {
        public int Pump { get; set; }
        public NozzleOrFuelIdSelector NozzleOrFuelIdSelector { get; set; }
        public int Nozzle { get; set; }
        public List<int>? Nozzles { get; set; }
        public int FuelGradeId { get; set; }

        public decimal Price { get; set; }
        public bool PriceEnabled { get; set; }
        public List<int>? FuelGradeIds { get; set; }
        public PumpAuthorizeType Type { get; set; }
        public double Dose { get; set; }
        public bool AutoCloseTransaction { get; set; }
        public bool TransactionEnabled { get; set; }
        public int Transaction { get; set; }
        public string? Tag { get; set; }
    }
}
