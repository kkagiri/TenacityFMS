using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Models.GPSGate;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services
{
    /// <summary>
    /// Service for fetching GPSGate track summary data from the trackinfos endpoint.
    /// </summary>
    public interface IGPSGateTrackInfoService
    {
        /// <summary>
        /// Fetches GPSGate track summaries for a specific device on a date.
        /// </summary>
        Task<List<GPSGateTrackInfo>?> FetchTrackInfosAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Fetches all GPSGate track summaries for a device for an entire day.
        /// </summary>
        Task<List<GPSGateTrackInfo>?> FetchDayTrackInfosAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets summarized track history for a vehicle using the trackinfos endpoint.
        /// </summary>
        Task<FMSResponse<VehicleTrackHistoryDTO>> GetTrackHistoryAsync(
            int vehicleId,
            DateTime from,
            DateTime to,
            int maxPoints = 1000,
            CancellationToken cancellationToken = default);
    }
}