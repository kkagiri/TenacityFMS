using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Domain.Entities.PTS.PTSStatus;

namespace FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus
{
    public class ProbeStatus : DeviceStatus
    {

        public new ProbeOnlineStatus? OnlineStatus { get; set; }
        public new OfflineStatus? OfflineStatus { get; set; }
    }



}
