using System;
using System.Collections.Generic;

namespace FMS.Infrastructure.VehicleTracking.Models
{
    /// <summary>
    /// Health status of a vehicle tracking provider
    /// </summary>
    public class ProviderHealthStatus
    {
        /// <summary>
        /// Provider name
        /// </summary>
        public string ProviderName { get; set; } = string.Empty;

        /// <summary>
        /// Health status
        /// </summary>
        public HealthStatus Status { get; set; }

        /// <summary>
        /// Time when health check was performed
        /// </summary>
        public DateTime CheckedAt { get; set; }

        /// <summary>
        /// Additional status message or error information
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Response time in milliseconds
        /// </summary>
        public int ResponseTimeMs { get; set; }

        /// <summary>
        /// Success rate percentage (0-100)
        /// </summary>
        public decimal? SuccessRate { get; set; }

        /// <summary>
        /// Number of errors in the last check period
        /// </summary>
        public int ErrorCount { get; set; }

        /// <summary>
        /// Last error message (if any)
        /// </summary>
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Additional metrics as JSON string
        /// </summary>
        public string? AdditionalMetrics { get; set; }

        /// <summary>
        /// Detailed health check results
        /// </summary>
        public Dictionary<string, object> Details { get; set; } = new();

        /// <summary>
        /// Whether the provider is currently available for use
        /// </summary>
        public bool IsAvailable => Status == HealthStatus.Healthy || Status == HealthStatus.Degraded;

        /// <summary>
        /// Provider uptime percentage (0-100)
        /// </summary>
        public decimal UptimePercentage { get; set; } = 100m;

        /// <summary>
        /// Last successful request timestamp
        /// </summary>
        public DateTime? LastSuccessfulRequest { get; set; }

        /// <summary>
        /// Last failed request timestamp
        /// </summary>
        public DateTime? LastFailedRequest { get; set; }
    }

    /// <summary>
    /// Health status enumeration
    /// </summary>
    public enum HealthStatus
    {
        /// <summary>
        /// Provider is fully operational
        /// </summary>
        Healthy = 0,

        /// <summary>
        /// Provider is operational but experiencing some issues
        /// </summary>
        Degraded = 1,

        /// <summary>
        /// Provider is not operational
        /// </summary>
        Unhealthy = 2,

        /// <summary>
        /// Provider status is unknown (not yet checked)
        /// </summary>
        Unknown = 3
    }
}
