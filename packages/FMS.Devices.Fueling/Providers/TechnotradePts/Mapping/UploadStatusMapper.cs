/*
 * File:          UploadStatusMapper.cs
 * Purpose:       Maps Technotrade UploadStatus packets into canonical upload-status
 *                notifications.
 * Dependencies:  FMS.Domain.Entities.PTS.PTSStatus, FMS.Devices.Core.Routing
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - BuildPayload(): Converts UploadStatus into UploadStatusMessage.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;
using FMS.Devices.Core.Routing;
using FMS.Domain.Entities.PTS.PTSStatus;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class UploadStatusMapper
    : PtsPacketMapperBase<UploadStatus, UploadStatusMessage>
{
    public UploadStatusMapper(
        IDeviceMessageRouter router,
        ILogger<UploadStatusMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "UploadStatus";

    protected override UploadStatusMessage BuildPayload(TechnotradePtsPacketContext context, UploadStatus packetPayload)
    {
        var pumpCount = packetPayload.Pumps?.GetType().GetProperties().Length;
        var probeCount = packetPayload.Probes?.GetType().GetProperties().Length;

        return new()
        {
            StatusCode = "Online",
            ObservedAtUtc = ToUtc(packetPayload.DateTime),
            FirmwareVersion = packetPayload.FirmwareDateTime == default
                ? null
                : ToUtc(packetPayload.FirmwareDateTime).ToString("O"),
            Description = $"StartupSeconds={packetPayload.StartupSeconds}; BatteryVoltage={packetPayload.BatteryVoltage}; CpuTemperature={packetPayload.CpuTemperature}; SdMounted={packetPayload.SdMounted}; Pumps={pumpCount?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "0"}; Probes={probeCount?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "0"}",
            PumpStatusCount = pumpCount,
            ProbeStatusCount = probeCount,
            RawPayloadJson = context.Packet.Data?.ToString(Newtonsoft.Json.Formatting.None)
        };
    }

    protected override DateTime GetOccurredAtUtc(
        TechnotradePtsPacketContext context,
        UploadStatus packetPayload,
        UploadStatusMessage canonicalPayload) =>
        canonicalPayload.ObservedAtUtc;

    protected override Task PublishAsync(DeviceMessage<UploadStatusMessage> message, CancellationToken cancellationToken) =>
        Router.PublishUploadStatusAsync(message, cancellationToken);
}
