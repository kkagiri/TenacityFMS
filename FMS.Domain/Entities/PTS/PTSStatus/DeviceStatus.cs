using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS.PTSStatus
{
    /// <summary>
    /// Generic class representing a device with Online and Offline statuses.
    /// This reduces duplication between ProbeStatus and ReaderStatus.
    /// </summary>
    public abstract class DeviceStatus
    {
        public OnlineStatus? OnlineStatus { get; set; }
        public OfflineStatus? OfflineStatus { get; set; }
    }


    public class OnlineStatus : BaseStatus { }

    public class OfflineStatus : BaseStatus { }


}
