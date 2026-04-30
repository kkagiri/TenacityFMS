/*
 * File:          ProviderMetadata.cs
 * Purpose:       Static descriptor exposed by every provider plugin.
 * Dependencies:  DeviceCategory, ProviderCapabilities
 * Last Modified: 2026-04-29
 */
namespace FMS.Devices.Abstractions.Common;

/// <summary>
/// Immutable descriptor that a provider exposes for discovery and UI surfaces.
/// </summary>
public sealed class ProviderMetadata
{
    public required string Name { get; init; }
    public required string DisplayName { get; init; }
    public required DeviceCategory Category { get; init; }
    public required string Version { get; init; }
    public required ProviderCapabilities Capabilities { get; init; }
    public string? Description { get; init; }
    public string? Vendor { get; init; }
    public string? DocumentationUrl { get; init; }
}
