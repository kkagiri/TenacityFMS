using System.Collections.Generic;

namespace FMS.Infrastructure.VehicleTracking.Models
{
    /// <summary>
    /// Defines the capabilities supported by a vehicle tracking provider
    /// </summary>
    public class ProviderCapabilities
    {
        /// <summary>
        /// Provider supports real-time vehicle location tracking
        /// </summary>
        public bool SupportsRealTimeLocation { get; set; }

        /// <summary>
        /// Provider supports historical location data retrieval
        /// </summary>
        public bool SupportsHistoricalData { get; set; }

        /// <summary>
        /// Provider supports geofencing functionality
        /// </summary>
        public bool SupportsGeofencing { get; set; }

        /// <summary>
        /// Provider supports real-time event subscriptions (webhooks, websockets)
        /// </summary>
        public bool SupportsEvents { get; set; }

        /// <summary>
        /// Provider supports odometer/mileage tracking
        /// </summary>
        public bool SupportsOdometer { get; set; }

        /// <summary>
        /// Provider supports vehicle diagnostics data
        /// </summary>
        public bool SupportsDiagnostics { get; set; }

        /// <summary>
        /// Provider supports driver behavior monitoring
        /// </summary>
        public bool SupportsDriverBehavior { get; set; }

        /// <summary>
        /// Provider supports fuel level monitoring
        /// </summary>
        public bool SupportsFuelLevel { get; set; }

        /// <summary>
        /// Provider supports custom field reporting
        /// </summary>
        public bool SupportsCustomFields { get; set; }

        /// <summary>
        /// Priority level for this provider (1 = highest, lower numbers = higher priority)
        /// Used for failover scenarios
        /// </summary>
        public int Priority { get; set; } = 999;

        /// <summary>
        /// Maximum number of concurrent requests supported
        /// </summary>
        public int MaxConcurrentRequests { get; set; } = 10;

        /// <summary>
        /// Rate limit (requests per minute)
        /// </summary>
        public int RateLimitPerMinute { get; set; } = 60;

        /// <summary>
        /// Average response time in milliseconds
        /// </summary>
        public int AverageResponseTimeMs { get; set; } = 1000;

        /// <summary>
        /// Additional provider-specific capabilities as key-value pairs
        /// </summary>
        public Dictionary<string, object> ExtendedCapabilities { get; set; } = new();
    }
}
