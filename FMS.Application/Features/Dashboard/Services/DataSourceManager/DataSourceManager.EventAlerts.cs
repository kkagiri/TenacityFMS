/**
 * File: DataSourceManager.EventAlerts.cs
 * Purpose: Provides event and alert dashboard data sources backed by the existing active-event system.
 * Dependencies: GpsdataContext, ActiveEvent, EventExpressionTypeMetadataDto, DataSourceMetadata
 * Last Modified: 2026-03-07
 *
 * Key Functions:
 * - GetEventAlertDataAsync(): Routes event/alert source requests to the correct query builder.
 * - BuildActiveEventSummaryAsync(): Produces current alert totals and status breakdowns.
 * - BuildEventBreakdownAsync(): Produces severity, type, and category distributions.
 * - BuildRecentActiveEventsAsync(): Produces recent active-event feed payloads.
 * - BuildEventsOverTimeAsync(): Produces trend-ready event counts over time.
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.EventEngine.DTOs;
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string ActiveEventSummaryDataSource = "active_event_summary";
        private const string ActiveEventsBySeverityDataSource = "active_events_by_severity";
        private const string ActiveEventsByTypeDataSource = "active_events_by_type";
        private const string ActiveEventsByCategoryDataSource = "active_events_by_category";
        private const string RecentActiveEventsDataSource = "recent_active_events";
        private const string EventsOverTimeDataSource = "events_over_time";

        private static readonly string[] EventAlertDataSourceKeys =
        {
            ActiveEventSummaryDataSource,
            ActiveEventsBySeverityDataSource,
            ActiveEventsByTypeDataSource,
            ActiveEventsByCategoryDataSource,
            RecentActiveEventsDataSource,
            EventsOverTimeDataSource
        };

        private bool IsEventAlertDataSource(string canonicalSource)
        {
            return EventAlertDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);
        }

        private async Task<object> GetEventAlertDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode,
            string aggregationInterval = "daily")
        {
            return canonicalSource switch
            {
                ActiveEventSummaryDataSource => await BuildActiveEventSummaryAsync(request),
                ActiveEventsBySeverityDataSource => await BuildEventBreakdownAsync(request, "severity"),
                ActiveEventsByTypeDataSource => await BuildEventBreakdownAsync(request, "type"),
                ActiveEventsByCategoryDataSource => await BuildEventBreakdownAsync(request, "category"),
                RecentActiveEventsDataSource => await BuildRecentActiveEventsAsync(request),
                EventsOverTimeDataSource => await BuildEventsOverTimeAsync(request, aggregationInterval),
                _ => new { error = $"Unsupported event/alert data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildActiveEventSummaryAsync(DashboardMetricRequestDto request)
        {
            var query = BuildActiveEventBaseQuery(request);
            var previousQuery = BuildPreviousPeriodActiveEventBaseQuery(request);

            var total = await query.CountAsync();
            var active = await query.CountAsync(e => e.State == "Active");
            var acknowledged = await query.CountAsync(e => e.State == "Acknowledged");
            var resolved = await query.CountAsync(e => e.State == "Resolved");
            var previousActive = await previousQuery.CountAsync(e => e.State == "Active");

            var categories = new List<object>
            {
                new { key = "Active", value = active },
                new { key = "Acknowledged", value = acknowledged },
                new { key = "Resolved", value = resolved }
            };

            return new
            {
                current = new
                {
                    value = active,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Active Events"
                },
                change = BuildChangePayload(active, previousActive),
                total,
                categories,
                items = new List<object>
                {
                    new { id = "active", text = $"{active} active events", value = active, type = "Active", source = "Event Engine", timestamp = DateTime.UtcNow },
                    new { id = "acknowledged", text = $"{acknowledged} acknowledged events", value = acknowledged, type = "Acknowledged", source = "Event Engine", timestamp = DateTime.UtcNow },
                    new { id = "resolved", text = $"{resolved} resolved events", value = resolved, type = "Resolved", source = "Event Engine", timestamp = DateTime.UtcNow }
                },
                metadata = GetDataSourceMetadata(ActiveEventSummaryDataSource)
            };
        }

        private async Task<object> BuildEventBreakdownAsync(DashboardMetricRequestDto request, string breakdownType)
        {
            var query = BuildActiveEventBaseQuery(request).Where(e => e.State != "Resolved");

            var rows = await query
                .Select(e => new
                {
                    e.EventType,
                    e.Severity
                })
                .ToListAsync();

            Dictionary<string, int> grouped = breakdownType switch
            {
                "severity" => rows
                    .GroupBy(e => GetSeverityLabel(e.Severity))
                    .OrderByDescending(g => GetSeverityRank(g.Key))
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
                "type" => rows
                    .GroupBy(e => string.IsNullOrWhiteSpace(e.EventType) ? "Unknown" : e.EventType)
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
                "category" => rows
                    .GroupBy(e => ResolveEventCategory(e.EventType))
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
                _ => new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            };

            var total = grouped.Values.Sum();
            var categories = grouped
                .Select(kvp => new
                {
                    key = kvp.Key,
                    value = kvp.Value,
                    percent = total > 0 ? Math.Round((decimal)kvp.Value / total * 100m, 2) : 0m
                })
                .Cast<object>()
                .ToList();

            var firstLabel = grouped.Keys.FirstOrDefault() ?? "Unresolved Events";
            var firstValue = grouped.Values.FirstOrDefault();

            return new
            {
                current = new
                {
                    value = total,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = $"Events by {CultureInfo.InvariantCulture.TextInfo.ToTitleCase(breakdownType)}"
                },
                total,
                categories,
                items = grouped.Select(kvp => new
                {
                    id = kvp.Key.ToLowerInvariant().Replace(' ', '_'),
                    name = kvp.Key,
                    label = kvp.Key,
                    description = $"{kvp.Value} unresolved events",
                    value = kvp.Value,
                    progress = total > 0 ? Math.Round((decimal)kvp.Value / total * 100m, 2) : 0m,
                    status = kvp.Value > 0 ? "inprogress" : "completed",
                    priority = breakdownType == "severity" ? kvp.Key : null,
                    timestamp = DateTime.UtcNow,
                    type = breakdownType,
                    text = $"{kvp.Key}: {kvp.Value}"
                }).Cast<object>().ToList(),
                summary = new
                {
                    primaryLabel = firstLabel,
                    primaryValue = firstValue,
                    breakdownType
                },
                metadata = GetDataSourceMetadata(GetBreakdownDataSourceKey(breakdownType))
            };
        }

        private async Task<object> BuildRecentActiveEventsAsync(DashboardMetricRequestDto request)
        {
            var activeEvents = await BuildActiveEventBaseQuery(request)
                .Where(e => e.State == "Active")
                .Include(e => e.Site)
                .Include(e => e.Tank)
                .OrderByDescending(e => e.TriggeredAt)
                .Take(10)
                .ToListAsync();

            var items = activeEvents.Select(e => new
            {
                id = e.Id,
                name = string.IsNullOrWhiteSpace(e.Message) ? e.EventType : e.Message,
                label = e.EventType,
                description = BuildRecentEventDescription(e),
                message = e.Message,
                eventType = e.EventType,
                source = e.Site?.Name ?? e.TriggerSource,
                type = GetSeverityLabel(e.Severity),
                status = e.State,
                priority = e.Priority,
                progress = Math.Round((decimal)Math.Clamp(e.Severity, 1, 4) / 4m * 100m, 2),
                value = e.Severity,
                target = 4,
                timestamp = e.TriggeredAt,
                severity = e.Severity,
                triggeredAt = e.TriggeredAt,
                siteName = e.Site?.Name,
                tankName = e.Tank?.Name
            }).Cast<object>().ToList();

            return new
            {
                current = new
                {
                    value = activeEvents.Count,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Recent Active Events"
                },
                items,
                rows = items,
                metadata = GetDataSourceMetadata(RecentActiveEventsDataSource)
            };
        }

        private async Task<object> BuildEventsOverTimeAsync(DashboardMetricRequestDto request, string aggregationInterval)
        {
            var query = BuildActiveEventBaseQuery(request);
            var granularity = ResolveEventTrendGranularity(aggregationInterval, request.Granularity);

            List<(DateTime timestamp, decimal value)> series = granularity == "hour"
                ? await query
                    .GroupBy(e => new { e.TriggeredAt.Year, e.TriggeredAt.Month, e.TriggeredAt.Day, e.TriggeredAt.Hour })
                    .Select(g => new
                    {
                        Timestamp = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, 0, 0),
                        Value = g.Count()
                    })
                    .OrderBy(g => g.Timestamp)
                    .AsNoTracking()
                    .Select(g => new ValueTuple<DateTime, decimal>(g.Timestamp, g.Value))
                    .ToListAsync()
                : await query
                    .GroupBy(e => new { e.TriggeredAt.Year, e.TriggeredAt.Month, e.TriggeredAt.Day })
                    .Select(g => new
                    {
                        Timestamp = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day, 0, 0, 0),
                        Value = g.Count()
                    })
                    .OrderBy(g => g.Timestamp)
                    .AsNoTracking()
                    .Select(g => new ValueTuple<DateTime, decimal>(g.Timestamp, g.Value))
                    .ToListAsync();

            var total = series.Sum(point => point.value);
            var lastValue = series.LastOrDefault().value;
            var previousValue = series.Count > 1 ? series[^2].value : 0m;

            return new
            {
                current = new
                {
                    value = total,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Events Over Time"
                },
                change = BuildChangePayload(lastValue, previousValue),
                timeSeries = series.Select(point => new { timestamp = point.timestamp, value = point.value }).ToList(),
                summary = new
                {
                    total,
                    latest = lastValue,
                    previous = previousValue,
                    granularity
                },
                metadata = GetDataSourceMetadata(EventsOverTimeDataSource)
            };
        }

        private IQueryable<ActiveEvent> BuildActiveEventBaseQuery(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);

            var query = _context.ActiveEvents
                .AsNoTracking()
                .Where(e => e.TriggeredAt >= start && e.TriggeredAt <= end);

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                query = query.Where(e => e.SiteId.HasValue && request.SiteIds.Contains(e.SiteId.Value));
            }

            if (request.TankIds != null && request.TankIds.Any())
            {
                query = query.Where(e => e.TankId.HasValue && request.TankIds.Contains(e.TankId.Value));
            }

            return query;
        }

        private IQueryable<ActiveEvent> BuildPreviousPeriodActiveEventBaseQuery(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);
            var duration = end - start;
            var previousEnd = start.AddSeconds(-1);
            var previousStart = previousEnd - duration;

            var previousRequest = new DashboardMetricRequestDto
            {
                SiteIds = request.SiteIds,
                TankIds = request.TankIds,
                StartDate = previousStart,
                EndDate = previousEnd,
                DatePreset = "custom"
            };

            return BuildActiveEventBaseQuery(previousRequest);
        }

        private static (DateTime start, DateTime end) ResolveRequestDateRange(DashboardMetricRequestDto request)
        {
            if (request.StartDate.HasValue && request.EndDate.HasValue)
            {
                return (request.StartDate.Value, request.EndDate.Value);
            }

            var today = DateTime.UtcNow.Date;
            return (request.DatePreset ?? string.Empty).ToLowerInvariant() switch
            {
                "today" => (today, today.AddDays(1).AddTicks(-1)),
                "yesterday" => (today.AddDays(-1), today.AddTicks(-1)),
                "last_7_days" => (today.AddDays(-7), today.AddDays(1).AddTicks(-1)),
                "last_30_days" => (today.AddDays(-30), today.AddDays(1).AddTicks(-1)),
                "this_week" => GetWeekRange(today, 0),
                "last_week" => GetWeekRange(today, -7),
                "this_month" => GetMonthRange(today, 0),
                "last_month" => GetMonthRange(today, -1),
                _ => (today, today.AddDays(1).AddTicks(-1))
            };
        }

        private static (DateTime start, DateTime end) GetWeekRange(DateTime referenceDate, int offsetDays)
        {
            var shifted = referenceDate.AddDays(offsetDays);
            var daysFromMonday = ((int)shifted.DayOfWeek - 1 + 7) % 7;
            var monday = shifted.AddDays(-daysFromMonday);
            var sunday = monday.AddDays(7).AddTicks(-1);
            return (monday, sunday);
        }

        private static (DateTime start, DateTime end) GetMonthRange(DateTime referenceDate, int offsetMonths)
        {
            var firstDay = new DateTime(referenceDate.Year, referenceDate.Month, 1).AddMonths(offsetMonths);
            return (firstDay, firstDay.AddMonths(1).AddTicks(-1));
        }

        private static object BuildChangePayload(decimal currentValue, decimal previousValue)
        {
            var delta = currentValue - previousValue;
            var percentage = previousValue == 0m
                ? currentValue == 0m ? 0m : 100m
                : Math.Round(delta / previousValue * 100m, 2);
            var direction = delta == 0m ? "stable" : delta > 0m ? "up" : "down";

            return new
            {
                value = delta,
                percentage,
                direction
            };
        }

        private static string BuildRecentEventDescription(ActiveEvent activeEvent)
        {
            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(activeEvent.Site?.Name))
            {
                parts.Add(activeEvent.Site.Name);
            }

            if (!string.IsNullOrWhiteSpace(activeEvent.Tank?.Name))
            {
                parts.Add($"Tank {activeEvent.Tank.Name}");
            }

            parts.Add($"Triggered {activeEvent.TriggeredAt.ToLocalTime():g}");

            return string.Join(" · ", parts);
        }

        private static string GetSeverityLabel(int severity)
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

        private static int GetSeverityRank(string severityLabel)
        {
            return severityLabel switch
            {
                "Critical" => 4,
                "High" => 3,
                "Medium" => 2,
                "Low" => 1,
                _ => 0
            };
        }

        private static string ResolveEventCategory(string eventType)
        {
            var match = EventExpressionTypeMetadataDto
                .GetAvailableTypes()
                .FirstOrDefault(type => string.Equals(type.EventType, eventType, StringComparison.OrdinalIgnoreCase));

            return string.IsNullOrWhiteSpace(match?.Category) ? "Other" : match.Category;
        }

        private static string GetBreakdownDataSourceKey(string breakdownType)
        {
            return breakdownType switch
            {
                "severity" => ActiveEventsBySeverityDataSource,
                "type" => ActiveEventsByTypeDataSource,
                "category" => ActiveEventsByCategoryDataSource,
                _ => ActiveEventsBySeverityDataSource
            };
        }

        private static string ResolveEventTrendGranularity(string aggregationInterval, string configuredGranularity)
        {
            var candidate = string.IsNullOrWhiteSpace(configuredGranularity) ? aggregationInterval : configuredGranularity;
            return (candidate ?? string.Empty).ToLowerInvariant() switch
            {
                "minute" or "minutely" => "hour",
                "hour" or "hourly" => "hour",
                _ => "day"
            };
        }

    }
}