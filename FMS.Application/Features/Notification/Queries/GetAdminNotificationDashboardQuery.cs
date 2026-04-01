/**
 * File: GetAdminNotificationDashboardQuery.cs
 * Purpose: Query and handler to retrieve live admin notification dashboard metrics and recent activity.
 * Dependencies: MediatR, GpsdataContext, FMS.Application DTOs
 * Last Modified: 2026-04-01
 *
 * Key Types:
 * - GetAdminNotificationDashboardQuery: Encapsulates the requested dashboard time window and bucket size.
 * - GetAdminNotificationDashboardQueryHandler: Builds summary cards, performance series, and recent rows from live notifications.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Notification.Queries
{
    public class GetAdminNotificationDashboardQuery : IRequest<FMSResponse<AdminNotificationDashboardDto>>
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int RecentCount { get; set; } = 10;
        public int BucketHours { get; set; } = 4;
    }

    public class GetAdminNotificationDashboardQueryHandler
        : IRequestHandler<GetAdminNotificationDashboardQuery, FMSResponse<AdminNotificationDashboardDto>>
    {
        private readonly GpsdataContext _context;

        public GetAdminNotificationDashboardQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<AdminNotificationDashboardDto>> Handle(
            GetAdminNotificationDashboardQuery request,
            CancellationToken cancellationToken)
        {
            var safeRecentCount = Math.Max(1, Math.Min(request.RecentCount, 25));
            var safeBucketHours = Math.Max(1, Math.Min(request.BucketHours, 24));

            var effectiveToDate = NormalizeToHour(request.ToDate?.ToUniversalTime() ?? DateTime.UtcNow);
            var effectiveFromDate = NormalizeToHour(request.FromDate?.ToUniversalTime() ?? effectiveToDate.AddHours(-24));

            if (effectiveFromDate >= effectiveToDate)
            {
                return FMSResponse<AdminNotificationDashboardDto>.Failed("From date must be earlier than to date");
            }

            var notificationsInRangeQuery = _context.Notifications
                .AsNoTracking()
                .Where(notification => notification.CreatedAt >= effectiveFromDate && notification.CreatedAt < effectiveToDate);

            var notificationCount = await notificationsInRangeQuery.CountAsync(cancellationToken);

            var hourlyRowData = await notificationsInRangeQuery
                .GroupBy(notification => new
                {
                    notification.CreatedAt.Year,
                    notification.CreatedAt.Month,
                    notification.CreatedAt.Day,
                    notification.CreatedAt.Hour
                })
                .Select(group => new HourlyNotificationMetricRow
                {
                    Year = group.Key.Year,
                    Month = group.Key.Month,
                    Day = group.Key.Day,
                    Hour = group.Key.Hour,
                    Sent = group.Sum(notification => notification.Recipients.Count()),
                    Delivered = group.Sum(notification => notification.Recipients.Count(recipient =>
                        recipient.DeliveryStatus == "Delivered" || recipient.DeliveryStatus == "Sent")),
                    Failed = group.Sum(notification => notification.Recipients.Count(recipient => recipient.DeliveryStatus == "Failed"))
                })
                .ToListAsync(cancellationToken);

            var hourlyRows = hourlyRowData
                .Select(row => new HourlyNotificationMetric
                {
                    BucketStart = new DateTime(row.Year, row.Month, row.Day, row.Hour, 0, 0, DateTimeKind.Utc),
                    Sent = row.Sent,
                    Delivered = row.Delivered,
                    Failed = row.Failed
                })
                .ToList();

            var performanceSeries = BuildPerformanceSeries(hourlyRows, effectiveFromDate, effectiveToDate, safeBucketHours);
            var totalSent = performanceSeries.Sum(point => point.Sent);
            var totalDelivered = performanceSeries.Sum(point => point.Delivered);
            var totalFailed = performanceSeries.Sum(point => point.Failed);

            var recentNotifications = await _context.Notifications
                .AsNoTracking()
                .OrderByDescending(notification => notification.CreatedAt)
                .Take(safeRecentCount)
                .Select(notification => new AdminNotificationDashboardRecentDto
                {
                    Id = notification.Id,
                    Title = notification.Title ?? string.Empty,
                    Message = notification.Message ?? string.Empty,
                    Priority = notification.Priority ?? string.Empty,
                    Status = notification.Status ?? string.Empty,
                    CreatedAt = notification.CreatedAt,
                    RecipientCount = notification.Recipients.Count(),
                    DeliveredCount = notification.Recipients.Count(recipient =>
                        recipient.DeliveryStatus == "Delivered" || recipient.DeliveryStatus == "Sent"),
                    FailedCount = notification.Recipients.Count(recipient => recipient.DeliveryStatus == "Failed"),
                    PolicyName = notification.NotificationPolicy != null ? notification.NotificationPolicy.Name : null
                })
                .ToListAsync(cancellationToken);

            var activePolicies = await _context.NotificationPolicies
                .AsNoTracking()
                .CountAsync(policy => policy.IsActive, cancellationToken);

            var dashboard = new AdminNotificationDashboardDto
            {
                NotificationCount = notificationCount,
                TotalSent = totalSent,
                TotalDelivered = totalDelivered,
                TotalFailed = totalFailed,
                DeliveryRate = totalSent > 0
                    ? Math.Round((decimal)totalDelivered / totalSent * 100m, 2)
                    : 0m,
                ActivePolicies = activePolicies,
                FromDate = effectiveFromDate,
                ToDate = effectiveToDate,
                GeneratedAt = DateTime.UtcNow,
                PerformanceSeries = performanceSeries,
                RecentNotifications = recentNotifications
            };

            return FMSResponse<AdminNotificationDashboardDto>.Success(
                dashboard,
                "Retrieved admin notification dashboard data");
        }

        private static DateTime NormalizeToHour(DateTime value)
        {
            return new DateTime(value.Year, value.Month, value.Day, value.Hour, 0, 0, DateTimeKind.Utc);
        }

        private static List<AdminNotificationPerformancePointDto> BuildPerformanceSeries(
            List<HourlyNotificationMetric> hourlyRows,
            DateTime fromDate,
            DateTime toDate,
            int bucketHours)
        {
            var totalHours = Math.Max(1d, (toDate - fromDate).TotalHours);
            var bucketCount = Math.Max(1, (int)Math.Ceiling(totalHours / bucketHours));

            var points = Enumerable.Range(0, bucketCount)
                .Select(index => new AdminNotificationPerformancePointDto
                {
                    BucketStart = fromDate.AddHours(index * bucketHours)
                })
                .ToList();

            foreach (var row in hourlyRows)
            {
                var bucketIndex = (int)((row.BucketStart - fromDate).TotalHours / bucketHours);
                if (bucketIndex < 0 || bucketIndex >= points.Count)
                {
                    continue;
                }

                points[bucketIndex].Sent += row.Sent;
                points[bucketIndex].Delivered += row.Delivered;
                points[bucketIndex].Failed += row.Failed;
            }

            return points;
        }

        private sealed class HourlyNotificationMetric
        {
            public DateTime BucketStart { get; set; }
            public int Sent { get; set; }
            public int Delivered { get; set; }
            public int Failed { get; set; }
        }

        private sealed class HourlyNotificationMetricRow
        {
            public int Year { get; set; }
            public int Month { get; set; }
            public int Day { get; set; }
            public int Hour { get; set; }
            public int Sent { get; set; }
            public int Delivered { get; set; }
            public int Failed { get; set; }
        }
    }
}