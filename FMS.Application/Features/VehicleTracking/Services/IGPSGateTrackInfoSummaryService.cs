/**
 * File: IGPSGateTrackInfoSummaryService.cs
 * Purpose: Exposes Application-layer access to daily GPSGate track summaries without depending on Infrastructure contracts.
 * Dependencies: GpsTrackInfoDaySummaryDto
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - GetDaySummaryAsync(): Retrieves a normalized daily track summary for a provider device ID.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTracking.DTOs;

namespace FMS.Application.Features.VehicleTracking.Services
{
    public interface ITrackingTrackInfoSummaryService
    {
        Task<GpsTrackInfoDaySummaryDto?> GetDaySummaryAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default);
    }

    public interface IGPSGateTrackInfoSummaryService : ITrackingTrackInfoSummaryService
    {
    }
}