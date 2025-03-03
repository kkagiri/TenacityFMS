using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.ModelsDTOs.PTS
{
    public class PumpTagResponseDTO
    {
        public int Pump { get; set; }
        public int Nozzle { get; set; }
        public string Tag { get; set; }
        public string User { get; set; }
    }
}
