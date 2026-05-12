using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PumpsConfiguration
    {
        public List<Port>? Ports { get; set; }
        public List<Pump>? Pumps { get; set; }
    }
}
