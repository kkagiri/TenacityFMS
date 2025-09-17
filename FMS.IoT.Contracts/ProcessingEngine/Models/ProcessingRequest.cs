namespace FMS.IoT.Contracts.ProcessingEngine.Models;

/// <summary>
/// Represents a device message to be processed
/// </summary>
public record ProcessingRequest (
    string DeviceId,
    DateTime Timestamp,
    Dictionary<string, object> Data,
    string MessageType,
    object RawMessage
) {
    public string RequestId { get; init; } = Guid.NewGuid ().ToString ();
    public string? CorrelationId { get; init; }
    public int Priority { get; init; } = 0;
    public Dictionary<string, object> Context { get; init; } = new ();
}