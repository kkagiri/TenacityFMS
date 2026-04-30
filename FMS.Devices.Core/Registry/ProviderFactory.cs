/*
 * File:          ProviderFactory.cs
 * Purpose:       Resolves the correct provider plugin instance for a given tenant and
 *                external device id, applying tenant scoping via IProviderConfigRepository
 *                and IDeviceMappingRepository.
 * Dependencies:  IProviderRegistry, IProviderConfigRepository, IDeviceMappingRepository
 * Last Modified: 2026-04-29
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Core.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Core.Registry;

/// <summary>
/// Resolves provider instances per tenant + device. Always pass through this factory rather
/// than injecting a specific provider implementation, so capability-based routing remains intact.
/// </summary>
public interface IProviderFactory
{
    /// <summary>Resolve provider for a vehicle (tracking).</summary>
    Task<IDeviceProvider?> GetForVehicleAsync(int vehicleId, CancellationToken cancellationToken = default);

    /// <summary>Resolve provider for a fueling device id.</summary>
    Task<IDeviceProvider?> GetForFuelingDeviceAsync(int fuelingDeviceId, CancellationToken cancellationToken = default);

    /// <summary>Resolve provider by configuration name (must belong to current tenant).</summary>
    Task<IDeviceProvider?> GetByNameAsync(string providerName, CancellationToken cancellationToken = default);
}

public sealed class ProviderFactory : IProviderFactory
{
    private readonly IProviderRegistry _registry;
    private readonly IProviderConfigRepository _configRepository;
    private readonly IDeviceMappingRepository _mappingRepository;
    private readonly IServiceProvider _services;
    private readonly ILogger<ProviderFactory> _logger;

    public ProviderFactory(
        IProviderRegistry registry,
        IProviderConfigRepository configRepository,
        IDeviceMappingRepository mappingRepository,
        IServiceProvider services,
        ILogger<ProviderFactory> logger)
    {
        _registry = registry;
        _configRepository = configRepository;
        _mappingRepository = mappingRepository;
        _services = services;
        _logger = logger;
    }

    public async Task<IDeviceProvider?> GetForVehicleAsync(int vehicleId, CancellationToken cancellationToken = default)
    {
        var mapping = await _mappingRepository.GetForVehicleAsync(vehicleId, cancellationToken);
        if (mapping is null)
        {
            _logger.LogDebug("No active provider mapping for vehicle {VehicleId}.", vehicleId);
            return null;
        }

        var config = await _configRepository.GetByIdAsync(mapping.ProviderConfigId, cancellationToken);
        if (config is null)
        {
            _logger.LogWarning("Vehicle {VehicleId} mapped to provider config {ConfigId} which is missing or out-of-tenant.",
                vehicleId, mapping.ProviderConfigId);
            return null;
        }

        return ResolveProviderInstance(config.Name);
    }

    public async Task<IDeviceProvider?> GetForFuelingDeviceAsync(int fuelingDeviceId, CancellationToken cancellationToken = default)
    {
        var mapping = await _mappingRepository.GetForFuelingDeviceAsync(fuelingDeviceId, cancellationToken);
        if (mapping is null)
        {
            _logger.LogDebug("No active provider mapping for fueling device {DeviceId}.", fuelingDeviceId);
            return null;
        }

        var config = await _configRepository.GetByIdAsync(mapping.ProviderConfigId, cancellationToken);
        if (config is null) return null;

        return ResolveProviderInstance(config.Name);
    }

    public async Task<IDeviceProvider?> GetByNameAsync(string providerName, CancellationToken cancellationToken = default)
    {
        var config = await _configRepository.GetByNameAsync(providerName, cancellationToken);
        if (config is null)
        {
            _logger.LogDebug("Provider config {Name} not found in current tenant.", providerName);
            return null;
        }

        return ResolveProviderInstance(config.Name);
    }

    private IDeviceProvider? ResolveProviderInstance(string providerName)
    {
        var registration = _registry.FindByName(providerName);
        if (registration is null)
        {
            _logger.LogWarning("Provider config '{Name}' has no matching plugin in the registry.", providerName);
            return null;
        }

        var instances = _services.GetServices<IDeviceProvider>();
        var match = instances.FirstOrDefault(i => i.GetType() == registration.ImplementationType);
        if (match is null)
        {
            _logger.LogWarning("Plugin type {Type} not resolvable from DI; ensure it is registered as IDeviceProvider.",
                registration.ImplementationType.FullName);
        }
        return match;
    }
}
