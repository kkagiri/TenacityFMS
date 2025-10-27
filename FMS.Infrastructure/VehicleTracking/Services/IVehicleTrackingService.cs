using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Models;

namespace FMS.Infrastructure.VehicleTracking.Services
{
    /// <summary>
    /// Unified vehicle tracking service that abstracts multiple providers
    /// with automatic failover and health-aware routing
    /// </summary>
    public interface IVehicleTrackingService
    {
        /// <summary>
        /// Get current location for a single vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Current vehicle location or null if not found</returns>
        Task<VehicleLocation?> GetVehicleLocationAsync(int vehicleId);

        /// <summary>
        /// Get current locations for multiple vehicles
        /// </summary>
        /// <param name="vehicleIds">List of vehicle IDs</param>
        /// <returns>Dictionary of vehicle ID to location</returns>
        Task<Dictionary<int, VehicleLocation>> GetVehicleLocationsAsync(IEnumerable<int> vehicleIds);

        /// <summary>
        /// Get location history for a vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="from">Start date/time</param>
        /// <param name="to">End date/time</param>
        /// <param name="maxPoints">Maximum number of location points to return</param>
        /// <returns>List of historical locations</returns>
        Task<List<VehicleLocation>> GetVehicleLocationHistoryAsync(
            int vehicleId,
            DateTime from,
            DateTime to,
            int maxPoints = 1000);

        /// <summary>
        /// Get the current provider being used for a vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Provider name or null if not determined</returns>
        Task<string?> GetProviderForVehicleAsync(int vehicleId);

        /// <summary>
        /// Get health status for all active providers
        /// </summary>
        /// <returns>Dictionary of provider name to health status</returns>
        Task<Dictionary<string, ProviderHealthStatus>> GetProvidersHealthAsync();

        /// <summary>
        /// Test connectivity to a specific provider
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>True if provider is accessible</returns>
        Task<bool> TestProviderConnectivityAsync(string providerName);

        /// <summary>
        /// Reload provider configurations and reinitialize connections
        /// </summary>
        Task ReloadProvidersAsync();

        /// <summary>
        /// Get statistics about provider usage
        /// </summary>
        /// <returns>Provider usage statistics</returns>
        Task<ProviderUsageStatistics> GetProviderStatisticsAsync();
    }

    /// <summary>
    /// Statistics about provider usage
    /// </summary>
    public class ProviderUsageStatistics
    {
        /// <summary>
        /// Total number of location requests
        /// </summary>
        public long TotalRequests { get; set; }

        /// <summary>
        /// Number of successful requests
        /// </summary>
        public long SuccessfulRequests { get; set; }

        /// <summary>
        /// Number of failed requests
        /// </summary>
        public long FailedRequests { get; set; }

        /// <summary>
        /// Number of failover events
        /// </summary>
        public long FailoverCount { get; set; }

        /// <summary>
        /// Average response time in milliseconds
        /// </summary>
        public double AverageResponseTimeMs { get; set; }

        /// <summary>
        /// Statistics per provider
        /// </summary>
        public Dictionary<string, ProviderStatistics> ProviderStats { get; set; } = new();
    }

    /// <summary>
    /// Statistics for a single provider
    /// </summary>
    public class ProviderStatistics
    {
        private long _requestCountField;
        private long _successCountField;
        private long _failureCountField;

        /// <summary>
        /// Provider name
        /// </summary>
        public string ProviderName { get; set; } = string.Empty;

        /// <summary>
        /// Number of requests to this provider
        /// </summary>
        public long RequestCount
        {
            get => _requestCountField;
            set => _requestCountField = value;
        }

        /// <summary>
        /// Number of successful requests
        /// </summary>
        public long SuccessCount
        {
            get => _successCountField;
            set => _successCountField = value;
        }

        /// <summary>
        /// Number of failed requests
        /// </summary>
        public long FailureCount
        {
            get => _failureCountField;
            set => _failureCountField = value;
        }

        /// <summary>
        /// Average response time in milliseconds
        /// </summary>
        public double AverageResponseTimeMs { get; set; }

        /// <summary>
        /// Last request timestamp
        /// </summary>
        public DateTime? LastRequestTime { get; set; }

        /// <summary>
        /// Current health status
        /// </summary>
        public HealthStatus HealthStatus { get; set; }

        // Internal fields for Interlocked operations
        internal ref long RequestCountField => ref _requestCountField;
        internal ref long SuccessCountField => ref _successCountField;
        internal ref long FailureCountField => ref _failureCountField;
    }
}
