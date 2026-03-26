/**
 * File: IUploadStatusProbeProcessingService.cs
 * Purpose: Processes UploadStatus probe measurements and probe alarms outside the hot SignalR broadcast path.
 * Dependencies: UploadStatus probe models, tank measurement services
 * Last Modified: 2026-03-26
 *
 * Key Functions:
 * - ProcessAsync(): Persists probe readings, updates physical stock, and raises probe alarms for one UploadStatus payload.
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus;

namespace FMS.Application.Features.TankManagement.TankMeasurements.Services
{
    public interface IUploadStatusProbeProcessingService
    {
        Task ProcessAsync(string deviceId, ProbeStatus probeStatus, CancellationToken cancellationToken = default);
    }
}