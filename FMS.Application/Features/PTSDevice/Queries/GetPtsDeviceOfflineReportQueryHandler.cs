/**
 * File: GetPtsDeviceOfflineReportQueryHandler.cs
 * Purpose: Build daily offline report summaries for PTS devices
 * Dependencies: MediatR, EntityFrameworkCore, FMSResponse
 * Last Modified: 2026-01-17
 *
 * Key Classes:
 * - GetPtsDeviceOfflineReportQueryHandler: CQRS handler for offline report
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.PTSDevice.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTSDevice.Queries
{
    public class GetPtsDeviceOfflineReportQueryHandler
        : IRequestHandler<GetPtsDeviceOfflineReportQuery, FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetPtsDeviceOfflineReportQueryHandler> _logger;

        public GetPtsDeviceOfflineReportQueryHandler(
            GpsdataContext context,
            ILogger<GetPtsDeviceOfflineReportQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>> Handle(
            GetPtsDeviceOfflineReportQuery request,
            CancellationToken cancellationToken)
        {
            if (request.StartDate == default || request.EndDate == default)
            {
                return FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>.Failed(
                    "StartDate and EndDate are required.");
            }

            if (request.EndDate < request.StartDate)
            {
                return FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>.Failed(
                    "EndDate must be greater than or equal to StartDate.");
            }

            // Use local time for date comparisons since database stores local times
            var startDate = request.StartDate.Date;
            var endExclusive = request.EndDate.Date.AddDays(1);
            var nowLocal = DateTime.Now; // Use local time to match database times

            var devicesQuery = _context.Ptsdevices
                .AsNoTracking()
                .Include(d => d.SiteNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.DeviceId))
            {
                devicesQuery = devicesQuery.Where(d => d.Ptsid == request.DeviceId);
            }

            var devices = await devicesQuery
                .Select(d => new
                {
                    d.Ptsid,
                    d.PtsName,
                    SiteName = d.SiteNavigation != null ? d.SiteNavigation.Name : null,
                    d.ConnectionStatus
                })
                .ToListAsync(cancellationToken);

            if (devices.Count == 0)
            {
                return FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>.Success(
                    new List<PtsDeviceOfflineDailySummaryDto>(),
                    "No devices found for the requested criteria.");
            }

            var deviceIds = devices.Select(d => d.Ptsid).ToList();

            var connections = await _context.DeviceConnections
                .AsNoTracking()
                .Where(c => deviceIds.Contains(c.PtsdeviceId) && c.ConnectedAt < endExclusive)
                .OrderBy(c => c.PtsdeviceId)
                .ThenBy(c => c.ConnectedAt)
                .ToListAsync(cancellationToken);

            var deviceMetadata = devices.ToDictionary(
                d => d.Ptsid,
                d => (d.PtsName, d.SiteName, d.ConnectionStatus));

            var summaryMap = new Dictionary<(string DeviceId, DateTime Date), PtsDeviceOfflineDailySummaryDto>();

            foreach (var deviceId in deviceIds)
            {
                if (!deviceMetadata.TryGetValue(deviceId, out var meta))
                {
                    continue;
                }

                var deviceConnections = connections
                    .Where(c => c.PtsdeviceId == deviceId)
                    .OrderBy(c => c.ConnectedAt)
                    .ToList();

                if (deviceConnections.Count == 0)
                {
                    continue;
                }

                for (var i = 0; i < deviceConnections.Count; i++)
                {
                    var current = deviceConnections[i];
                    if (!current.DisconnectedAt.HasValue)
                    {
                        continue;
                    }

                    // Offline period starts when this session disconnected
                    var offlineStart = current.DisconnectedAt.Value;
                    DateTime offlineEnd;

                    if (i + 1 < deviceConnections.Count)
                    {
                        // Offline ends when the next session connected
                        offlineEnd = deviceConnections[i + 1].ConnectedAt;
                    }
                    else if (!string.IsNullOrWhiteSpace(meta.ConnectionStatus) &&
                             meta.ConnectionStatus.Equals("Disconnected", StringComparison.OrdinalIgnoreCase))
                    {
                        // Device is still offline - use current time
                        offlineEnd = nowLocal;
                    }
                    else
                    {
                        // No next connection and device is online - skip (no offline period)
                        continue;
                    }

                    if (offlineEnd <= offlineStart)
                    {
                        continue;
                    }

                    var intervalStart = offlineStart < startDate ? startDate : offlineStart;
                    var intervalEnd = offlineEnd > endExclusive ? endExclusive : offlineEnd;

                    if (intervalEnd <= intervalStart)
                    {
                        continue;
                    }

                    var countDate = offlineStart.Date;
                    var shouldCount = countDate >= startDate && countDate < endExclusive;
                    var counted = false;

                    var segmentStart = intervalStart;
                    while (segmentStart < intervalEnd)
                    {
                        var day = segmentStart.Date;
                        var dayEnd = day.AddDays(1);
                        var segmentEnd = intervalEnd < dayEnd ? intervalEnd : dayEnd;
                        var durationSeconds = (int)Math.Round((segmentEnd - segmentStart).TotalSeconds);

                        var incrementCount = shouldCount && !counted && day == countDate;

                        AddSegment(
                            summaryMap,
                            deviceId,
                            meta.PtsName,
                            meta.SiteName,
                            day,
                            segmentStart,
                            segmentEnd,
                            durationSeconds,
                            incrementCount);

                        if (incrementCount)
                        {
                            counted = true;
                        }

                        segmentStart = segmentEnd;
                    }
                }
            }

            var result = summaryMap.Values
                .OrderBy(r => r.DeviceId)
                .ThenBy(r => r.Date)
                .ToList();

            return FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>.Success(
                result,
                "PTS device offline report generated successfully.");
        }

        private static void AddSegment(
            IDictionary<(string DeviceId, DateTime Date), PtsDeviceOfflineDailySummaryDto> summaryMap,
            string deviceId,
            string? deviceName,
            string? siteName,
            DateTime date,
            DateTime start,
            DateTime end,
            int durationSeconds,
            bool incrementCount)
        {
            var key = (deviceId, date);
            if (!summaryMap.TryGetValue(key, out var summary))
            {
                summary = new PtsDeviceOfflineDailySummaryDto
                {
                    DeviceId = deviceId,
                    DeviceName = deviceName,
                    SiteName = siteName,
                    Date = date,
                    OfflineCount = 0,
                    TotalOfflineSeconds = 0,
                    Periods = new List<PtsDeviceOfflinePeriodDto>()
                };
                summaryMap[key] = summary;
            }

            summary.TotalOfflineSeconds += durationSeconds;
            if (incrementCount)
            {
                summary.OfflineCount += 1;
            }

            summary.Periods.Add(new PtsDeviceOfflinePeriodDto
            {
                StartAt = start,
                EndAt = end,
                DurationSeconds = durationSeconds
            });
        }
    }
}
