using FMS.PTS.DataStruct;

namespace FMS.PTS.DataStruct
{
    public class PumpDisplayData : PumpStatusBase
    {
        public int LastNozzle { get; set; }
        public double Volume { get; set; }
       public double Amount { get; set; }

        public double LastTransaction { get; set; }
        
        public override PumpStatus Status
        {
            get
            {
                base.Status = PumpStatus.NONE;
                return base.Status;
            }
        }
       
    }
}