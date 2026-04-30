/*
 * File:          NaftaAtgProvider.cs
 * Purpose:       ATG persistence sink shell for the Nafta schema.
 * Dependencies:  FMS.Devices.Abstractions
 * Last Modified: 2026-04-30
 *
 * Key Functions:
 * - IsHealthyAsync(): Placeholder sink health response until canonical notification handlers land.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling;

namespace FMS.Devices.Fueling.Providers.NaftaAtg;

[Provider("NaftaATG", DeviceCategory.Atg, "0.1.0-stub")]
public sealed class NaftaAtgProvider : IFuelingPersistenceSink
{
    public ProviderMetadata Metadata { get; } = new()
    {
        Name = "NaftaATG",
        DisplayName = "Nafta ATG",
        Category = DeviceCategory.Atg,
        Version = "0.1.0-stub",
        Capabilities = ProviderCapabilities.PumpTransactions
            | ProviderCapabilities.TankMeasurement,
        Vendor = "Nafta",
        Description = "Persistence sink shell for writing canonical fueling notifications into the existing Nafta schema.",
    };

    public ProviderCapabilities Capabilities => Metadata.Capabilities;

    public Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}
