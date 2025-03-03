using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class DateTimeSettings
    {
        public DateTime DateTime { get; set; }
        public bool AutoSynchronize { get; set; }
        public int UTCOffset { get; set; }
    }
}