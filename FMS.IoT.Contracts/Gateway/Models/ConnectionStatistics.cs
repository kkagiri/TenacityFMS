namespace FMS.IoT.Contracts.Gateway.Models;

/// <summary>
/// Connection statistics for monitoring
/// </summary>
public class ConnectionStatistics {
    public int TotalConnections { get; set; }
    public int ActiveConnections { get; set; }
    public Dictionary<string, int> ConnectionsByProtocol { get; set; } = new ();
    public DateTime LastUpdated { get; set; }
    public TimeSpan AverageConnectionDuration { get; set; }
    public int FailedConnections { get; set; }
    public int ReconnectionsCount { get; set; }
    public double ConnectionSuccessRate { get; set; }
}