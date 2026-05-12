using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class ReadersConfiguration
    {
        public List<ReaderPort>? ReaderPorts { get; set; } = null;
        public List<Reader>? Readers { get; set; } = null;
    }
}
