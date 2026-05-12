using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PtsNetworkSettings
    {
        public IPAddress? IpAddress { get; set; }
        public IPAddress? NetMask { get; set; }
        public IPAddress? Gateway { get; set; }
        public short HttpPort { get; set; }
        public short HttpsPort { get; set; }
        public IPAddress? DNS1 { get; set; }
        public IPAddress? DNS2 { get; set; }
    }
}
