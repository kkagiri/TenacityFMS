/*
 * File:          ProviderRegistry.cs
 * Purpose:       Discovers all [Provider]-decorated plugin classes registered in DI and
 *                exposes lookup by name and category. Built once at startup.
 * Dependencies:  FMS.Devices.Abstractions
 * Last Modified: 2026-04-29
 */
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using FMS.Devices.Abstractions.Common;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Core.Registry;

/// <summary>Read-only catalogue of registered device providers.</summary>
public interface IProviderRegistry
{
    IReadOnlyList<ProviderRegistration> All { get; }
    ProviderRegistration? FindByName(string name);
    IEnumerable<ProviderRegistration> FindByCategory(DeviceCategory category);
}

/// <summary>Single entry in the provider registry.</summary>
public sealed class ProviderRegistration
{
    public required string Name { get; init; }
    public required DeviceCategory Category { get; init; }
    public required string Version { get; init; }
    public required Type ImplementationType { get; init; }
}

/// <summary>
/// Default registry implementation. Built by scanning DI for <see cref="IDeviceProvider"/>
/// implementations carrying <see cref="ProviderAttribute"/>.
/// </summary>
public sealed class ProviderRegistry : IProviderRegistry
{
    private readonly ImmutableDictionary<string, ProviderRegistration> _byName;
    private readonly ImmutableArray<ProviderRegistration> _all;
    private readonly ILogger<ProviderRegistry> _logger;

    public ProviderRegistry(IEnumerable<IDeviceProvider> providers, ILogger<ProviderRegistry> logger)
    {
        _logger = logger;

        var registrations = new List<ProviderRegistration>();
        foreach (var provider in providers)
        {
            var attribute = provider.GetType().GetCustomAttributes(typeof(ProviderAttribute), inherit: false)
                .OfType<ProviderAttribute>()
                .FirstOrDefault();

            if (attribute is null)
            {
                _logger.LogWarning("Provider {Type} is registered in DI but missing [Provider] attribute; skipping.",
                    provider.GetType().FullName);
                continue;
            }

            registrations.Add(new ProviderRegistration
            {
                Name = attribute.Name,
                Category = attribute.Category,
                Version = attribute.Version,
                ImplementationType = provider.GetType(),
            });
        }

        _all = registrations.ToImmutableArray();
        _byName = registrations.ToImmutableDictionary(r => r.Name, StringComparer.OrdinalIgnoreCase);

        _logger.LogInformation("ProviderRegistry initialised with {Count} provider(s): {Names}",
            _all.Length, string.Join(", ", _all.Select(r => r.Name)));
    }

    public IReadOnlyList<ProviderRegistration> All => _all;

    public ProviderRegistration? FindByName(string name) =>
        !string.IsNullOrWhiteSpace(name) && _byName.TryGetValue(name, out var reg) ? reg : null;

    public IEnumerable<ProviderRegistration> FindByCategory(DeviceCategory category) =>
        _all.Where(r => r.Category == category);
}
