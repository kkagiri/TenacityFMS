namespace FMS.IoT.Contracts.ProcessingEngine.Models;

/// <summary>
/// Processing statistics for monitoring
/// </summary>
public class ProcessingStatistics {
    public long TotalMessagesProcessed { get; set; }
    public long SuccessfulProcessing { get; set; }
    public long FailedProcessing { get; set; }
    public double AverageProcessingTimeMs { get; set; }
    public DateTime LastUpdated { get; set; }
    public Dictionary<string, long> ProcessingByMessageType { get; set; } = new ();
    public double ProcessingSuccessRate { get; set; }
    public TimeSpan Uptime { get; set; }
    public int CurrentLoad { get; set; }
    public Dictionary<string, object> CustomMetrics { get; set; } = new ();
}