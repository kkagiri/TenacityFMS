namespace FMS.IoT.Contracts.ProcessingEngine.Models;

/// <summary>
/// Represents a command to be sent to a device
/// </summary>
public class DeviceCommand {
    public string CommandId { get; set; } = Guid.NewGuid ().ToString ();
    public string DeviceId { get; set; } = string.Empty;
    public string CommandType { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new ();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public int Priority { get; set; } = 0;
    public string? CorrelationId { get; set; }
    public CommandStatus Status { get; set; } = CommandStatus.Pending;
    public string? CreatedBy { get; set; }
    public int RetryCount { get; set; } = 0;
    public int MaxRetries { get; set; } = 3;
}

/// <summary>
/// Command execution status
/// </summary>
public enum CommandStatus {
    Pending,
    Queued,
    Executing,
    Completed,
    Failed,
    Cancelled,
    Expired
}