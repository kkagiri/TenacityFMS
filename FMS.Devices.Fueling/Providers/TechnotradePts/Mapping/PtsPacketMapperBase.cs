/*
 * File:          PtsPacketMapperBase.cs
 * Purpose:       Shared mapping helpers for Technotrade PTS packet mappers.
 * Dependencies:  FMS.Devices.Abstractions.Common, FMS.Devices.Core.Routing, Newtonsoft.Json
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - MapAndPublishAsync(): Builds and publishes the canonical DeviceMessage envelope.
 * - BuildPayload(): Implemented by concrete mappers for each packet type.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public abstract class PtsPacketMapperBase<TPacket, TCanonical> : IPtsPacketMapper<TPacket, TCanonical>
    where TPacket : class
    where TCanonical : class
{
    private const string ProviderName = "TechnotradePTS";

    protected PtsPacketMapperBase(
        IDeviceMessageRouter router,
        ILogger logger)
    {
        Router = router;
        Logger = logger;
    }

    protected IDeviceMessageRouter Router { get; }
    protected ILogger Logger { get; }

    public abstract string PacketType { get; }

    public async Task MapAndPublishAsync(TechnotradePtsPacketContext context, CancellationToken cancellationToken = default)
    {
        if (context.Packet.Data == null)
        {
            throw new InvalidOperationException($"Packet {context.Packet.Id} ({PacketType}) has no Data payload.");
        }

        var packetPayload = context.Packet.Data.ToObject<TPacket>();
        if (packetPayload == null)
        {
            throw new InvalidOperationException($"Packet {context.Packet.Id} ({PacketType}) could not be deserialized.");
        }

        var payload = BuildPayload(context, packetPayload);
        var message = new DeviceMessage<TCanonical>
        {
            TenantId = context.TenantId,
            ProviderName = ProviderName,
            ExternalDeviceId = context.DeviceId,
            OccurredAtUtc = GetOccurredAtUtc(context, packetPayload, payload),
            Payload = payload,
            Headers = BuildHeaders(context)
        };

        await PublishAsync(message, cancellationToken);
    }

    protected abstract TCanonical BuildPayload(TechnotradePtsPacketContext context, TPacket packetPayload);

    protected abstract Task PublishAsync(DeviceMessage<TCanonical> message, CancellationToken cancellationToken);

    protected virtual DateTime GetOccurredAtUtc(TechnotradePtsPacketContext context, TPacket packetPayload, TCanonical canonicalPayload) =>
        DateTime.UtcNow;

    protected static DateTime ToUtc(DateTime value)
    {
        if (value == default)
        {
            return DateTime.UtcNow;
        }

        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Local).ToUniversalTime()
        };
    }

    protected static decimal? ToDecimal(double? value) =>
        value.HasValue ? Convert.ToDecimal(value.Value) : null;

    protected static string NumberOrUnknown(int? value) =>
        value.HasValue && value.Value > 0 ? value.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) : "Unknown";

    private static IReadOnlyDictionary<string, string> BuildHeaders(TechnotradePtsPacketContext context) =>
        new Dictionary<string, string>
        {
            ["packetId"] = context.Packet.Id.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["packetType"] = context.Packet.Type
        };
}
