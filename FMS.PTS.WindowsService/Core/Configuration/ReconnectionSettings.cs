namespace FMS.PTS.WindowsService.Core.Configuration
{
    public class ReconnectionSettings
    {
        public int MaxAttempts { get; set; } = 3;
        public int InitialDelaySeconds { get; set; } = 1;
        public int MaxDelaySeconds { get; set; } = 30;
        public int HealthCheckIntervalSeconds { get; set; } = 30;
        public int HealthCheckTimeoutSeconds { get; set; } = 5;

    }
}