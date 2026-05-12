using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Interfaces;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Factory
{
    /// <summary>
    /// Registry implementation for discovering and managing provider types
    /// </summary>
    public class ProviderRegistry : IProviderRegistry
    {
        private readonly ConcurrentDictionary<string, ProviderMetadata> _providers = new();
        private readonly ILogger<ProviderRegistry> _logger;

        public ProviderRegistry(ILogger<ProviderRegistry> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc/>
        public void RegisterProvider<TProvider>(string providerName) where TProvider : IVehicleTrackingProvider
        {
            if (string.IsNullOrWhiteSpace(providerName))
                throw new ArgumentException("Provider name cannot be null or empty", nameof(providerName));

            var metadata = new ProviderMetadata
            {
                Name = providerName,
                DisplayName = providerName,
                ProviderType = typeof(TProvider),
                Version = GetProviderVersion(typeof(TProvider)),
                IsEnabled = true
            };

            RegisterProvider(metadata);
        }

        /// <inheritdoc/>
        public void RegisterProvider(ProviderMetadata metadata)
        {
            if (metadata == null)
                throw new ArgumentNullException(nameof(metadata));

            if (string.IsNullOrWhiteSpace(metadata.Name))
                throw new ArgumentException("Provider name cannot be null or empty", nameof(metadata));

            if (!typeof(IVehicleTrackingProvider).IsAssignableFrom(metadata.ProviderType))
            {
                throw new ArgumentException(
                    $"Provider type {metadata.ProviderType.Name} must implement IVehicleTrackingProvider",
                    nameof(metadata));
            }

            if (_providers.TryAdd(metadata.Name, metadata))
            {
                _logger.LogInformation(
                    "Registered provider: {ProviderName} (Type: {ProviderType}, Version: {Version})",
                    metadata.Name, metadata.ProviderType.Name, metadata.Version);
            }
            else
            {
                _logger.LogWarning(
                    "Provider {ProviderName} is already registered, updating metadata",
                    metadata.Name);
                _providers[metadata.Name] = metadata;
            }
        }

        /// <inheritdoc/>
        public void UnregisterProvider(string providerName)
        {
            if (string.IsNullOrWhiteSpace(providerName))
                return;

            if (_providers.TryRemove(providerName, out var metadata))
            {
                _logger.LogInformation(
                    "Unregistered provider: {ProviderName}",
                    metadata.Name);
            }
        }

        /// <inheritdoc/>
        public Type? GetProviderType(string providerName)
        {
            if (string.IsNullOrWhiteSpace(providerName))
                return null;

            return _providers.TryGetValue(providerName, out var metadata)
                ? metadata.ProviderType
                : null;
        }

        /// <inheritdoc/>
        public ProviderMetadata? GetProviderMetadata(string providerName)
        {
            if (string.IsNullOrWhiteSpace(providerName))
                return null;

            return _providers.TryGetValue(providerName, out var metadata)
                ? metadata
                : null;
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetRegisteredProviderNames()
        {
            return _providers.Keys.ToList();
        }

        /// <inheritdoc/>
        public IEnumerable<ProviderMetadata> GetAllProviderMetadata()
        {
            return _providers.Values.ToList();
        }

        /// <inheritdoc/>
        public bool IsProviderRegistered(string providerName)
        {
            if (string.IsNullOrWhiteSpace(providerName))
                return false;

            return _providers.ContainsKey(providerName);
        }

        /// <inheritdoc/>
        public async Task<int> DiscoverProvidersAsync(params string[] assemblyNames)
        {
            await Task.CompletedTask; // Make method truly async

            var discoveredCount = 0;
            var assembliesToScan = GetAssembliesToScan(assemblyNames);

            _logger.LogInformation(
                "Starting provider discovery in {AssemblyCount} assemblies",
                assembliesToScan.Count);

            foreach (var assembly in assembliesToScan)
            {
                try
                {
                    var providerTypes = assembly.GetTypes()
                        .Where(t => !t.IsAbstract && !t.IsInterface)
                        .Where(t => typeof(IVehicleTrackingProvider).IsAssignableFrom(t))
                        .ToList();

                    foreach (var providerType in providerTypes)
                    {
                        try
                        {
                            var metadata = CreateMetadataFromType(providerType);
                            RegisterProvider(metadata);
                            discoveredCount++;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex,
                                "Failed to register provider type: {ProviderType}",
                                providerType.Name);
                        }
                    }
                }
                catch (ReflectionTypeLoadException ex)
                {
                    _logger.LogError(ex,
                        "Failed to load types from assembly: {AssemblyName}",
                        assembly.FullName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Error scanning assembly for providers: {AssemblyName}",
                        assembly.FullName);
                }
            }

            _logger.LogInformation(
                "Provider discovery completed. Discovered {ProviderCount} providers",
                discoveredCount);

            return discoveredCount;
        }

        /// <inheritdoc/>
        public void ClearRegistry()
        {
            var count = _providers.Count;
            _providers.Clear();
            _logger.LogInformation("Cleared provider registry ({ProviderCount} providers removed)", count);
        }

        #region Private Helper Methods

        private List<Assembly> GetAssembliesToScan(string[] assemblyNames)
        {
            if (assemblyNames == null || assemblyNames.Length == 0)
            {
                // Scan current domain assemblies
                return AppDomain.CurrentDomain.GetAssemblies()
                    .Where(a => !a.IsDynamic && !string.IsNullOrWhiteSpace(a.Location))
                    .ToList();
            }

            var assemblies = new List<Assembly>();
            foreach (var assemblyName in assemblyNames)
            {
                try
                {
                    var assembly = Assembly.Load(assemblyName);
                    assemblies.Add(assembly);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Failed to load assembly: {AssemblyName}",
                        assemblyName);
                }
            }

            return assemblies;
        }

        private ProviderMetadata CreateMetadataFromType(Type providerType)
        {
            var metadata = new ProviderMetadata
            {
                Name = GetProviderName(providerType),
                DisplayName = GetProviderDisplayName(providerType),
                Description = GetProviderDescription(providerType),
                Version = GetProviderVersion(providerType),
                ProviderType = providerType,
                IsEnabled = true
            };

            return metadata;
        }

        private string GetProviderName(Type providerType)
        {
            // Check for attribute
            var attr = providerType.GetCustomAttribute<ProviderAttribute>();
            if (attr != null && !string.IsNullOrWhiteSpace(attr.Name))
                return attr.Name;

            // Use type name without "Provider" suffix
            var name = providerType.Name;
            if (name.EndsWith("Provider", StringComparison.OrdinalIgnoreCase))
                name = name.Substring(0, name.Length - 8);

            return name;
        }

        private string GetProviderDisplayName(Type providerType)
        {
            var attr = providerType.GetCustomAttribute<ProviderAttribute>();
            return attr?.DisplayName ?? GetProviderName(providerType);
        }

        private string GetProviderDescription(Type providerType)
        {
            var attr = providerType.GetCustomAttribute<ProviderAttribute>();
            return attr?.Description ?? string.Empty;
        }

        private string GetProviderVersion(Type providerType)
        {
            var attr = providerType.GetCustomAttribute<ProviderAttribute>();
            if (attr != null && !string.IsNullOrWhiteSpace(attr.Version))
                return attr.Version;

            // Try to get assembly version
            var assembly = providerType.Assembly;
            var version = assembly.GetName().Version;
            return version?.ToString() ?? "1.0.0";
        }

        #endregion
    }
}
