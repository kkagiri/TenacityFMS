/*
 * File:          PumpControlCommandMapper.cs
 * Purpose:       Maps pump-control application commands to Technotrade jsonPTS request types.
 * Dependencies:  PtsCommandMapperBase
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - TryMap(): Maps supported pump command aliases to protocol packet types.
 */
namespace FMS.Devices.Fueling.Providers.TechnotradePts.Commands;

public sealed class PumpControlCommandMapper : PtsCommandMapperBase
{
    private static readonly IReadOnlyDictionary<string, string> CommandMap =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["PumpAuthorize"] = "PumpAuthorize",
            ["PumpGetStatus"] = "PumpGetStatus",
            ["PumpStop"] = "PumpStop",
            ["PumpEmergencyStop"] = "PumpEmergencyStop",
            ["PumpSuspend"] = "PumpSuspend",
            ["PumpResume"] = "PumpResume",
            ["PumpCloseTransaction"] = "PumpCloseTransaction",
            ["PumpGetTransactionInformation"] = "PumpGetTransactionInformation",
            ["PumpSetPrices"] = "PumpSetPrices",
            ["PumpGetTag"] = "PumpGetTag",
            ["PumpTag"] = "PumpGetTag"
        };

    public PumpControlCommandMapper()
        : base(CommandMap)
    {
    }
}
