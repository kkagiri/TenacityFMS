using FMS.Application.Communication.Tracker.Common;
using System;
using System.Linq;

namespace FMS.Application.Communication.Tracker
{
    public class DeviceConnectionDetails
    {
        public string DeviceId { get; set; }
        public ConnectionStatus WebSocketStatus { get; set; }

        public DateTime? LastWebSocketMessage { get; set; }

        public DateTime? LastHttpPoll { get; set; }

        public DateTime? LastStatusUpdate { get; set; }

        public ConnectionMode CurrentConnectionMode { get; set; }
        // Helper method to determine if the device is currently connected
        public bool isConnected => WebSocketStatus == ConnectionStatus.Connected || WebSocketStatus == ConnectionStatus.Active ||
                                (LastHttpPoll.HasValue && DateTime.UtcNow - LastHttpPoll.Value < TimeSpan.FromMinutes(5));

        // Helper method to get the last activity timestamp
        public DateTime? LastActivity => new[]
    {
          LastWebSocketMessage,
           LastHttpPoll,
        LastStatusUpdate
    }.Where(dt => dt.HasValue).DefaultIfEmpty().Max();

        public string GetConnectionModeDescription()
        {
            return CurrentConnectionMode switch
            {
                ConnectionMode.WebSocket =>
                    "Connected via WebSocket for real-time communication",

                ConnectionMode.HTTPPolling =>
                    "Using HTTP polling for periodic updates",

                ConnectionMode.HTTPDirect =>
                    "Using direct HTTP communication",

                ConnectionMode.Mixed =>
                    "Using multiple communication methods",

                ConnectionMode.Disconnected =>
                    "No active connection detected",

                _ => "Unknown connection mode"
            };
        }
        public static ConnectionMode DetermineConnectionMode(WebSocketConnectionInfo? wsInfo, HttpConnectionInfo? httpInfo)
        {
            // First, let's establish time thresholds for recent activity
            var recentActivityThreshold = TimeSpan.FromMinutes(5);
            var now = DateTime.UtcNow;

            // Check if we have an active WebSocket connection
            bool hasActiveWebSocket = wsInfo != null &&
                (wsInfo.Status == ConnectionStatus.Active ||
                 wsInfo.Status == ConnectionStatus.Connected);

            // Check if we have recent HTTP activity
            bool hasRecentHttpActivity = httpInfo != null &&
                (now - httpInfo.LastPollTime < recentActivityThreshold ||
                 now - httpInfo.LastStatusUpdate < recentActivityThreshold);

            // Now we can determine the mode based on activity patterns
            if (hasActiveWebSocket && hasRecentHttpActivity)
            {
                // Device is using both communication methods
                return ConnectionMode.Mixed;
            }
            else if (hasActiveWebSocket)
            {
                // Device is primarily using WebSocket
                return ConnectionMode.WebSocket;
            }
            else if (hasRecentHttpActivity)
            {
                // Determine if it's direct HTTP or polling based on pattern
                return httpInfo.SuccessfulPolls > 0
                    ? ConnectionMode.HTTPPolling
                    : ConnectionMode.HTTPDirect;
            }

            // No recent activity in any mode
            return ConnectionMode.Disconnected;
        }

        public string GetConnectionSummary()
        {
            var timeSinceLastActivity = LastActivity.HasValue
                ? DateTime.UtcNow - LastActivity.Value
                : TimeSpan.MaxValue;

            return $"Device {DeviceId} is {(isConnected ? "connected" : "disconnected")} " +
                   $"using {CurrentConnectionMode} mode. " +
                   $"Last activity was {(LastActivity.HasValue ? $"{timeSinceLastActivity.TotalMinutes:F1} minutes ago" : "never")}.";
        }
    }

}