using System;
using System.Collections.Generic;


namespace FMS.Application.Communication.Tracker.Common
{
    public class DeviceConnectionSummary
    {

        public List<WebSocketConnectionInfo>? WebSocketConnections { get; set; }
        public List<HttpConnectionInfo>? HttpConnections { get; set; }
        public int TotalConnectedDevices { get; set; }
        public int WebSocketPercentages { get; set; }
    }

    public enum ConnectionStatus
    {
        Connected,
        Active,
        Idle,
        Disconnected
    }

    public enum ConnectionMode
    {
        WebSocket,      // Device is actively using WebSocket connection
        HTTPPolling,      // Device is regularly polling via HTTP
        HTTPDirect,       // Device is using direct HTTP communication
        Disconnected,     // Device has no recent activity in any mode
        Mixed          // Device is using multiple communication methods
    }

    public class HttpConnectionInfo
    {
        public string DeviceId { get; set; }
        public DateTime LastPollTime { get; set; }
        public DateTime LastStatusUpdate { get; set; }
        public string LastKnownIp { get; set; }
        public int SuccessfulPolls { get; set; }

        public HttpConnectionInfo() { } // For deserialization
    }

    public class WebSocketConnectionInfo
    {
        public string DeviceId { get; set; }
        public DateTime ConnectedAt { get; set; }
        public DateTime LastMessageAt { get; set; }
        public string IpAddress { get; set; }
        public ConnectionStatus Status { get; set; }

        public WebSocketConnectionInfo() { } // For deserialization
    }
}
