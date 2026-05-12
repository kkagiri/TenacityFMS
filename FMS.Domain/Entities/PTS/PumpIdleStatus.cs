using FMS.Domain.Entities.PTS.Enums;
namespace FMS.Domain.Entities.PTS
{
    public class PumpIdleStatus : PumpStatusBase
    {
        public int? Transaction { get; set; }
        public int NozzleUp { get; set; }
        public int LastNozzle { get; set; }
        public int? FuelGradeId { get; set; }
        public int? LastFuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }
        public string? LastFuelGradeName { get; set; }
        public double LastVolume { get; set; }
        public double LastPrice { get; set; }
        public double LastAmount { get; set; }
        public int LastTransaction { get; set; }
        public double? LastTotalVolume { get; set; }
        public double? LastTotalAmount { get; set; }
        public DateTime? LastDateTimeStart { get; set; }
        public DateTime? LastDateTime { get; set; }
        public string? Request { get; set; }
        public string? Tag { get; set; }


        public override PumpStatus Status
        {
            get => NozzleUp > 0 ? PumpStatus.NOZZLE : PumpStatus.PUMP_IDLE_STATUS;
        }
    }
}