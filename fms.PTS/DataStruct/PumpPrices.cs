namespace FMS.PTS.DataStruct
{
    public class PumpPrices : PumpStatusBase
    {
       public List<double>? Prices { get; set; }

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