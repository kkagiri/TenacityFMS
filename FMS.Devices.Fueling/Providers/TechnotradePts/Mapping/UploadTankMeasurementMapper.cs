/*
 * File:          UploadTankMeasurementMapper.cs
 * Purpose:       Maps Technotrade UploadTankMeasurement packets into canonical tank
 *                measurement notifications.
 * Dependencies:  FMS.Application.ModelsDTOs.PTS, FMS.Devices.Core.Routing
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - BuildPayload(): Converts TankMeasurementDto into TankMeasurementMessage.
 */
using FMS.Application.ModelsDTOs.PTS;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;
using FMS.Devices.Core.Routing;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class UploadTankMeasurementMapper
    : PtsPacketMapperBase<TankMeasurementDto, TankMeasurementMessage>
{
    public UploadTankMeasurementMapper(
        IDeviceMessageRouter router,
        ILogger<UploadTankMeasurementMapper> logger)
        : base(router, logger)
    {
    }

    public override string PacketType => "UploadTankMeasurement";

    protected override TankMeasurementMessage BuildPayload(TechnotradePtsPacketContext context, TankMeasurementDto packetPayload)
    {
        if (string.IsNullOrWhiteSpace(packetPayload.PtsId))
        {
            packetPayload.PtsId = context.DeviceId;
        }

        if (packetPayload.PacketId <= 0)
        {
            packetPayload.PacketId = context.Packet.Id;
        }

        return new TankMeasurementMessage
        {
            TankNumber = packetPayload.Tank,
            FuelGrade = packetPayload.FuelGradeName ?? NumberOrUnknown(packetPayload.FuelGradeId),
            VolumeLitres = ToDecimal(packetPayload.ProductVolume) ?? 0m,
            UllageLitres = ToDecimal(packetPayload.ProductUllage),
            ProductLevelMm = ToDecimal(packetPayload.ProductHeight),
            WaterLevelMm = ToDecimal(packetPayload.WaterHeight),
            TemperatureCelsius = ToDecimal(packetPayload.Temperature),
            DensityKgPerM3 = ToDecimal(packetPayload.ProductDensity),
            ReadingAtUtc = ToUtc(packetPayload.DateTime)
        };
    }

    protected override DateTime GetOccurredAtUtc(
        TechnotradePtsPacketContext context,
        TankMeasurementDto packetPayload,
        TankMeasurementMessage canonicalPayload) =>
        canonicalPayload.ReadingAtUtc;

    protected override Task PublishAsync(DeviceMessage<TankMeasurementMessage> message, CancellationToken cancellationToken) =>
        Router.PublishTankMeasurementAsync(message, cancellationToken);
}
