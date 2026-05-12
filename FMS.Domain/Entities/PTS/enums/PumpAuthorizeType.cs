using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS.Enums
{
    public enum PumpAuthorizeType
    {
        [Description("Volume")]
        VOLUME = 0,
        [Description("Amount")]
        AMOUNT = 1,
        [Description("FullTank")]
        FULLTANK = 2
    }
}
