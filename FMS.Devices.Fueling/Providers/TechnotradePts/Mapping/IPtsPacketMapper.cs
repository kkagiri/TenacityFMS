/*
 * File:          IPtsPacketMapper.cs
 * Purpose:       Defines the Technotrade PTS packet mapper contract used to translate
 *                vendor packet payloads into canonical fueling notifications.
 * Dependencies:  FMS.Domain.PTSCommon
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - MapAndPublishAsync(): Maps one PTS packet and publishes its canonical notification.
 */
using FMS.Domain.PTSCommon;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public interface IPtsPacketMapper
{
    string PacketType { get; }

    Task MapAndPublishAsync(TechnotradePtsPacketContext context, CancellationToken cancellationToken = default);
}

public interface IPtsPacketMapper<TPacket, TCanonical> : IPtsPacketMapper
    where TPacket : class
    where TCanonical : class
{
}

public sealed record TechnotradePtsPacketContext(
    string DeviceId,
    Guid TenantId,
    Packet Packet);
