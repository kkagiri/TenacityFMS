/*
 * File:          TechnotradePtsCommandMappingService.cs
 * Purpose:       Builds outbound Technotrade jsonPTS command messages through provider-owned mappers.
 * Dependencies:  FMS.Application.Helpers, FMS.Domain.PTSCommon, Microsoft.Extensions.Logging
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - Map(): Resolves a command mapper and returns the mapped packet.
 * - BuildMessage(): Builds a jsonPTS message from a mapped command.
 */
using FMS.Application.Helpers;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Commands;

public interface ITechnotradePtsCommandMappingService
{
    PtsCommandMapping Map(string commandType, object? commandData);

    PTSMessage BuildMessage(string commandType, object? commandData, string? correlationId = null);
}

public sealed class TechnotradePtsCommandMappingService : ITechnotradePtsCommandMappingService
{
    private readonly IReadOnlyList<IPtsCommandMapper> _mappers;
    private readonly ILogger<TechnotradePtsCommandMappingService> _logger;

    public TechnotradePtsCommandMappingService(
        IEnumerable<IPtsCommandMapper> mappers,
        ILogger<TechnotradePtsCommandMappingService> logger)
    {
        _mappers = mappers.ToList();
        _logger = logger;
    }

    public PtsCommandMapping Map(string commandType, object? commandData)
    {
        var mapper = _mappers.FirstOrDefault(candidate => candidate.CanMap(commandType));
        if (mapper == null)
        {
            _logger.LogDebug(
                "No explicit Technotrade command mapper found for {CommandType}; using pass-through packet type.",
                commandType);

            return new PtsCommandMapping(
                commandType,
                commandType,
                PtsCommandMapperBase.ToJObject(commandData));
        }

        return mapper.TryMap(commandType, commandData);
    }

    public PTSMessage BuildMessage(string commandType, object? commandData, string? correlationId = null)
    {
        var mapping = Map(commandType, commandData);
        var packetId = PacketIdGenerator.GetNextId();

        return new PTSMessage
        {
            PtsId = correlationId,
            Protocol = "jsonPTS",
            Packets = new List<Packet>
            {
                mapping.ToPacket(packetId)
            }
        };
    }
}
