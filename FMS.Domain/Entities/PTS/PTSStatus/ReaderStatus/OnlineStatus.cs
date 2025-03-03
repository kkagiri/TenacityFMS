using FMS.Domain.Entities.PTS.PTSStatus;

namespace FMS.Domain.Entities.PTS.PTSStatus.ReaderStatus
{


    public class OnlineStatus : BaseStatus
    {
        public List<string>? Tags { get; set; }
        public List<int?>? Errors { get; set; }
    }
}