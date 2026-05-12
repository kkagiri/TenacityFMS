using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities.PTS
{
    public class PumpNozzles
    {
        public int PumpId { get; set; }
        public List<int>? FuelGradeIds { get; set; }
        public bool TankIdsEnabled { get; set; }
        public List<int>? TankIds { get; set; }
    }
}
