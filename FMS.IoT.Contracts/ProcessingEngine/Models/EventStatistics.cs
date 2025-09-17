namespace FMS.IoT.Contracts.ProcessingEngine.Models;

/// <summary>
/// Event processing statistics
/// </summary>
public class EventStatistics {
    public long TotalEventsPublished { get; set; }
    public long TotalEventsProcessed { get; set; }
    public int ActiveSubscriptions { get; set; }
    public Dictionary<string, long> EventsByType { get; set; } = new ();
    public DateTime LastUpdated { get; set; }
    public double EventProcessingSuccessRate { get; set; }
    public double AverageEventProcessingTimeMs { get; set; }
    public int FailedEvents { get; set; }
    public Dictionary<string, int> SubscriptionsByType { get; set; } = new ();
}