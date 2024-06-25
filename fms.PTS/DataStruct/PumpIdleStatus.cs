namespace FMS.PTS.DataStruct
{
    public class PumpIdleStatus : PumpStatusBase
    {
        public string Id { get; set; }
        public int NozzleUp { get; set; }

        public int LastNozzle { get; set; }
         public double LastVolume { get; set; }
        public double LastPrice { get; set; }    

        public double LastAmount { get; set; }

        public int LastTransaction { get; set; }
        public string Request { get; set; }

          public override PumpStatus Status
        {
            get
            {
                if (NozzleUp > 0)
                {
                    base.Status = PumpStatus.NOZZLE;
                }
                else
                {
                    base.Status = PumpStatus.PUMP_IDLE_STATUS;
                }
                return base.Status;
            }
        }

    }
}