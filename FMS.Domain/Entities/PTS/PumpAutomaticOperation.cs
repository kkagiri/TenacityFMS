using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PumpAutomaticOperation
    {
        public int Pump { get; set; }
        public string? State { get; set; }
    }
}
