/*
 * File:          TechnotradePtsPacketMapperTests.cs
 * Purpose:       Verifies Technotrade PTS packet mappers translate captured-style
 *                packet payloads into canonical fueling DeviceMessage envelopes.
 * Dependencies:  FMS.Devices.Fueling, FMS.Devices.Core, FMS.Application PTS DTOs
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - UploadPumpTransaction_maps_packet_sample_to_canonical_message(): Covers pump transactions.
 * - UploadTankMeasurement_maps_packet_sample_to_canonical_message(): Covers tank readings.
 * - UploadInTankDelivery_maps_packet_sample_to_canonical_message(): Covers in-tank deliveries.
 * - UploadStatus_maps_packet_sample_to_canonical_message(): Covers controller heartbeat status.
 * - UploadAlertRecord_maps_packet_sample_to_canonical_message(): Covers alert records.
 * - Pump_response_mappers_map_packet_samples_to_canonical_message(): Covers pump command responses.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Handlers;
using FMS.Application.Features.PTS;
using FMS.Application.ModelsDTOs.PTS;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;
using FMS.Devices.Core.Routing;
using FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;
using FMS.Domain.Entities.PTS.PTSStatus;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging.Abstractions;
using Newtonsoft.Json.Linq;
using Xunit;

namespace FMS.Testing.Devices;

public sealed class TechnotradePtsPacketMapperTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private const string DeviceId = "PTS-001";

    [Fact]
    public async Task UploadPumpTransaction_maps_packet_sample_to_canonical_message()
    {
        var router = new CapturingDeviceMessageRouter();
        var mapper = new UploadPumpTransactionMapper(router, NullLogger<UploadPumpTransactionMapper>.Instance);
        var endedAt = new DateTime(2026, 5, 10, 8, 45, 0, DateTimeKind.Utc);
        var startedAt = endedAt.AddMinutes(-6);
        var packet = CreatePacket(mapper.PacketType, 101, new PumpTransactionDto
        {
            DateTimeStart = startedAt,
            DateTime = endedAt,
            Pump = 2,
            Nozzle = 1,
            FuelGradeId = 5,
            FuelGradeName = "Diesel 50ppm",
            Transaction = 7890,
            Volume = 42.75m,
            Amount = 641.25m,
            Price = 15.00m,
            Tag = "CARD-44",
            DriverName = "Driver A",
            VehicleName = "VH-100",
            Odometer = 123456.7m
        });

        await mapper.MapAndPublishAsync(new TechnotradePtsPacketContext(DeviceId, TenantId, packet));

        var message = Assert.NotNull(router.PumpTransaction);
        AssertEnvelope(message, mapper.PacketType, 101, endedAt);
        Assert.Equal("7890", message.Payload.ExternalTransactionId);
        Assert.Equal(2, message.Payload.PumpNumber);
        Assert.Equal(1, message.Payload.NozzleNumber);
        Assert.Equal("Diesel 50ppm", message.Payload.FuelGrade);
        Assert.Equal(42.75m, message.Payload.Volume);
        Assert.Equal(641.25m, message.Payload.Amount);
        Assert.Equal(15.00m, message.Payload.UnitPrice);
        Assert.Equal(startedAt, message.Payload.StartedAtUtc);
        Assert.Equal(endedAt, message.Payload.EndedAtUtc);
        Assert.Equal("CARD-44", message.Payload.CardCode);
        Assert.Equal("Driver A", message.Payload.DriverCode);
        Assert.Equal("VH-100", message.Payload.VehicleCode);
        Assert.Equal(123456.7m, message.Payload.OdometerReading);
    }

    [Fact]
    public async Task UploadTankMeasurement_maps_packet_sample_to_canonical_message()
    {
        var router = new CapturingDeviceMessageRouter();
        var mapper = new UploadTankMeasurementMapper(router, NullLogger<UploadTankMeasurementMapper>.Instance);
        var readingAt = new DateTime(2026, 5, 10, 9, 15, 0, DateTimeKind.Utc);
        var packet = CreatePacket(mapper.PacketType, 202, new TankMeasurementDto
        {
            DateTime = readingAt,
            Tank = 3,
            FuelGradeId = 7,
            ProductVolume = 12500.5,
            ProductUllage = 2499.5,
            ProductHeight = 1400.25,
            WaterHeight = 12.5,
            Temperature = 22.75,
            ProductDensity = 835.2
        });

        await mapper.MapAndPublishAsync(new TechnotradePtsPacketContext(DeviceId, TenantId, packet));

        var message = Assert.NotNull(router.TankMeasurement);
        AssertEnvelope(message, mapper.PacketType, 202, readingAt);
        Assert.Equal(3, message.Payload.TankNumber);
        Assert.Equal("7", message.Payload.FuelGrade);
        Assert.Equal(12500.5m, message.Payload.VolumeLitres);
        Assert.Equal(2499.5m, message.Payload.UllageLitres);
        Assert.Equal(1400.25m, message.Payload.ProductLevelMm);
        Assert.Equal(12.5m, message.Payload.WaterLevelMm);
        Assert.Equal(22.75m, message.Payload.TemperatureCelsius);
        Assert.Equal(835.2m, message.Payload.DensityKgPerM3);
        Assert.Equal(readingAt, message.Payload.ReadingAtUtc);
    }

    [Fact]
    public async Task UploadInTankDelivery_maps_packet_sample_to_canonical_message()
    {
        var router = new CapturingDeviceMessageRouter();
        var mapper = new UploadInTankDeliveryMapper(router, NullLogger<UploadInTankDeliveryMapper>.Instance);
        var startedAt = new DateTime(2026, 5, 10, 9, 30, 0, DateTimeKind.Utc);
        var endedAt = new DateTime(2026, 5, 10, 9, 48, 0, DateTimeKind.Utc);
        var packet = CreatePacket(mapper.PacketType, 252, new InTankDeliveryDto
        {
            Tank = 4,
            FuelGradeId = 8,
            FuelGradeName = "ULP95",
            StartValues = new InTankDeliveryValuesDto
            {
                DateTime = startedAt,
                ProductHeight = 1150.5f,
                WaterHeight = 8.5f,
                Temperature = 21.25f,
                ProductVolume = 9800.25f
            },
            EndValues = new InTankDeliveryValuesDto
            {
                DateTime = endedAt,
                ProductHeight = 1495.75f,
                WaterHeight = 8.75f,
                Temperature = 21.5f,
                ProductVolume = 13725.5f,
                ProductDensity = 746.8f
            },
            AbsoluteValues = new InTankDeliveryAbsoluteValuesDto
            {
                ProductVolume = 3925.25f,
                ProductDensity = 746.8f,
                PumpsDispensedVolume = 125.5f
            }
        });

        await mapper.MapAndPublishAsync(new TechnotradePtsPacketContext(DeviceId, TenantId, packet));

        var message = Assert.NotNull(router.InTankDelivery);
        AssertEnvelope(message, mapper.PacketType, 252, endedAt);
        Assert.Equal(4, message.Payload.TankNumber);
        Assert.Equal("ULP95", message.Payload.FuelGrade);
        Assert.Equal(startedAt, message.Payload.StartedAtUtc);
        Assert.Equal(endedAt, message.Payload.EndedAtUtc);
        Assert.Equal(9800.25m, message.Payload.StartProductVolumeLitres.GetValueOrDefault(), 2);
        Assert.Equal(13725.5m, message.Payload.EndProductVolumeLitres.GetValueOrDefault(), 2);
        Assert.Equal(3925.25m, message.Payload.DeliveredVolumeLitres.GetValueOrDefault(), 2);
        Assert.Equal(1150.5m, message.Payload.StartProductLevelMm.GetValueOrDefault(), 2);
        Assert.Equal(1495.75m, message.Payload.EndProductLevelMm.GetValueOrDefault(), 2);
        Assert.Equal(8.5m, message.Payload.StartWaterLevelMm.GetValueOrDefault(), 2);
        Assert.Equal(8.75m, message.Payload.EndWaterLevelMm.GetValueOrDefault(), 2);
        Assert.Equal(21.25m, message.Payload.StartTemperatureCelsius.GetValueOrDefault(), 2);
        Assert.Equal(21.5m, message.Payload.EndTemperatureCelsius.GetValueOrDefault(), 2);
        Assert.Equal(746.8m, message.Payload.ProductDensityKgPerM3.GetValueOrDefault(), 2);
        Assert.Equal(125.5m, message.Payload.PumpsDispensedVolumeLitres.GetValueOrDefault(), 2);
    }

    [Fact]
    public async Task UploadStatus_maps_packet_sample_to_canonical_message()
    {
        var router = new CapturingDeviceMessageRouter();
        var mapper = new UploadStatusMapper(router, NullLogger<UploadStatusMapper>.Instance);
        var observedAt = new DateTime(2026, 5, 10, 10, 0, 0, DateTimeKind.Utc);
        var firmwareAt = new DateTime(2026, 4, 30, 12, 30, 0, DateTimeKind.Utc);
        var packet = CreatePacket(mapper.PacketType, 303, new UploadStatus
        {
            DateTime = observedAt,
            FirmwareDateTime = firmwareAt,
            StartupSeconds = 86400,
            BatteryVoltage = 12200,
            CpuTemperature = 42,
            SdMounted = true
        });

        await mapper.MapAndPublishAsync(new TechnotradePtsPacketContext(DeviceId, TenantId, packet));

        var message = Assert.NotNull(router.UploadStatus);
        AssertEnvelope(message, mapper.PacketType, 303, observedAt);
        Assert.Equal("Online", message.Payload.StatusCode);
        Assert.Equal(observedAt, message.Payload.ObservedAtUtc);
        Assert.Equal(firmwareAt.ToString("O"), message.Payload.FirmwareVersion);
        Assert.Contains("StartupSeconds=86400", message.Payload.Description);
        Assert.Contains("BatteryVoltage=12200", message.Payload.Description);
        Assert.Contains("CpuTemperature=42", message.Payload.Description);
        Assert.Contains("SdMounted=True", message.Payload.Description);
    }

    [Fact]
    public async Task UploadAlertRecord_maps_packet_sample_to_canonical_message()
    {
        var router = new CapturingDeviceMessageRouter();
        var mapper = new UploadAlertRecordMapper(router, NullLogger<UploadAlertRecordMapper>.Instance);
        var raisedAt = new DateTime(2026, 5, 10, 11, 5, 0, DateTimeKind.Utc);
        var packet = CreatePacket(mapper.PacketType, 404, new AlertRecordDto
        {
            DateTime = raisedAt,
            DeviceType = "Probe",
            DeviceNumber = 4,
            State = "Active",
            Code = 91,
            ConfigurationId = "cfg-01"
        });

        await mapper.MapAndPublishAsync(new TechnotradePtsPacketContext(DeviceId, TenantId, packet));

        var message = Assert.NotNull(router.AlertRecord);
        AssertEnvelope(message, mapper.PacketType, 404, raisedAt);
        Assert.Equal("91", message.Payload.AlertCode);
        Assert.Equal("Active", message.Payload.Severity);
        Assert.Equal(raisedAt, message.Payload.RaisedAtUtc);
        Assert.Equal("Probe:4", message.Payload.Source);
        Assert.Contains("ConfigurationId=cfg-01", message.Payload.Description);
        Assert.Contains("State=Active", message.Payload.Description);
    }

    [Theory]
    [MemberData(nameof(PumpResponseMapperSamples))]
    public async Task Pump_response_mappers_map_packet_samples_to_canonical_message(
        IPtsPacketMapper mapper,
        Packet packet,
        int? expectedPump,
        int? expectedTransaction,
        string? expectedStatus)
    {
        var router = new CapturingDeviceMessageRouter();
        mapper = RecreatePumpResponseMapper(mapper.PacketType, router);

        await mapper.MapAndPublishAsync(new TechnotradePtsPacketContext(DeviceId, TenantId, packet));

        var message = Assert.NotNull(router.PumpResponse);
        AssertEnvelope(message, mapper.PacketType, packet.Id, message.OccurredAtUtc);
        Assert.Equal(mapper.PacketType, message.Payload.PacketType);
        Assert.Equal(packet.Id, message.Payload.PacketId);
        Assert.Equal(packet.Error == true, message.Payload.IsError);
        Assert.Equal(expectedPump, message.Payload.PumpNumber);
        Assert.Equal(expectedTransaction, message.Payload.TransactionId);
        Assert.Equal(expectedStatus, message.Payload.StatusType ?? message.Payload.State);
    }

    public static TheoryData<IPtsPacketMapper, Packet, int?, int?, string?> PumpResponseMapperSamples() =>
        new()
        {
            {
                new PumpAuthorizeResponseMapper(new CapturingDeviceMessageRouter(), NullLogger<PumpAuthorizeResponseMapper>.Instance),
                CreatePacket("PumpAuthorize", 501, new { Pump = 1, Transaction = 7001 }),
                1,
                7001,
                null
            },
            {
                new PumpAuthorizeConfirmationMapper(new CapturingDeviceMessageRouter(), NullLogger<PumpAuthorizeConfirmationMapper>.Instance),
                CreatePacket("PumpAuthorizeConfirmation", 502, new { Pump = 2, Transaction = 7002 }),
                2,
                7002,
                null
            },
            {
                new PumpCloseTransactionMapper(new CapturingDeviceMessageRouter(), NullLogger<PumpCloseTransactionMapper>.Instance),
                CreatePacket("PumpCloseTransaction", 503, new { Pump = 3, Transaction = 7003 }),
                3,
                7003,
                null
            },
            {
                new PumpCloseTransactionResponseMapper(new CapturingDeviceMessageRouter(), NullLogger<PumpCloseTransactionResponseMapper>.Instance),
                CreatePacket("PumpCloseTransactionResponse", 504, new { Pump = 4, Transaction = 7004, Success = true }),
                4,
                7004,
                null
            },
            {
                new PumpEndOfTransactionStatusMapper(new CapturingDeviceMessageRouter(), NullLogger<PumpEndOfTransactionStatusMapper>.Instance),
                CreatePacket("PumpEndOfTransactionStatus", 505, new { Pump = 5, Transaction = 7005, Volume = 12.5m, Amount = 250m }),
                5,
                7005,
                null
            },
            {
                new PumpGetStatusResponseMapper(new CapturingDeviceMessageRouter(), NullLogger<PumpGetStatusResponseMapper>.Instance),
                CreatePacket("PumpGetStatusResponse", 506, new { Pump = 6, Type = "PumpFillingStatus", Transaction = 7006 }),
                6,
                7006,
                "PumpFillingStatus"
            },
            {
                new PumpTransactionInformationMapper(new CapturingDeviceMessageRouter(), NullLogger<PumpTransactionInformationMapper>.Instance),
                CreatePacket("PumpTransactionInformation", 507, new { Pump = 7, Transaction = 7007, State = "Filling", Nozzle = 1 }),
                7,
                7007,
                "Filling"
            }
        };

    private static IPtsPacketMapper RecreatePumpResponseMapper(string packetType, CapturingDeviceMessageRouter router) =>
        packetType switch
        {
            "PumpAuthorize" => new PumpAuthorizeResponseMapper(router, NullLogger<PumpAuthorizeResponseMapper>.Instance),
            "PumpAuthorizeConfirmation" => new PumpAuthorizeConfirmationMapper(router, NullLogger<PumpAuthorizeConfirmationMapper>.Instance),
            "PumpCloseTransaction" => new PumpCloseTransactionMapper(router, NullLogger<PumpCloseTransactionMapper>.Instance),
            "PumpCloseTransactionResponse" => new PumpCloseTransactionResponseMapper(router, NullLogger<PumpCloseTransactionResponseMapper>.Instance),
            "PumpEndOfTransactionStatus" => new PumpEndOfTransactionStatusMapper(router, NullLogger<PumpEndOfTransactionStatusMapper>.Instance),
            "PumpGetStatusResponse" => new PumpGetStatusResponseMapper(router, NullLogger<PumpGetStatusResponseMapper>.Instance),
            "PumpTransactionInformation" => new PumpTransactionInformationMapper(router, NullLogger<PumpTransactionInformationMapper>.Instance),
            _ => throw new ArgumentOutOfRangeException(nameof(packetType), packetType, null)
        };

    private static Packet CreatePacket(string packetType, int packetId, object data) =>
        new()
        {
            Id = packetId,
            Type = packetType,
            Data = JToken.FromObject(data)
        };

    private static void AssertEnvelope<TPayload>(
        DeviceMessage<TPayload> message,
        string packetType,
        int packetId,
        DateTime occurredAtUtc)
        where TPayload : class
    {
        Assert.Equal(TenantId, message.TenantId);
        Assert.Equal("TechnotradePTS", message.ProviderName);
        Assert.Equal(DeviceId, message.ExternalDeviceId);
        Assert.Equal(occurredAtUtc, message.OccurredAtUtc);
        Assert.NotNull(message.Headers);
        Assert.Equal(packetId.ToString(System.Globalization.CultureInfo.InvariantCulture), message.Headers!["packetId"]);
        Assert.Equal(packetType, message.Headers["packetType"]);
    }

    private sealed class CapturingDeviceMessageRouter : IDeviceMessageRouter
    {
        public DeviceMessage<PumpTransactionMessage>? PumpTransaction { get; private set; }
        public DeviceMessage<TankMeasurementMessage>? TankMeasurement { get; private set; }
        public DeviceMessage<InTankDeliveryMessage>? InTankDelivery { get; private set; }
        public DeviceMessage<UploadStatusMessage>? UploadStatus { get; private set; }
        public DeviceMessage<AlertRecordMessage>? AlertRecord { get; private set; }
        public DeviceMessage<PumpResponseMessage>? PumpResponse { get; private set; }

        public Task PublishPumpTransactionAsync(DeviceMessage<PumpTransactionMessage> message, CancellationToken cancellationToken = default)
        {
            PumpTransaction = message;
            return Task.CompletedTask;
        }

        public Task PublishTankMeasurementAsync(DeviceMessage<TankMeasurementMessage> message, CancellationToken cancellationToken = default)
        {
            TankMeasurement = message;
            return Task.CompletedTask;
        }

        public Task PublishInTankDeliveryAsync(DeviceMessage<InTankDeliveryMessage> message, CancellationToken cancellationToken = default)
        {
            InTankDelivery = message;
            return Task.CompletedTask;
        }

        public Task PublishUploadStatusAsync(DeviceMessage<UploadStatusMessage> message, CancellationToken cancellationToken = default)
        {
            UploadStatus = message;
            return Task.CompletedTask;
        }

        public Task PublishAlertRecordAsync(DeviceMessage<AlertRecordMessage> message, CancellationToken cancellationToken = default)
        {
            AlertRecord = message;
            return Task.CompletedTask;
        }

        public Task PublishPumpResponseAsync(DeviceMessage<PumpResponseMessage> message, CancellationToken cancellationToken = default)
        {
            PumpResponse = message;
            return Task.CompletedTask;
        }
    }
}
