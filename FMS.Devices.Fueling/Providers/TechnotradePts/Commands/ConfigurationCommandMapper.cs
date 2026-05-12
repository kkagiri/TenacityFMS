/*
 * File:          ConfigurationCommandMapper.cs
 * Purpose:       Maps Technotrade configuration commands used by FMS.
 * Dependencies:  PtsCommandMapperBase
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - TryMap(): Maps configuration command names to jsonPTS packet types.
 */
namespace FMS.Devices.Fueling.Providers.TechnotradePts.Commands;

public sealed class ConfigurationCommandMapper : PtsCommandMapperBase
{
    private static readonly IReadOnlyDictionary<string, string> CommandMap =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["GetDateTime"] = "GetDateTime",
            ["SetDateTime"] = "SetDateTime",
            ["GetPumpsConfiguration"] = "GetPumpsConfiguration",
            ["SetPumpsConfiguration"] = "SetPumpsConfiguration",
            ["GetProbesConfiguration"] = "GetProbesConfiguration",
            ["SetProbesConfiguration"] = "SetProbesConfiguration",
            ["GetTanksConfiguration"] = "GetTanksConfiguration",
            ["SetTanksConfiguration"] = "SetTanksConfiguration",
            ["GetPumpNozzlesConfiguration"] = "GetPumpNozzlesConfiguration",
            ["SetPumpNozzlesConfiguration"] = "SetPumpNozzlesConfiguration",
            ["GetRemoteServerConfiguration"] = "GetRemoteServerConfiguration",
            ["SetRemoteServerConfiguration"] = "SetRemoteServerConfiguration",
            ["SetFuelGradesPrices"] = "SetFuelGradesPrices"
        };

    public ConfigurationCommandMapper()
        : base(CommandMap)
    {
    }
}
