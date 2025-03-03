namespace FMS.Domain.Entities.PTS.PTSStatus.PumpStatus
{
    /// <summary>
    /// Class representing the status of the pumps.
    /// </summary>
    public class PumpStatus
    {
        public IdleStatus? IdleStatus { get; set; }
        public FillingStatus? FillingStatus { get; set; }
        public EndOfTransactionStatus? EndOfTransactionStatus { get; set; }
        public PumpOfflineStatus? OfflineStatus { get; set; }
    }
}