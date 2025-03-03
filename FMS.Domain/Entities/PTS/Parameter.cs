using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class Parameter
    {
        public string? Device { get; set; }
        public int Number { get; set; }
        public int Address { get; set; }
        public string? Value { get; set; }
    }
}
