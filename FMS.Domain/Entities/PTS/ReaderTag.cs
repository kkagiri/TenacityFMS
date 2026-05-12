using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class ReaderTag
    {
        public int Reader { get; set; }
        public string? Tag { get; set; }
        public bool Online { get; set; }
        public bool Error { get; set; }
    }
}
