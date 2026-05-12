using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Models;

namespace FMS.Infrastructure.VehicleTracking.Interfaces
{
    /// <summary>
    /// Health monitoring service for vehicle tracking providers
    /// </summary>
    public interface IProviderHealthMonitor
    {
        /// <summary>
        /// Perform health check on a specific provider
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Health status</returns>
        Task<ProviderHealthStatus> CheckProviderHealthAsync(string providerName);

        /// <summary>
        /// Perform health check on all providers
        /// </summary>
        /// <returns>Dictionary of provider names and their health status</returns>
        Task<Dictionary<string, ProviderHealthStatus>> CheckAllProvidersHealthAsync();

        /// <summary>
        /// Get the most recent health status for a provider (from cache/database)
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Last known health status</returns>
        Task<ProviderHealthStatus?> GetLastHealthStatusAsync(string providerName);

        /// <summary>
        /// Get health history for a provider
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <param name="from">Start date</param>
        /// <param name="to">End date</param>
        /// <returns>List of health status records</returns>
        Task<List<ProviderHealthStatus>> GetHealthHistoryAsync(
            string providerName,
            DateTime from,
            DateTime to);

        /// <summary>
        /// Start continuous health monitoring
        /// </summary>
        /// <param name="checkInterval">Interval between health checks</param>
        Task StartMonitoringAsync(TimeSpan checkInterval);

        /// <summary>
        /// Stop continuous health monitoring
        /// </summary>
        Task StopMonitoringAsync();

        /// <summary>
        /// Register a callback to be notified when provider health changes
        /// </summary>
        /// <param name="callback">Callback function</param>
        void RegisterHealthChangeCallback(Action<string, ProviderHealthStatus> callback);
    }
}
