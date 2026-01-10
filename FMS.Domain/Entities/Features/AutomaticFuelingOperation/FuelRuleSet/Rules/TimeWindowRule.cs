namespace FMS.Domain.Entities.Features.FuelRule.Rules
{
    public class TimeWindowRule : FuelingRule
    {

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }
        public override bool Evaluate(FuelingContext context)
        {
            // Use CurrentTime from context which should already be in local time
            // Time window rules are configured in local time
            var now = context.CurrentTime.TimeOfDay;

            return now >= StartTime && now <= EndTime;
        }
    }
}