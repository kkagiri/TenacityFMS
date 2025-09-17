namespace FMS.IoT.Contracts.Gateway.Models;

/// <summary>
/// Represents a device connection in the gateway
/// </summary>
public class DeviceConnection {
    public string DeviceId { get; set; } = string.Empty;
    public string Protocol { get; set; } = string.Empty;
    public DateTime ConnectedAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public ConnectionStatus Status { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new ();
    public DateTime LastActivity { get; set; }
    public string? UserAgent { get; set; }
    public int ReconnectAttempts { get; set; }
}