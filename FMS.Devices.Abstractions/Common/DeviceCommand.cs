/*
 * File:          DeviceCommand.cs
 * Purpose:       Canonical command envelope and result for outbound device commands
 *                (e.g. pump authorize, close transaction, system command).
 * Dependencies:  None
 * Last Modified: 2026-04-29
 */
using System;
using System.Collections.Generic;

namespace FMS.Devices.Abstractions.Common;

/// <summary>
/// Outbound command from FMS business code to a device, dispatched via a provider plugin
/// channel implementation (e.g. RedisPtsCommandChannel).
/// </summary>
public sealed class DeviceCommand<TPayload>
    where TPayload : class
{
    public required Guid TenantId { get; init; }
    public required string ProviderName { get; init; }
    public required string ExternalDeviceId { get; init; }
    public required string CommandType { get; init; }
    public required TPayload Payload { get; init; }
    public Guid CorrelationId { get; init; } = Guid.NewGuid();
    public DateTime IssuedAtUtc { get; init; } = DateTime.UtcNow;
    public IReadOnlyDictionary<string, string>? Headers { get; init; }
}

/// <summary>
/// Outcome returned by a device-command channel.
/// </summary>
public sealed class DeviceCommandResult
{
    public required bool Success { get; init; }
    public required Guid CorrelationId { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public IReadOnlyDictionary<string, string>? Metadata { get; init; }

    public static DeviceCommandResult Ok(Guid correlationId, IReadOnlyDictionary<string, string>? metadata = null) =>
        new() { Success = true, CorrelationId = correlationId, Metadata = metadata };

    public static DeviceCommandResult Fail(Guid correlationId, string code, string message) =>
        new() { Success = false, CorrelationId = correlationId, ErrorCode = code, ErrorMessage = message };
}
