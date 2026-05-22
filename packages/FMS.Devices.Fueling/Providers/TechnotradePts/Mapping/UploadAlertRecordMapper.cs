/*
 * File:          UploadAlertRecordMapper.cs
 * Purpose:       Maps Technotrade UploadAlertRecord packets into canonical alert
 *                notifications.
 * Dependencies:  FMS.Devices.Core.Routing
 * Last Modified: 2026-05-22
 *
 * Key Functions:
 * - BuildPayload(): Converts TechnotradePtsAlertRecordDto into AlertRecordMessage.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;
using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class UploadAlertRecordMapper
    : PtsPacketMapperBase<TechnotradePtsAlertRecordDto, AlertRecordMessage>
{
    public UploadAlertRecordMapper(
        IDeviceMessageRouter router,
        ILogger<UploadAlertRecordMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "UploadAlertRecord";

    protected override AlertRecordMessage BuildPayload(TechnotradePtsPacketContext context, TechnotradePtsAlertRecordDto packetPayload)
    {
        if (string.IsNullOrWhiteSpace(packetPayload.PtsId))
        {
            packetPayload.PtsId = context.DeviceId;
        }

        return new AlertRecordMessage
        {
            AlertCode = packetPayload.Code.ToString(System.Globalization.CultureInfo.InvariantCulture),
            Severity = string.IsNullOrWhiteSpace(packetPayload.State) ? "Unknown" : packetPayload.State,
            RaisedAtUtc = ToUtc(packetPayload.DateTime),
            Source = $"{packetPayload.DeviceType}:{packetPayload.DeviceNumber}",
            Description = $"ConfigurationId={packetPayload.ConfigurationId}; State={packetPayload.State}"
        };
    }

    protected override DateTime GetOccurredAtUtc(
        TechnotradePtsPacketContext context,
        TechnotradePtsAlertRecordDto packetPayload,
        AlertRecordMessage canonicalPayload) =>
        canonicalPayload.RaisedAtUtc;

    protected override Task PublishAsync(DeviceMessage<AlertRecordMessage> message, CancellationToken cancellationToken) =>
        Router.PublishAlertRecordAsync(message, cancellationToken);
}

public sealed class TechnotradePtsAlertRecordDto
{
    public string PtsId { get; set; } = null!;

    public DateTime DateTime { get; set; }

    public string DeviceType { get; set; } = null!;

    public int DeviceNumber { get; set; }

    public string State { get; set; } = null!;

    public int Code { get; set; }

    public string ConfigurationId { get; set; } = null!;
}
