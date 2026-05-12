/**
 * File: IServerSideDeliveryDetectionService.cs
 * Purpose: Interface for server-side in-tank delivery detection using UploadStatus probe readings
 * Dependencies: ProbeMeasurement
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - ProcessProbeReadingAsync: Processes each probe reading through a state machine to detect deliveries
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus;

namespace FMS.Application.Features.TankManagement.Deliveries.Services
{
    public interface IServerSideDeliveryDetectionService
    {
        /// <summary>
        /// Processes a probe reading from UploadStatus through the delivery detection state machine.
        /// Call this for each tank/probe combination on every UploadStatus packet.
        /// </summary>
        /// <param name="tankId">Database Tank.Id</param>
        /// <param name="probeMeasurement">Probe reading from UploadStatus</param>
        /// <param name="timestamp">Time the UploadStatus was received</param>
        /// <param name="deviceId">PTS device ID (for Intankdelivery.Ptsid)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        Task ProcessProbeReadingAsync(
            int tankId,
            ProbeMeasurement probeMeasurement,
            DateTime timestamp,
            string deviceId,
            CancellationToken cancellationToken = default);
    }
}
