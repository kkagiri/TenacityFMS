using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS.Enums
{
    public enum ProbeStatus
    {
        [Description("OK")]
        PROBE_OK_STATUS = 0,
        [Description("Error")]
        PROBE_ERROR_STATUS = 1,
        [Description("Offline")]
        PROBE_OFFLINE_STATUS = 2,
        [Description("")]
        NONE = 4
    }
}
