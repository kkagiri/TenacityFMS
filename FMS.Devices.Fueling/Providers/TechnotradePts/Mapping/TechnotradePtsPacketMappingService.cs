/*
 * File:          TechnotradePtsPacketMappingService.cs
 * Purpose:       Resolves Technotrade PTS packet mappers and invokes the canonical
 *                notification publishing pipeline for supported packet types.
 * Dependencies:  FMS.Devices.Abstractions.Common, FMS.Domain.PTSCommon
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - TryMapAndPublishAsync(): Maps and publishes a supported PTS packet.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;

public interface ITechnotradePtsPacketMappingService
{
    Task<bool> TryMapAndPublishAsync(string deviceId, Packet packet, CancellationToken cancellationToken = default);
}

public sealed class TechnotradePtsPacketMappingService : ITechnotradePtsPacketMappingService
{
    private readonly IReadOnlyDictionary<string, IPtsPacketMapper> _mappers;
    private readonly ITenantScope _tenantScope;
    private readonly ILogger<TechnotradePtsPacketMappingService> _logger;

    public TechnotradePtsPacketMappingService(
        IEnumerable<IPtsPacketMapper> mappers,
        ITenantScope tenantScope,
        ILogger<TechnotradePtsPacketMappingService> logger)
    {
        _mappers = mappers.ToDictionary(mapper => mapper.PacketType, StringComparer.OrdinalIgnoreCase);
        _tenantScope = tenantScope;
        _logger = logger;
    }

    public async Task<bool> TryMapAndPublishAsync(string deviceId, Packet packet, CancellationToken cancellationToken = default)
    {
        if (!_mappers.TryGetValue(packet.Type, out var mapper))
        {
            _logger.LogDebug("No Technotrade PTS mapper registered for packet type {PacketType}.", packet.Type);
            return false;
        }

        var context = new TechnotradePtsPacketContext(
            deviceId,
            _tenantScope.HasTenant ? _tenantScope.TenantId : Guid.Empty,
            packet);

        await mapper.MapAndPublishAsync(context, cancellationToken);
        return true;
    }
}
