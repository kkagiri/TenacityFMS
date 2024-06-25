namespace FMS.PTS.DataStruct;

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