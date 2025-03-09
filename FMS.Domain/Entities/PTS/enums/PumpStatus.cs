using System.ComponentModel;

namespace FMS.Domain.Entities.PTS.Enums
{
    public enum PumpStatus
    {
        [Description("OFFLINE")]
        PUMP_OFFLINE_STATUS = 0,
        [Description("IDLE")]
        PUMP_IDLE_STATUS = 1,
        [Description("FILLING")]
        PUMP_FILLING_STATUS = 2,
        [Description("NOZZLE")]
        NOZZLE = 3,
        [Description("")]
        NONE = 4
    }
}