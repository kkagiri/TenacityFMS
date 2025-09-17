namespace FMS.IoT.Contracts.Gateway.Models;

/// <summary>
/// Gateway status and health information
/// </summary>
public class GatewayStatus {
    public bool IsRunning { get; set; }
    public DateTime StartedAt { get; set; }
    public TimeSpan Uptime { get; set; }
    public int ActiveConnections { get; set; }
    public int TotalMessagesProcessed { get; set; }
    public Dictionary<string, object> HealthChecks { get; set; } = new ();
    public string Version { get; set; } = string.Empty;
    public GatewayHealth Health { get; set; }
}

/// <summary>
/// Gateway health status
/// </summary>
public enum GatewayHealth {
    Healthy,
    Degraded,
    Unhealthy,
    Critical
}