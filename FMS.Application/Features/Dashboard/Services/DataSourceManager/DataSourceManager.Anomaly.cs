/**
 * File: DataSourceManager.Anomaly.cs
 * Purpose: Provides vehicle anomaly dashboard data sources backed by the active-event system.
 * Dependencies: GpsdataContext, ActiveEvent, DataSourceMetadata, BuildActiveEventBaseQuery (EventAlerts partial)
 * Last Modified: 2026-03-12
 *
 * Key Functions:
 * - GetAnomalyDataAsync(): Routes anomaly source requests to query builders.
 * - BuildVehicleAnomalyCountAsync(): Returns count and severity breakdown of unresolved active events.
 * - BuildAnomalyReviewFeedAsync(): Returns recent unresolved events as a live review feed with review path.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string VehicleAnomalyCountDataSource = "vehicle_anomaly_count";
        private const string AnomalyReviewFeedDataSource = "anomaly_review_feed";

        private static readonly string[] AnomalyDataSourceKeys =
        {
            VehicleAnomalyCountDataSource,
            AnomalyReviewFeedDataSource
        };

        private bool IsAnomalyDataSource(string canonicalSource)
        {
            return AnomalyDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);
        }

        private async Task<object> GetAnomalyDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode)
        {
            return canonicalSource switch
            {
                VehicleAnomalyCountDataSource => await BuildVehicleAnomalyCountAsync(request),
                AnomalyReviewFeedDataSource => await BuildAnomalyReviewFeedAsync(request),
                _ => new { error = $"Unsupported anomaly data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildVehicleAnomalyCountAsync(DashboardMetricRequestDto request)
        {
            // Reuse the shared base query builder from EventAlerts partial — applies date range + site/tank filters.
            var unresolvedBase = BuildActiveEventBaseQuery(request)
                .Where(e => e.State != "Resolved");

            var events = await unresolvedBase
                .Select(e => new
                {
                    e.Id,
                    e.EventType,
                    e.State,
                    e.Severity,
                    e.Priority,
                    e.Message,
                    e.TriggeredAt,
                    SiteName = e.Site != null ? e.Site.Name : null
                })
                .ToListAsync();

            var total = events.Count;

            var previousCount = await BuildPreviousPeriodActiveEventBaseQuery(request)
                .CountAsync(e => e.State != "Resolved");

            // Severity breakdown
            var severityBreakdown = events
                .GroupBy(e => GetAnomalySeverityLabel(e.Severity))
                .Select(g => new
                {
                    key = g.Key,
                    value = g.Count(),
                    percent = total > 0 ? Math.Round((decimal)g.Count() / total * 100m, 2) : 0m
                })
                .OrderByDescending(item => GetSeverityRankAnomaly(item.key))
                .Cast<object>()
                .ToList();

            var activeCount = events.Count(e => e.State == "Active");
            var acknowledgedCount = events.Count(e => e.State == "Acknowledged");

            // Top-5 preview feed items for stat-card secondary display
            var recentItems = events
                .OrderByDescending(e => e.Severity)
                .ThenByDescending(e => e.TriggeredAt)
                .Take(5)
                .Select(e => new
                {
                    id = e.Id,
                    label = string.IsNullOrWhiteSpace(e.EventType) ? "Alert" : e.EventType,
                    name = e.Message.Length > 80 ? e.Message[..77] + "..." : e.Message,
                    description = BuildAnomalyItemDescription(e.SiteName, e.Priority, e.TriggeredAt),
                    severity = GetAnomalySeverityLabel(e.Severity),
                    state = e.State,
                    timestamp = e.TriggeredAt
                })
                .Cast<object>()
                .ToList();

            return new
            {
                current = new
                {
                    value = (decimal)total,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Unresolved Anomalies"
                },
                change = BuildAnomalyChangePayload((decimal)total, (decimal)previousCount),
                total,
                categories = severityBreakdown,
                items = recentItems,
                additionalInfo = new
                {
                    activeCount,
                    acknowledgedCount,
                    reviewPath = "/events"
                },
                metadata = GetDataSourceMetadata(VehicleAnomalyCountDataSource)
            };
        }

        private async Task<object> BuildAnomalyReviewFeedAsync(DashboardMetricRequestDto request)
        {
            // Show all currently unresolved events (no date filter — live queue view).
            var baseQuery = _context.ActiveEvents
                .AsNoTracking()
                .Include(e => e.Site)
                .Where(e => e.State != "Resolved")
                .AsQueryable();

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                baseQuery = baseQuery.Where(e => e.SiteId.HasValue && request.SiteIds.Contains(e.SiteId.Value));
            }

            var events = await baseQuery
                .OrderByDescending(e => e.Severity)
                .ThenByDescending(e => e.TriggeredAt)
                .Take(30)
                .ToListAsync();

            var items = events
                .Select(e => new
                {
                    id = e.Id,
                    label = string.IsNullOrWhiteSpace(e.EventType) ? "Alert" : e.EventType,
                    name = e.Message.Length > 100 ? e.Message[..97] + "..." : e.Message,
                    description = BuildAnomalyItemDescription(e.Site?.Name, e.Priority, e.TriggeredAt),
                    severity = GetAnomalySeverityLabel(e.Severity),
                    state = e.State,
                    timestamp = e.TriggeredAt
                })
                .Cast<object>()
                .ToList();

            return new
            {
                current = new
                {
                    value = (decimal)events.Count,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Anomalies Pending Review"
                },
                total = events.Count,
                items,
                additionalInfo = new
                {
                    reviewPath = "/events"
                },
                metadata = GetDataSourceMetadata(AnomalyReviewFeedDataSource)
            };
        }

        // ─── Helpers ────────────────────────────────────────────────────────────

        private static string GetAnomalySeverityLabel(int severity)
        {
            return severity switch
            {
                >= 4 => "Critical",
                3 => "High",
                2 => "Medium",
                1 => "Low",
                _ => "Unknown"
            };
        }

        private static int GetSeverityRankAnomaly(string label)
        {
            return label switch
            {
                "Critical" => 4,
                "High" => 3,
                "Medium" => 2,
                "Low" => 1,
                _ => 0
            };
        }

        private static string BuildAnomalyItemDescription(string? siteName, string? priority, DateTime triggeredAt)
        {
            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(siteName))
            {
                parts.Add(siteName);
            }

            if (!string.IsNullOrWhiteSpace(priority))
            {
                parts.Add(priority);
            }

            parts.Add($"Triggered {triggeredAt.ToLocalTime():g}");
            return string.Join(" · ", parts);
        }

        private static object BuildAnomalyChangePayload(decimal current, decimal previous)
        {
            var delta = current - previous;
            var percentage = previous == 0m
                ? current == 0m ? 0m : 100m
                : Math.Round(delta / previous * 100m, 2);
            // For anomalies, an increase is "up" (bad) — direction meaning aligns with event alert convention
            var direction = delta == 0m ? "stable" : delta > 0m ? "up" : "down";
            return new { value = delta, percentage, direction };
        }
    }
}
