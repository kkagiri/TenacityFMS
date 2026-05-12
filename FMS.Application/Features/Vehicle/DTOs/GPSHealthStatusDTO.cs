using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// GPS Provider Health Status DTO
    /// </summary>
    public class GPSHealthStatusDTO
    {
        /// <summary>
        /// Overall health status
        /// </summary>
        public bool IsHealthy { get; set; }

        /// <summary>
        /// Overall status text
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Provider name
        /// </summary>
        public string ProviderName { get; set; } = string.Empty;

        /// <summary>
        /// Status message
        /// </summary>
        public string StatusMessage { get; set; } = string.Empty;

        /// <summary>
        /// Message
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Last check timestamp
        /// </summary>
        public DateTime LastCheckTime { get; set; }

        /// <summary>
        /// Last checked timestamp
        /// </summary>
        public DateTime LastChecked { get; set; }

        /// <summary>
        /// Response time in milliseconds
        /// </summary>
        public long ResponseTimeMs { get; set; }

        /// <summary>
        /// Number of active connections
        /// </summary>
        public int ActiveConnections { get; set; }

        /// <summary>
        /// Error count in last hour
        /// </summary>
        public int ErrorCount { get; set; }

        /// <summary>
        /// Total number of vehicles
        /// </summary>
        public int TotalVehicles { get; set; }

        /// <summary>
        /// Number of online vehicles
        /// </summary>
        public int OnlineVehicles { get; set; }

        /// <summary>
        /// Total number of providers
        /// </summary>
        public int TotalProviders { get; set; }

        /// <summary>
        /// Number of healthy providers
        /// </summary>
        public int HealthyProviders { get; set; }

        /// <summary>
        /// Number of degraded providers
        /// </summary>
        public int DegradedProviders { get; set; }

        /// <summary>
        /// Number of unhealthy providers
        /// </summary>
        public int UnhealthyProviders { get; set; }

        /// <summary>
        /// Additional health metrics
        /// </summary>
        public Dictionary<string, object> AdditionalMetrics { get; set; } = new Dictionary<string, object>();
    }
}
