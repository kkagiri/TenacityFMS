/*
 * File:          ProviderCapabilities.cs
 * Purpose:       Bit flags declaring the optional features a device provider supports.
 *                Replaces hardcoded provider-name string checks across FMS.
 * Dependencies:  None
 * Last Modified: 2026-04-29
 */
using System;

namespace FMS.Devices.Abstractions.Common;

/// <summary>
/// Optional capabilities a provider may declare. Consumers should call
/// <c>provider.Capabilities.HasFlag(ProviderCapabilities.X)</c> rather than
/// branching on <c>provider.Name</c>.
/// </summary>
[Flags]
public enum ProviderCapabilities : long
{
    None = 0,

    // Tracking capabilities
    LiveLocation = 1L << 0,
    HistoricalLocation = 1L << 1,
    Sensors = 1L << 2,
    Geofences = 1L << 3,
    Events = 1L << 4,
    Driver = 1L << 5,
    DeviceDiscovery = 1L << 6,
    Geocoding = 1L << 7,

    // Fueling capabilities
    PumpControl = 1L << 16,
    TankMeasurement = 1L << 17,
    UploadStatus = 1L << 18,
    AlertRecord = 1L << 19,
    PumpTransactions = 1L << 20,

    // Cross-cutting
    HealthCheck = 1L << 32,
}
