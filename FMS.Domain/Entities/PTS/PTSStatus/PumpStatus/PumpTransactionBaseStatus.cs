using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Domain.Entities.PTS.PTSStatus;

namespace FMS.Domain.Entities.PTS.PTSStatus.PumpStatus
{
    public abstract class PumpTransactionBaseStatus : BaseStatus
    {
        public List<int>? Nozzles { get; set; }
        public List<int>? FuelGradeIds { get; set; }
        public List<string>? FuelGradeNames { get; set; }
        public List<int>? Transactions { get; set; }
        public List<decimal>? Volumes { get; set; }
        public List<decimal>? Amounts { get; set; }
        public List<decimal>? Prices { get; set; }
        public List<string>? Tags { get; set; }
    }
}
