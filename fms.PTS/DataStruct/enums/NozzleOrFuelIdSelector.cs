using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.DataStruct.enums
{
    /// <summary>
    /// Enum that specified the nozzle(s) to authorize using PumpAuthorize request
    /// </summary>
    public enum NozzleOrFuelIdSelector
    {
        NONE,
        NOZZLE,
        NOZZLES,
        FUELGRADEID,
        FUELGRADEIDS
    }
}
