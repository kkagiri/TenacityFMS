using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    /// <summary>
    /// Class describing last in-tank delivery
    /// </summary>
    public class LastInTankDelivery
    {
        public DateTime DateTime { get; set; }
        public double ProductHeight { get; set; }
        public double WaterHeight { get; set; }
        public double Temperature { get; set; }
        public double ProductVolume { get; set; }
        public double ProductTCVolume { get; set; }
        public double ProductDensity { get; set; }
        public double ProductMass { get; set; }
        public double PumpsDispensedVolume { get; set; }
    }
}
