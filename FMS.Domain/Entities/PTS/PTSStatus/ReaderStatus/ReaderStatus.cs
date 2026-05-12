
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Domain.Entities.PTS.PTSStatus;

namespace FMS.Domain.Entities.PTS.PTSStatus.ReaderStatus
{
    public class ReaderStatus : DeviceStatus
    {
        public new OnlineStatus? OnlineStatus { get; set; }
        public new OfflineStatus? OfflineStatus { get; set; }
    }
}
