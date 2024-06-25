namespace FMS.PTS.DataStruct
{
    public class PumpEndOfTransactionStatus : PumpStatusBase
    {
        public int Nozzle { get; set; }
        public double Volume { get; set; }
        public double TCVolume { get; set; }
        public double Price { get; set; }
        public double Amount { get; set; }
        public int Transaction { get; set; }
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