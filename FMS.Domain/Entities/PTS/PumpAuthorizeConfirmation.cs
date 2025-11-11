using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PumpAuthorizeConfirmation
    {
        public int Pump { get; set; }
        public int Transaction { get; set; }
        public string? ConnectionType { get; set; }
        public int? NozzleId { get; set; }
    }
}
