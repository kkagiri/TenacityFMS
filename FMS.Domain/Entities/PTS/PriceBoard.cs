using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    /// <summary>
    /// Price board data
    /// </summary>
    public class PriceBoard
    {
        public int Id { get; set; }
        public string? Port { get; set; }
        public int Address { get; set; }
        public List<int>? FuelGradeIds { get; set; }
    }
}
