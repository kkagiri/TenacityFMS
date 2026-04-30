/*
 * File:          DeviceCategory.cs
 * Purpose:       Enumerates the device families supported by the FMS multi-device platform.
 * Dependencies:  None
 * Last Modified: 2026-04-29
 */
namespace FMS.Devices.Abstractions.Common;

/// <summary>
/// Top-level grouping that determines which provider contract a plugin implements.
/// </summary>
public enum DeviceCategory
{
    /// <summary>Vehicle tracking / GPS telemetry providers (e.g. GPSGate, GpsWox).</summary>
    Tracking = 1,

    /// <summary>Fueling devices (e.g. Technotrade PTS pumps and tank sensors).</summary>
    Fueling = 2,

    /// <summary>Automatic Tank Gauge persistence sinks (e.g. Nafta ATG schema).</summary>
    Atg = 3,
}
