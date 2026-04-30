/*
 * File:          DeviceMessage.cs
 * Purpose:       Canonical envelope used by DeviceMessageRouter to carry vendor-neutral
 *                payloads from a provider plugin to MediatR notifications.
 * Dependencies:  None
 * Last Modified: 2026-04-29
 */
using System;
using System.Collections.Generic;

namespace FMS.Devices.Abstractions.Common;

/// <summary>
/// Vendor-neutral envelope. Provider plugins translate vendor-specific payloads into
/// <c>DeviceMessage&lt;TPayload&gt;</c> instances; <c>DeviceMessageRouter</c> publishes
/// strongly-typed MediatR notifications carrying these envelopes.
/// </summary>
/// <typeparam name="TPayload">Canonical payload type (e.g. PumpTransactionMessage).</typeparam>
public sealed class DeviceMessage<TPayload>
    where TPayload : class
{
    public required Guid TenantId { get; init; }
    public required string ProviderName { get; init; }
    public required string ExternalDeviceId { get; init; }
    public required DateTime OccurredAtUtc { get; init; }
    public required TPayload Payload { get; init; }
    public IReadOnlyDictionary<string, string>? Headers { get; init; }
}
