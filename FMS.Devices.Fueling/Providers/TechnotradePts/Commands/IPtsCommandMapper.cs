/*
 * File:          IPtsCommandMapper.cs
 * Purpose:       Defines outbound Technotrade PTS command mapping contracts.
 * Dependencies:  FMS.Domain.PTSCommon, Newtonsoft.Json.Linq
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - TryMap(): Converts an application command name and payload into a jsonPTS packet shape.
 */
using FMS.Domain.PTSCommon;
using Newtonsoft.Json.Linq;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Commands;

public interface IPtsCommandMapper
{
    bool CanMap(string commandType);

    PtsCommandMapping TryMap(string commandType, object? commandData);
}

public sealed record PtsCommandMapping(
    string RequestedCommandType,
    string PacketType,
    JObject? Data)
{
    public Packet ToPacket(int packetId) =>
        new()
        {
            Id = packetId,
            Type = PacketType,
            Data = Data
        };
}
