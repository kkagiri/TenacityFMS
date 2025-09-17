namespace FMS.IoT.Contracts.ProcessingEngine.Models;

/// <summary>
/// Result of message processing
/// </summary>
public class ProcessingResult {
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DateTime ProcessedAt { get; set; }
    public TimeSpan ProcessingDuration { get; set; }
    public List<object> Results { get; set; } = new ();
    public Dictionary<string, object> Metadata { get; set; } = new ();
    public string? ProcessorId { get; set; }
    public List<string> ValidationErrors { get; set; } = new ();
    public Dictionary<string, object> ? ProcessedData { get; set; }
    public Exception? Exception { get; set; }
}