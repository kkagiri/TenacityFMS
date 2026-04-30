/*
 * File:          FuelingMessages.cs
 * Purpose:       Canonical fueling payload types carried inside DeviceMessage<T> envelopes.
 *                Vendor-specific shapes are translated to these types by per-vendor mappers.
 * Dependencies:  None
 * Last Modified: 2026-04-29
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

/// <summary>Upload-status / heartbeat record reported by a fueling controller.</summary>
public sealed class UploadStatusMessage
{
    public required string StatusCode { get; init; }
    public required DateTime ObservedAtUtc { get; init; }
    public string? FirmwareVersion { get; init; }
    public string? Description { get; init; }
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
