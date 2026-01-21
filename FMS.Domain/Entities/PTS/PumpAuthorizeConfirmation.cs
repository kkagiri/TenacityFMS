using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class PumpAuthorizeConfirmation
    {
        public int Pump { get; set; }
        public int Transaction { get; set; }

        /// <summary>
        /// The nozzle that was selected by the PTS device.
        /// This may be set by the device when authorizing by FuelGradeId instead of explicit Nozzle.
        /// </summary>
        public int? Nozzle { get; set; }

        /// <summary>
        /// The fuel grade ID selected for this authorization.
        /// </summary>
        public int? FuelGradeId { get; set; }
    }
}
