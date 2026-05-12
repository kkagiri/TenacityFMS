/**
 * File: IProbeReadingEnrichmentService.cs
 * Purpose: Handles cadence filtering (Redis dedup) and calibration volume enrichment for probe readings.
 * Dependencies: Redis (IConnectionMultiplexer), GpsdataContext, TankCalibration snapshots
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - ShouldSaveReadingAsync(): Checks Redis to skip duplicate/unchanged readings.
 * - EnrichVolumeFromCalibrationAsync(): Looks up ProductVolume from calibration chart when PTS sends 0.
 * - ResolveProductVolumeAsync(): Chooses the stored ProductVolume based on tank preference, PTS volume, and local calibration.
 * - MarkReadingSavedAsync(): Updates the Redis last-saved cache after persisting a reading.
 */
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.TankManagement.TankMeasurements.Services
{
    public interface IProbeReadingEnrichmentService
    {
        /// <summary>
        /// Returns true if this reading should be persisted, based on height change threshold and max time interval.
        /// </summary>
        Task<bool> ShouldSaveReadingAsync(string deviceId, int tankId, double? productHeight, CancellationToken cancellationToken = default);

        /// <summary>
        /// After persisting a reading, update Redis cache with the saved height and timestamp.
        /// </summary>
        Task MarkReadingSavedAsync(string deviceId, int tankId, double? productHeight);

        /// <summary>
        /// If ProductVolume is 0 or null, attempt to derive it from the tank's calibration chart using linear interpolation.
        /// Returns the calculated volume in liters, or null if no calibration data is available.
        /// </summary>
        Task<double?> EnrichVolumeFromCalibrationAsync(int tankId, int? probeNumber, string? preferredChartSource, double? productHeightMm, CancellationToken cancellationToken = default);

        /// <summary>
        /// Chooses the ProductVolume that should be persisted for an UploadStatus reading.
        /// Respects tank preference for trusting PTS volume versus preferring locally calibrated height-to-volume.
        /// </summary>
        Task<double?> ResolveProductVolumeAsync(
            int tankId,
            int? probeNumber,
            string? preferredProductVolumeSource,
            string? preferredChartSource,
            double? incomingProductVolume,
            double? productHeightMm,
            CancellationToken cancellationToken = default);
    }
}
