/*
 * File:          ProviderHealthMonitor.cs
 * Purpose:       Periodically polls all registered providers' IsHealthyAsync() and exposes
 *                a snapshot for diagnostics. Persistence to provider_health_history is
 *                handled by FMS.Application/Features/Devices/Health (T7.x).
 * Dependencies:  IProviderRegistry, IServiceProvider
 * Last Modified: 2026-04-29
 */
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Core.Registry;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Core.Health;

public interface IProviderHealthMonitor
{
    Task<ProviderHealthSnapshot> CheckAsync(string providerName, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProviderHealthSnapshot>> CheckAllAsync(CancellationToken cancellationToken = default);
    IReadOnlyDictionary<string, ProviderHealthSnapshot> GetLatest();
}

public sealed record ProviderHealthSnapshot(
    string ProviderName,
    DeviceCategory Category,
    bool IsHealthy,
    DateTime CheckedAtUtc,
    string? ErrorMessage = null);

public sealed class ProviderHealthMonitor : IProviderHealthMonitor
{
    private readonly IProviderRegistry _registry;
    private readonly IServiceProvider _services;
    private readonly ILogger<ProviderHealthMonitor> _logger;
    private readonly ConcurrentDictionary<string, ProviderHealthSnapshot> _latest = new(StringComparer.OrdinalIgnoreCase);

    public ProviderHealthMonitor(IProviderRegistry registry, IServiceProvider services, ILogger<ProviderHealthMonitor> logger)
    {
        _registry = registry;
        _services = services;
        _logger = logger;
    }

    public async Task<ProviderHealthSnapshot> CheckAsync(string providerName, CancellationToken cancellationToken = default)
    {
        var registration = _registry.FindByName(providerName);
        if (registration is null)
        {
            var snap = new ProviderHealthSnapshot(providerName, DeviceCategory.Tracking, false, DateTime.UtcNow, "Not registered");
            _latest[providerName] = snap;
            return snap;
        }

        try
        {
            var provider = (IDeviceProvider)_services.GetRequiredService(registration.ImplementationType);
            var healthy = await provider.IsHealthyAsync(cancellationToken).ConfigureAwait(false);
            var snap = new ProviderHealthSnapshot(registration.Name, registration.Category, healthy, DateTime.UtcNow);
            _latest[registration.Name] = snap;
            return snap;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Health check failed for provider {Provider}.", registration.Name);
            var snap = new ProviderHealthSnapshot(registration.Name, registration.Category, false, DateTime.UtcNow, ex.Message);
            _latest[registration.Name] = snap;
            return snap;
        }
    }

    public async Task<IReadOnlyList<ProviderHealthSnapshot>> CheckAllAsync(CancellationToken cancellationToken = default)
    {
        var results = new List<ProviderHealthSnapshot>();
        foreach (var registration in _registry.All)
        {
            results.Add(await CheckAsync(registration.Name, cancellationToken).ConfigureAwait(false));
        }
        return results;
    }

    public IReadOnlyDictionary<string, ProviderHealthSnapshot> GetLatest() => _latest;
}
