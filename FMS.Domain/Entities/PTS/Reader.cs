using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    /// <summary>
    /// Reader data
    /// </summary>
    public class Reader
    {
        public int Id { get; set; }
        public string? Port { get; set; }
        public int Address { get; set; }
        public int PumpId { get; set; }
        public bool AnyPump { get; set; }
    }
}
