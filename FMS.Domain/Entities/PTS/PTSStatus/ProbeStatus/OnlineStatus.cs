using FMS.Domain.Entities.PTS.PTSStatus;

namespace FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus
{
    /// <summary>
    /// Class representing the online status for probes.
    /// </summary>
    public class ProbeOnlineStatus : OnlineStatus
    {
        public List<int?>? CriticalHighProductAlarms { get; set; }
        public List<int?>? HighProductAlarms { get; set; }
        public List<int?>? LowProductAlarms { get; set; }
        public List<int?>? CriticalLowProductAlarms { get; set; }
        public List<int?>? HighWaterAlarms { get; set; }
        public List<int?>? TankLeakageAlarms { get; set; }
        public List<int?>? Errors { get; set; }
        public List<ProbeMeasurement>? Measurements { get; set; }
    }
}