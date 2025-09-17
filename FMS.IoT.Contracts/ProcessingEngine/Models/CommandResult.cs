namespace FMS.IoT.Contracts.ProcessingEngine.Models;

/// <summary>
/// Result of command execution
/// </summary>
public class CommandResult {
    public bool Success { get; set; }
    public string? Error { get; set; }
    public object? Result { get; set; }
    public DateTime ExecutedAt { get; set; }
    public TimeSpan ExecutionDuration { get; set; }
    public string? DeviceResponse { get; set; }
    public string CommandId { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public CommandStatus Status { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new ();
    public string? ExecutedBy { get; set; }
}