/*
 * File:          SystemCommandMapper.cs
 * Purpose:       Maps general/system Technotrade PTS commands used by FMS.
 * Dependencies:  PtsCommandMapperBase
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - TryMap(): Maps supported system command names to jsonPTS packet types.
 */
namespace FMS.Devices.Fueling.Providers.TechnotradePts.Commands;

public sealed class SystemCommandMapper : PtsCommandMapperBase
{
    private static readonly IReadOnlyDictionary<string, string> CommandMap =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["GetBatteryVoltage"] = "GetBatteryVoltage",
            ["GetCpuTemperature"] = "GetCpuTemperature",
            ["GetUniqueIdentifier"] = "GetUniqueIdentifier",
            ["GetControllerType"] = "GetControllerType",
            ["GetFirmwareInformation"] = "GetFirmwareInformation",
            ["Restart"] = "Restart",
            ["MakeDiagnostics"] = "MakeDiagnostics"
        };

    public SystemCommandMapper()
        : base(CommandMap)
    {
    }
}
