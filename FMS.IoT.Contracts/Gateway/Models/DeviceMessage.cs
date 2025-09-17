namespace FMS.IoT.Contracts.Gateway.Models;

/// <summary>
/// Represents a device message flowing through the gateway
/// </summary>
public class DeviceMessage {
    public string MessageId { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public string Protocol { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public byte[] RawData { get; set; } = Array.Empty<byte> ();
    public object? ParsedData { get; set; }
    public Dictionary<string, object> Headers { get; set; } = new ();
    public string MessageType { get; set; } = string.Empty;
    public int Priority { get; set; } = 0;
    public string? CorrelationId { get; set; }
    public TimeSpan? Expiry { get; set; }
}