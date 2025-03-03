using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS.PTSStatus
{
    /// <summary>
    /// Represents the overall uploaded status of the system.
    /// Reduced duplication by leveraging generic device statuses and base classes where possible.
    /// </summary
    public class UploadStatus
    {
        public string? ConfigurationId { get; set; }
        public DateTime DateTime { get; set; }
        public DateTime FirmwareDateTime { get; set; }
        public int StartupSeconds { get; set; }
        public int BatteryVoltage { get; set; }
        public int CpuTemperature { get; set; }
        public bool PtsPowerDownDetected { get; set; }
        public bool SdMounted { get; set; }
        public PumpStatus.PumpStatus Pumps { get; set; } = new();
        public ProbeStatus.ProbeStatus Probes { get; set; } = new();
        public ReaderStatus.ReaderStatus Readers { get; set; } = new();
        public List<FuelGradeStatus.FuelGradeStatus> FuelGrades { get; set; } = new();

    }
}
