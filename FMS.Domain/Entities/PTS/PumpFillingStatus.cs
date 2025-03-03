using FMS.Domain.Entities.PTS.Enums;

namespace FMS.Domain.Entities.PTS;

public class PumpFillingStatus : PumpStatusBase
{
    public override PumpStatus Status => PumpStatus.PUMP_FILLING_STATUS;
    public int Nozzle { get; set; }
    public double Volume { get; set; }
    public double TCVolume { get; set; }
    public double Price { get; set; }
    public double Amount { get; set; }
    public int Transaction { get; set; }
}