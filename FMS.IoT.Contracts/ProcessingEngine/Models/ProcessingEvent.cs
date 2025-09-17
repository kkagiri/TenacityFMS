namespace FMS.IoT.Contracts.ProcessingEngine.Models;

/// <summary>
/// Represents an event to be published after processing
/// </summary>
public class ProcessingEvent {
    public string EventType { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object> Data { get; set; } = new ();
    public string? TargetTopic { get; set; }
    public string EventId { get; set; } = Guid.NewGuid ().ToString ();
    public string? CorrelationId { get; set; }
    public int Priority { get; set; } = 0;
    public Dictionary<string, object> Metadata { get; set; } = new ();
    public string? Source { get; set; }
}