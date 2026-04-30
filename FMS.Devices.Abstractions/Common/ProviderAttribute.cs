/*
 * File:          ProviderAttribute.cs
 * Purpose:       Marker attribute used by ProviderRegistry to discover device provider plugins.
 * Dependencies:  DeviceCategory
 * Last Modified: 2026-04-29
 */
using System;

namespace FMS.Devices.Abstractions.Common;

/// <summary>
/// Marks a class as a device provider plugin so it can be auto-discovered
/// by <c>ProviderRegistry</c> at startup.
/// </summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
public sealed class ProviderAttribute : Attribute
{
    public ProviderAttribute(string name, DeviceCategory category, string version = "1.0.0")
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Provider name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(version))
            throw new ArgumentException("Provider version is required.", nameof(version));

        Name = name;
        Category = category;
        Version = version;
    }

    /// <summary>Unique provider name (e.g. "GPSGate", "TechnotradePTS").</summary>
    public string Name { get; }

    /// <summary>Device family this provider belongs to.</summary>
    public DeviceCategory Category { get; }

    /// <summary>Provider plugin semantic version.</summary>
    public string Version { get; }
}
