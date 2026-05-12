using FMS.Domain.Entities.PTS.Enums;
using FMS.Domain.Entities.Util;

namespace FMS.Domain.Entities.PTS
{
    public class PumpStatusBase
    {
        public int? Pump { get; set; }
        public string? User { get; set; }
        public virtual PumpStatus Status { get; set; }
        public string? StatusDescription => EnumerationHelper.GetEnumDescription(Status);
    }
}