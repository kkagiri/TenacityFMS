
using FMS.Domain.Entities.PTS.Enums;

namespace FMS.Domain.Entities.PTS;

public class PumpTag : PumpStatusBase
{
    public int? Nozzle { get; set; }

    public string? Tag { get; set; }

    public override PumpStatus Status
    {
        get
        {
            base.Status = PumpStatus.NONE;
            return base.Status;
        }
    }

}