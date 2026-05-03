/*
 * File:          ICanonicalPtsPacketProcessor.cs
 * Purpose:       Defines the optional bridge used by the legacy PTS message processor
 *                to route supported packets into canonical device notifications.
 * Dependencies:  FMS.Domain.PTSCommon
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - CanProcess(): Indicates whether a packet type is safe for canonical processing.
 * - TryProcessAsync(): Processes a supported packet through a canonical provider pipeline.
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.PTSCommon;

namespace FMS.Application.Features.Devices.Fueling.Services;

public interface ICanonicalPtsPacketProcessor
{
    bool CanProcess(string packetType);

    Task<bool> TryProcessAsync(string deviceId, Packet packet, CancellationToken cancellationToken = default);
}
