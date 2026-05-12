/*
 * File:          TechnotradePtsCanonicalPacketProcessor.cs
 * Purpose:       Bridges legacy PTS message processing into the Technotrade canonical
 *                packet mapper for packet types that are safe to cut over.
 * Dependencies:  ICanonicalPtsPacketProcessor, TechnotradePtsPacketMappingService
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - CanProcess(): Limits canonical cutover to packet types with parity-safe handlers.
 * - TryProcessAsync(): Publishes canonical notifications through Technotrade mappers.
 */
using FMS.Application.Features.Devices.Fueling.Services;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public sealed class TechnotradePtsCanonicalPacketProcessor : ICanonicalPtsPacketProcessor
{
    private static readonly HashSet<string> SafeCanonicalPacketTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "UploadPumpTransaction",
        "UploadTankMeasurement",
        "UploadAlertRecord"
    };

    private readonly ITechnotradePtsPacketMappingService _mappingService;
    private readonly ILogger<TechnotradePtsCanonicalPacketProcessor> _logger;

    public TechnotradePtsCanonicalPacketProcessor(
        ITechnotradePtsPacketMappingService mappingService,
        ILogger<TechnotradePtsCanonicalPacketProcessor> logger)
    {
        _mappingService = mappingService;
        _logger = logger;
    }

    public bool CanProcess(string packetType) =>
        SafeCanonicalPacketTypes.Contains(packetType);

    public async Task<bool> TryProcessAsync(string deviceId, Packet packet, CancellationToken cancellationToken = default)
    {
        if (!CanProcess(packet.Type))
        {
            return false;
        }

        var handled = await _mappingService.TryMapAndPublishAsync(deviceId, packet, cancellationToken);
        if (handled)
        {
            _logger.LogDebug(
                "Technotrade canonical processor handled packet {PacketId} of type {PacketType} for device {DeviceId}.",
                packet.Id,
                packet.Type,
                deviceId);
        }

        return handled;
    }
}
