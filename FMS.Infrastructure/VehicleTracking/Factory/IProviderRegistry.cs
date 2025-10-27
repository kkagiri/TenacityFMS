using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Interfaces;

namespace FMS.Infrastructure.VehicleTracking.Factory
{
    /// <summary>
    /// Metadata information about a registered provider
    /// </summary>
    public class ProviderMetadata
    {
        /// <summary>
        /// Provider name (unique identifier)
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Display name for UI
        /// </summary>
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Provider description
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Provider version
        /// </summary>
        public string Version { get; set; } = "1.0.0";

        /// <summary>
        /// Provider implementation type
        /// </summary>
        public Type ProviderType { get; set; } = typeof(object);

        /// <summary>
        /// Whether this provider is currently enabled
        /// </summary>
        public bool IsEnabled { get; set; }

        /// <summary>
        /// Configuration requirements
        /// </summary>
        public Dictionary<string, string> ConfigurationSchema { get; set; } = new();
    }

    /// <summary>
    /// Registry interface for discovering and managing provider types
    /// </summary>
    public interface IProviderRegistry
    {
        /// <summary>
        /// Register a provider type
        /// </summary>
        /// <typeparam name="TProvider">Provider type that implements IVehicleTrackingProvider</typeparam>
        /// <param name="providerName">Unique provider name</param>
        void RegisterProvider<TProvider>(string providerName) where TProvider : IVehicleTrackingProvider;

        /// <summary>
        /// Register a provider type with metadata
        /// </summary>
        /// <param name="metadata">Provider metadata</param>
        void RegisterProvider(ProviderMetadata metadata);

        /// <summary>
        /// Unregister a provider type
        /// </summary>
        /// <param name="providerName">Provider name</param>
        void UnregisterProvider(string providerName);

        /// <summary>
        /// Get provider type by name
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Provider type or null if not found</returns>
        Type? GetProviderType(string providerName);

        /// <summary>
        /// Get provider metadata by name
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Provider metadata or null if not found</returns>
        ProviderMetadata? GetProviderMetadata(string providerName);

        /// <summary>
        /// Get all registered provider names
        /// </summary>
        /// <returns>List of provider names</returns>
        IEnumerable<string> GetRegisteredProviderNames();

        /// <summary>
        /// Get all registered provider metadata
        /// </summary>
        /// <returns>List of provider metadata</returns>
        IEnumerable<ProviderMetadata> GetAllProviderMetadata();

        /// <summary>
        /// Check if a provider is registered
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>True if provider is registered</returns>
        bool IsProviderRegistered(string providerName);

        /// <summary>
        /// Scan assemblies for provider implementations
        /// </summary>
        /// <param name="assemblyNames">Assembly names to scan (null = scan all loaded assemblies)</param>
        /// <returns>Number of providers discovered and registered</returns>
        Task<int> DiscoverProvidersAsync(params string[] assemblyNames);

        /// <summary>
        /// Clear all registered providers
        /// </summary>
        void ClearRegistry();
    }
}
