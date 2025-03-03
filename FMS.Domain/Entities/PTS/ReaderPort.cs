using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class ReaderPort
    {
        public string? Id { get; set; }
        public int Protocol { get; set; }
        public int BaudRate { get; set; }
    }
}
