using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PriceBoardsConfiguration
    {
        public List<PriceBoardPort>? PriceBoardPorts { get; set; }
        public List<PriceBoard>? PriceBoards { get; set; }
    }
}
