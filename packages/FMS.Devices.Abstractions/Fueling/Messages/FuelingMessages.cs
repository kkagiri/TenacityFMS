/*
 * File:          FuelingMessages.cs
 * Purpose:       Canonical fueling payload types carried inside DeviceMessage<T> envelopes.
 *                Vendor-specific shapes are translated to these types by per-vendor mappers.
 * Dependencies:  None
 * Last Modified: 2026-05-10
 */
using System;

namespace FMS.Devices.Abstractions.Fueling.Messages;

// ---------- Inbound canonical messages ----------

/// <summary>Pump dispensing transaction reported by a fueling controller.</summary>
public sealed class PumpTransactionMessage
{
    public required string ExternalTransactionId { get; init; }
    public required int PumpNumber { get; init; }
    public required int NozzleNumber { get; init; }
    public required string FuelGrade { get; init; }
    public required decimal Volume { get; init; }
    public required decimal Amount { get; init; }
    public required decimal UnitPrice { get; init; }
    public required DateTime StartedAtUtc { get; init; }
    public required DateTime EndedAtUtc { get; init; }
    public string? CardCode { get; init; }
    public string? DriverCode { get; init; }
    public string? VehicleCode { get; init; }
    public decimal? OdometerReading { get; init; }
}

/// <summary>Tank measurement (ATG-style) reading.</summary>
public sealed class TankMeasurementMessage
{
    public required int TankNumber { get; init; }
    public required string FuelGrade { get; init; }
    public required decimal VolumeLitres { get; init; }
    public decimal? UllageLitres { get; init; }
    public decimal? ProductLevelMm { get; init; }
    public decimal? WaterLevelMm { get; init; }
    public decimal? TemperatureCelsius { get; init; }
    public decimal? DensityKgPerM3 { get; init; }
    public required DateTime ReadingAtUtc { get; init; }
}

/// <summary>In-tank delivery detected by a fueling controller.</summary>
public sealed class InTankDeliveryMessage
{
    public required int TankNumber { get; init; }
    public required string FuelGrade { get; init; }
    public required DateTime StartedAtUtc { get; init; }
    public required DateTime EndedAtUtc { get; init; }
    public decimal? StartProductVolumeLitres { get; init; }
    public decimal? EndProductVolumeLitres { get; init; }
    public decimal? DeliveredVolumeLitres { get; init; }
    public decimal? StartProductLevelMm { get; init; }
    public decimal? EndProductLevelMm { get; init; }
    public decimal? StartWaterLevelMm { get; init; }
    public decimal? EndWaterLevelMm { get; init; }
    public decimal? StartTemperatureCelsius { get; init; }
    public decimal? EndTemperatureCelsius { get; init; }
    public decimal? ProductDensityKgPerM3 { get; init; }
    public decimal? PumpsDispensedVolumeLitres { get; init; }
}

/// <summary>Upload-status / heartbeat record reported by a fueling controller.</summary>
public sealed class UploadStatusMessage
{
    public required string StatusCode { get; init; }
    public required DateTime ObservedAtUtc { get; init; }
    public string? FirmwareVersion { get; init; }
    public string? Description { get; init; }
    public int? PumpStatusCount { get; init; }
    public int? ProbeStatusCount { get; init; }
    public string? RawPayloadJson { get; init; }
}

/// <summary>Alert / alarm record reported by a fueling controller.</summary>
public sealed class AlertRecordMessage
{
    public required string AlertCode { get; init; }
    public required string Severity { get; init; }
    public required DateTime RaisedAtUtc { get; init; }
    public string? Source { get; init; }
    public string? Description { get; init; }
}

/// <summary>Response or status packet returned by a pump command path.</summary>
public sealed class PumpResponseMessage
{
    public required string PacketType { get; init; }
    public required int PacketId { get; init; }
    public required DateTime ObservedAtUtc { get; init; }
    public bool IsError { get; init; }
    public int? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public int? PumpNumber { get; init; }
    public int? TransactionId { get; init; }
    public int? NozzleNumber { get; init; }
    public string? StatusType { get; init; }
    public string? State { get; init; }
    public string? FuelGrade { get; init; }
    public decimal? Volume { get; init; }
    public decimal? Amount { get; init; }
    public bool? Success { get; init; }
    public string? RawDataJson { get; init; }
}

// ---------- Outbound command payloads ----------

public sealed class PumpAuthorizePayload
{
    public required int PumpNumber { get; init; }
    public required int NozzleNumber { get; init; }
    public decimal? PresetVolume { get; init; }
    public decimal? PresetAmount { get; init; }
    public string? CardCode { get; init; }
    public string? DriverCode { get; init; }
    public string? VehicleCode { get; init; }
}

public sealed class PumpCloseTransactionPayload
{
    public required int PumpNumber { get; init; }
    public string? Reason { get; init; }
}

public sealed class TankProbeRequestPayload
{
    public required int TankNumber { get; init; }
}

public sealed class UploadStatusRequestPayload
{
    public string? Filter { get; init; }
}
