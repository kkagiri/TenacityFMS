/*
 * File:          TechnotradePtsProvider.cs
 * Purpose:       Fueling provider shell for Technotrade PTS devices.
 * Dependencies:  FMS.Devices.Abstractions
 * Last Modified: 2026-04-30
 *
 * Key Functions:
 * - IsHealthyAsync(): Placeholder provider health response until transport migration lands.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling;

namespace FMS.Devices.Fueling.Providers.TechnotradePts;

[Provider("TechnotradePTS", DeviceCategory.Fueling, "0.1.0-stub")]
public sealed class TechnotradePtsProvider : IFuelingDeviceProvider
{
    public ProviderMetadata Metadata { get; } = new()
    {
        Name = "TechnotradePTS",
        DisplayName = "Technotrade PTS",
        Category = DeviceCategory.Fueling,
        Version = "0.1.0-stub",
        Capabilities = ProviderCapabilities.PumpControl
            | ProviderCapabilities.TankMeasurement
            | ProviderCapabilities.UploadStatus
            | ProviderCapabilities.AlertRecord
            | ProviderCapabilities.PumpTransactions,
        Vendor = "Technotrade",
        Description = "Fueling controller provider shell. Transport, protocol, mappings, and command channels migrate here during Phase 3.",
    };

    public ProviderCapabilities Capabilities => Metadata.Capabilities;

    public Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}
