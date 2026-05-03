/*
 * File:          UploadPumpTransactionMapper.cs
 * Purpose:       Maps Technotrade UploadPumpTransaction packets into canonical pump
 *                transaction notifications.
 * Dependencies:  FMS.Application.ModelsDTOs.PTS, FMS.Devices.Core.Routing
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - BuildPayload(): Converts PumpTransactionDto into PumpTransactionMessage.
 */
using FMS.Application.ModelsDTOs.PTS;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;
using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class UploadPumpTransactionMapper
    : PtsPacketMapperBase<PumpTransactionDto, PumpTransactionMessage>
{
    public UploadPumpTransactionMapper(
        IDeviceMessageRouter router,
        ILogger<UploadPumpTransactionMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "UploadPumpTransaction";

    protected override PumpTransactionMessage BuildPayload(TechnotradePtsPacketContext context, PumpTransactionDto packetPayload)
    {
        if (string.IsNullOrWhiteSpace(packetPayload.PtsId))
        {
            packetPayload.PtsId = context.DeviceId;
        }

        if (packetPayload.PacketId <= 0)
        {
            packetPayload.PacketId = context.Packet.Id;
        }

        return new PumpTransactionMessage
        {
            ExternalTransactionId = packetPayload.Transaction > 0
                ? packetPayload.Transaction.ToString(System.Globalization.CultureInfo.InvariantCulture)
                : $"{context.DeviceId}-{context.Packet.Id}",
            PumpNumber = packetPayload.Pump,
            NozzleNumber = packetPayload.Nozzle,
            FuelGrade = packetPayload.FuelGradeName ?? NumberOrUnknown(packetPayload.FuelGradeId),
            Volume = packetPayload.Volume,
            Amount = packetPayload.Amount,
            UnitPrice = packetPayload.Price ?? 0m,
            StartedAtUtc = ToUtc(packetPayload.DateTimeStart == default ? packetPayload.DateTime : packetPayload.DateTimeStart),
            EndedAtUtc = ToUtc(packetPayload.DateTime == default ? packetPayload.DateTimeStart : packetPayload.DateTime),
            CardCode = packetPayload.Tag,
            DriverCode = packetPayload.DriverName
                ?? packetPayload.EmployeeName
                ?? packetPayload.FueledByUserName
                ?? packetPayload.UserName
                ?? packetPayload.UserId,
            VehicleCode = packetPayload.VehicleName
                ?? packetPayload.VehicleNumberPlate
                ?? packetPayload.VehicleId?.ToString(System.Globalization.CultureInfo.InvariantCulture),
            OdometerReading = packetPayload.Odometer
        };
    }

    protected override DateTime GetOccurredAtUtc(
        TechnotradePtsPacketContext context,
        PumpTransactionDto packetPayload,
        PumpTransactionMessage canonicalPayload) =>
        canonicalPayload.EndedAtUtc;

    protected override Task PublishAsync(DeviceMessage<PumpTransactionMessage> message, CancellationToken cancellationToken) =>
        Router.PublishPumpTransactionAsync(message, cancellationToken);
}
