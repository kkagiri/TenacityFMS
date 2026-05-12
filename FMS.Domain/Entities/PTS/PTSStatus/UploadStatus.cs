using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS.PTSStatus {
    /// <summary>
    /// Represents the overall uploaded status of the system.
    /// Reduced duplication by leveraging generic device statuses and base classes where possible.
    /// /// UploadStatus request is used for periodical sending by the PTS-2 controller to the remote server for check
    /// of communication state and realtime online monitoring of the controller, which gives several solutions:
    /// 1. It indicates to the PTS-2 controller that the remote server is alive
    /// 2. It indicates to the remote server and PTS-2 controller is alive
    /// 3. It provides the remote server with online realtime data about the PTS-2 controller and forecourt
    /// equipment statuses (pumps, probes, price boards, readers, GPS receiver, others), so that the
    /// remote server can have online information on everything going with the PTS-2 controller
    /// </summary
    public class UploadStatus {
        public string? ConfigurationId { get; set; }
        public DateTime DateTime { get; set; }
        public DateTime FirmwareDateTime { get; set; }
        public int StartupSeconds { get; set; }
        public int BatteryVoltage { get; set; }
        public int CpuTemperature { get; set; }
        public bool PtsPowerDownDetected { get; set; }
        public bool SdMounted { get; set; }
        public PumpStatus.PumpStatus Pumps { get; set; } = new ();
        public ProbeStatus.ProbeStatus Probes { get; set; } = new ();
        public ReaderStatus.ReaderStatus Readers { get; set; } = new ();
        public List<FuelGradeStatus.FuelGradeStatus> FuelGrades { get; set; } = new ();

    }
}