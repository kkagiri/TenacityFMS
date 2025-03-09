using FMS.Domain.Entities.PTS.Enums;
using FMS.Domain.Entities.Util;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    /// <summary>
    /// Probe measurements used for provision of monitoring over probes/tanks. 
    /// </summary>
    public class ProbeMeasurements
    {
        public int Probe { get; set; }
        public ProbeStatus? Status { get; set; }
        public string? StatusDescription => Status.HasValue ? EnumerationHelper.GetEnumDescription(Status.Value) : null;
        public List<string>? Alarms { get; set; }
        public double ProductHeight { get; set; }
        public double WaterHeight { get; set; }
        public double Temperature { get; set; }
        public double ProductVolume { get; set; }
        public double WaterVolume { get; set; }
        public double ProductUllage { get; set; }
        public double ProductTCVolume { get; set; }
        public double ProductDensity { get; set; }
        public double ProductMass { get; set; }
        public bool HighProductAlarm { get; set; }
        public bool LowProductAlarm { get; set; }
        public LastInTankDelivery? LastInTankDeliveryStart { get; set; }
        public LastInTankDelivery? LastInTankDeliveryEnd { get; set; }
        public LastInTankDelivery? LastInTankDelivery { get; set; }
    }
}
