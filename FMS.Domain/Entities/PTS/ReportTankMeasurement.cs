using FMS.Domain.Entities.PTS.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    public class ReportTankMeasurement
    {
        public DateTime DateTime { get; set; }


        public int Tank { get; set; }


        public ProbeStatus? Status { get; set; }

        public List<string>? Alarms { get; set; }


        public double ProductHeight { get; set; }


        public double WaterHeight { get; set; }


        public double Temperature { get; set; }

        public double ProductVolume { get; set; }


        public double ProductDensity { get; set; }

        public double ProductMass { get; set; }
    }
}
