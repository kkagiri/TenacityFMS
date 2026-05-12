using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Domain.Entities.PTS.PTSStatus;

namespace FMS.Domain.Entities.PTS.PTSStatus.PumpStatus
{
    public class PumpOfflineStatus : BaseStatus
    {
        public List<string>? Users { get; set; }
    }
}
