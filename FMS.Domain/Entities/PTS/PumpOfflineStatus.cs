using FMS.Domain.Entities.PTS.Enums;

namespace FMS.Domain.Entities.PTS
{
    public class PumpOfflineStatus : PumpStatusBase
    {
        public override PumpStatus Status
        {
            get
            {
                base.Status = PumpStatus.PUMP_OFFLINE_STATUS;
                return base.Status;
            }
        }
    }
}