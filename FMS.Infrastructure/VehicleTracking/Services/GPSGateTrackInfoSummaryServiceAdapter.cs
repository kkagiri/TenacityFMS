/**
 * File: GPSGateTrackInfoSummaryServiceAdapter.cs
 * Purpose: Bridges the Infrastructure GPSGate trackinfo client to an Application-level daily summary contract.
 * Dependencies: IGPSGateTrackInfoService, GpsTrackInfoDaySummaryDto
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - GetDaySummaryAsync(): Aggregates GPSGate trackinfo payloads into a single daily distance summary.
 */
using System;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Application.Features.VehicleTracking.Services;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;

namespace FMS.Infrastructure.VehicleTracking.Services
{
    public class GPSGateTrackInfoSummaryServiceAdapter : IGPSGateTrackInfoSummaryService
    {
        private readonly IGPSGateTrackInfoService _trackInfoService;

        public GPSGateTrackInfoSummaryServiceAdapter(IGPSGateTrackInfoService trackInfoService)
        {
            _trackInfoService = trackInfoService ?? throw new ArgumentNullException(nameof(trackInfoService));
        }

        public async Task<GpsTrackInfoDaySummaryDto?> GetDaySummaryAsync(
            string externalDeviceId,
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            var trackInfos = await _trackInfoService.FetchDayTrackInfosAsync(externalDeviceId, date, cancellationToken);
            if (trackInfos == null || trackInfos.Count == 0)
            {
                return null;
            }

            var orderedTrackInfos = trackInfos
                .OrderBy(info => ParseTimestamp(info.BoundingBox?.MinTime) ?? ParseTimestamp(info.Updated) ?? date.Date)
                .ToList();

            var startTime = orderedTrackInfos
                .Select(info => ParseTimestamp(info.BoundingBox?.MinTime) ?? ParseTimestamp(info.Updated))
                .Where(value => value.HasValue)
                .Min();

            var endTime = orderedTrackInfos
                .Select(info => ParseTimestamp(info.BoundingBox?.MaxTime) ?? ParseTimestamp(info.Updated))
                .Where(value => value.HasValue)
                .Max();

            return new GpsTrackInfoDaySummaryDto
            {
                Date = date.Date,
                DistanceKm = ConvertDistanceToKilometers(orderedTrackInfos.Sum(info => info.TotalDistance)),
                PointCount = orderedTrackInfos.Sum(info => info.Count),
                StartTimeUtc = startTime,
                EndTimeUtc = endTime
            };
        }

        private static DateTime? ParseTimestamp(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return DateTime.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var parsed)
                ? parsed
                : null;
        }

        private static decimal ConvertDistanceToKilometers(double totalDistance)
        {
            if (double.IsNaN(totalDistance) || double.IsInfinity(totalDistance) || totalDistance <= 0)
            {
                return 0;
            }

            return decimal.Round((decimal)(totalDistance / 1000d), 2);
        }
    }
}