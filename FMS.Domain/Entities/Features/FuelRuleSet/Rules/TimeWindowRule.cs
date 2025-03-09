namespace FMS.Domain.Entities.Features.FuelRule.Rules
{
    public class TimeWindowRule : FuelingRule
    {

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }
        public override bool Evaluate(FuelingContext context)
        {
            var now = DateTime.UtcNow.TimeOfDay;

            return now >= StartTime && now <= EndTime;
        }
    }
}