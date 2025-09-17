namespace FMS.IoT.Contracts.Gateway.Models;

/// <summary>
/// Protocol-specific configuration
/// </summary>
public class ProtocolConfiguration {
    public string ProtocolName { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public Dictionary<string, object> Settings { get; set; } = new ();
    public bool IsEnabled { get; set; } = true;
    public int MaxConnections { get; set; } = 1000;
    public TimeSpan ConnectionTimeout { get; set; } = TimeSpan.FromSeconds (30);
    public TimeSpan MessageTimeout { get; set; } = TimeSpan.FromSeconds (10);
    public bool RequiresAuthentication { get; set; }
}