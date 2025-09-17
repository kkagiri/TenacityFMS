using FMS.IoT.Contracts.Gateway.Models;

namespace FMS.IoT.Gateway.Configuration;

/// <summary>
/// Gateway configuration options
/// </summary>
public class GatewayOptions {
    public const string SectionName = "Gateway";

    public int MaxConnections { get; set; } = 1000;
    public TimeSpan ConnectionTimeout { get; set; } = TimeSpan.FromSeconds (30);
    public TimeSpan HealthCheckInterval { get; set; } = TimeSpan.FromMinutes (1);
    public TimeSpan IdleConnectionThreshold { get; set; } = TimeSpan.FromMinutes (30);
    public bool EnableHealthChecks { get; set; } = true;
    public bool EnableMetrics { get; set; } = true;
    public List<ProtocolOptions> SupportedProtocols { get; set; } = new ();
    public Dictionary<string, string> CustomSettings { get; set; } = new ();
}

/// <summary>
/// Protocol-specific configuration options
/// </summary>
public class ProtocolOptions {
    public string Name { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public int Port { get; set; }
    public string? BindAddress { get; set; }
    public Dictionary<string, object> Settings { get; set; } = new ();
}