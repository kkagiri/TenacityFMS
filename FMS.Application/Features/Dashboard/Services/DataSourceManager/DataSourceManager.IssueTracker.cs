/**
 * File: DataSourceManager.IssueTracker.cs
 * Purpose: Provides issue-tracker dashboard data sources based on existing issue-tracker entities and filters.
 * Dependencies: GpsdataContext, Issuetracker, DataSourceMetadata
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - GetIssueTrackerDataAsync(): Routes issue-tracker source requests to the correct query builder.
 * - BuildIssueTrackerSummaryAsync(): Produces summary cards for open, closed, overdue, and priority counts.
 * - BuildIssueBreakdownAsync(): Produces issue groupings by status, priority, category, vehicle, and site.
 * - BuildRecentIssuesAsync(): Produces recent or overdue issue feed payloads for ticker/list widgets.
 * - BuildIssuesOverTimeAsync(): Produces issue creation trend data across the selected window.
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string IssueTrackerSummaryDataSource = "issue_tracker_summary";
        private const string IssuesByStatusDataSource = "issues_by_status";
        private const string IssuesByPriorityDataSource = "issues_by_priority";
        private const string IssuesByCategoryDataSource = "issues_by_category";
        private const string IssuesByVehicleDataSource = "issues_by_vehicle";
        private const string IssuesBySiteDataSource = "issues_by_site";
        private const string RecentIssuesDataSource = "recent_issues";
        private const string OverdueIssuesDataSource = "overdue_issues";
        private const string IssuesOverTimeDataSource = "issues_over_time";
        private const string IssueDetailsTableDataSource = "issues_detail_table";

        private static readonly string[] IssueTrackerDataSourceKeys =
        {
            IssueTrackerSummaryDataSource,
            IssuesByStatusDataSource,
            IssuesByPriorityDataSource,
            IssuesByCategoryDataSource,
            IssuesByVehicleDataSource,
            IssuesBySiteDataSource,
            RecentIssuesDataSource,
            OverdueIssuesDataSource,
            IssuesOverTimeDataSource,
            IssueDetailsTableDataSource
        };

        private bool IsIssueTrackerDataSource(string canonicalSource)
        {
            return IssueTrackerDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);
        }

        private async Task<object> GetIssueTrackerDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode,
            string aggregationInterval = "daily")
        {
            return canonicalSource switch
            {
                IssueTrackerSummaryDataSource => await BuildIssueTrackerSummaryAsync(request),
                IssuesByStatusDataSource => await BuildIssueBreakdownAsync(request, "status"),
                IssuesByPriorityDataSource => await BuildIssueBreakdownAsync(request, "priority"),
                IssuesByCategoryDataSource => await BuildIssueBreakdownAsync(request, "category"),
                IssuesByVehicleDataSource => await BuildIssueBreakdownAsync(request, "vehicle"),
                IssuesBySiteDataSource => await BuildIssueBreakdownAsync(request, "site"),
                RecentIssuesDataSource => await BuildRecentIssuesAsync(request, overdueOnly: false),
                OverdueIssuesDataSource => await BuildRecentIssuesAsync(request, overdueOnly: true),
                IssuesOverTimeDataSource => await BuildIssuesOverTimeAsync(request, aggregationInterval),
                IssueDetailsTableDataSource => await BuildIssueDetailsTableAsync(request),
                _ => new { error = $"Unsupported issue tracker data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildIssueTrackerSummaryAsync(DashboardMetricRequestDto request)
        {
            var issues = await BuildIssueBaseQuery(request)
                .Select(i => new
                {
                    StatusName = i.StatusNavigation != null ? i.StatusNavigation.Status : null,
                    PriorityName = i.PriorityNavigation != null ? i.PriorityNavigation.Name : null,
                    i.DueDate
                })
                .ToListAsync();

            var previousStatuses = await BuildPreviousPeriodIssueBaseQuery(request)
                .Select(i => i.StatusNavigation != null ? i.StatusNavigation.Status : null)
                .ToListAsync();

            var total = issues.Count;
            var open = issues.Count(i => IsOpenIssueStatus(i.StatusName));
            var inProgress = issues.Count(i => IsInProgressIssueStatus(i.StatusName));
            var closed = issues.Count(i => IsClosedIssueStatus(i.StatusName));
            var overdue = issues.Count(i => IsOpenIssueStatus(i.StatusName) && i.DueDate.HasValue && i.DueDate.Value < DateTime.UtcNow);
            var highPriority = issues.Count(i => IsHighPriorityIssue(i.PriorityName));
            var previousOpen = previousStatuses.Count(IsOpenIssueStatus);
            var (detailRows, detailColumns, lastUpdated) = await BuildIssueTableViewAsync(request, 12);

            var categories = new List<object>
            {
                new { key = "Open", value = open },
                new { key = "In Progress", value = inProgress },
                new { key = "Closed", value = closed },
                new { key = "Overdue", value = overdue },
                new { key = "High Priority", value = highPriority }
            };

            return new
            {
                current = new
                {
                    value = open,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Open Issues"
                },
                change = BuildChangePayload(open, previousOpen),
                total,
                categories,
                items = new List<object>
                {
                    new { id = "open", text = $"{open} open issues", value = open, type = "Open", timestamp = DateTime.UtcNow },
                    new { id = "in_progress", text = $"{inProgress} issues in progress", value = inProgress, type = "In Progress", timestamp = DateTime.UtcNow },
                    new { id = "closed", text = $"{closed} closed issues", value = closed, type = "Closed", timestamp = DateTime.UtcNow },
                    new { id = "overdue", text = $"{overdue} overdue issues", value = overdue, type = "Overdue", timestamp = DateTime.UtcNow },
                    new { id = "high_priority", text = $"{highPriority} high priority issues", value = highPriority, type = "High Priority", timestamp = DateTime.UtcNow }
                },
                summary = new
                {
                    total,
                    open,
                    inProgress,
                    closed,
                    overdue,
                    highPriority
                },
                rows = detailRows,
                columns = detailColumns,
                lastUpdated,
                metadata = GetDataSourceMetadata(IssueTrackerSummaryDataSource)
            };
        }

        private async Task<object> BuildIssueDetailsTableAsync(DashboardMetricRequestDto request)
        {
            var issues = await BuildIssueBaseQuery(request)
                .Select(i => new
                {
                    StatusName = i.StatusNavigation != null ? i.StatusNavigation.Status : null,
                    PriorityName = i.PriorityNavigation != null ? i.PriorityNavigation.Name : null,
                    i.DueDate
                })
                .ToListAsync();

            var total = issues.Count;
            var open = issues.Count(i => IsOpenIssueStatus(i.StatusName));
            var inProgress = issues.Count(i => IsInProgressIssueStatus(i.StatusName));
            var closed = issues.Count(i => IsClosedIssueStatus(i.StatusName));
            var overdue = issues.Count(i => IsOpenIssueStatus(i.StatusName) && i.DueDate.HasValue && i.DueDate.Value < DateTime.UtcNow);
            var highPriority = issues.Count(i => IsHighPriorityIssue(i.PriorityName));
            var (rows, columns, lastUpdated) = await BuildIssueTableViewAsync(request, 25);

            return new
            {
                current = new
                {
                    value = total,
                    unit = "count",
                    timestamp = lastUpdated,
                    label = "Issue Details"
                },
                total,
                rows,
                columns,
                lastUpdated,
                summary = new
                {
                    total,
                    open,
                    inProgress,
                    closed,
                    overdue,
                    highPriority
                },
                metadata = GetDataSourceMetadata(IssueDetailsTableDataSource)
            };
        }

        private async Task<object> BuildIssueBreakdownAsync(DashboardMetricRequestDto request, string breakdownType)
        {
            var rows = await BuildIssueBaseQuery(request)
                .Select(i => new
                {
                    StatusName = i.StatusNavigation != null ? i.StatusNavigation.Status : null,
                    PriorityName = i.PriorityNavigation != null ? i.PriorityNavigation.Name : null,
                    CategoryName = i.IssueCategory != null ? i.IssueCategory.Name : null,
                    VehicleName = i.Vehicle != null
                        ? (!string.IsNullOrWhiteSpace(i.Vehicle.NumberPlate)
                            ? i.Vehicle.NumberPlate
                            : !string.IsNullOrWhiteSpace(i.Vehicle.HyoungNo)
                                ? i.Vehicle.HyoungNo
                                : $"Vehicle {i.VehicleId}")
                        : "Unknown",
                    SiteName = i.Site != null ? i.Site.Name : null
                })
                .ToListAsync();

            Dictionary<string, int> grouped = breakdownType switch
            {
                "status" => rows
                    .GroupBy(i => GetIssueStatusBucket(i.StatusName))
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
                "priority" => rows
                    .GroupBy(i => GetIssuePriorityBucket(i.PriorityName))
                    .OrderByDescending(g => GetIssuePriorityRank(g.Key))
                    .ThenBy(g => g.Key)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
                "category" => rows
                    .GroupBy(i => string.IsNullOrWhiteSpace(i.CategoryName) ? "Uncategorized" : i.CategoryName)
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
                "vehicle" => rows
                    .GroupBy(i => string.IsNullOrWhiteSpace(i.VehicleName) ? "Unknown" : i.VehicleName)
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .Take(10)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
                "site" => rows
                    .GroupBy(i => string.IsNullOrWhiteSpace(i.SiteName) ? "Unknown" : i.SiteName)
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .Take(10)
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

            var primaryLabel = grouped.Keys.FirstOrDefault() ?? "Issues";
            var primaryValue = grouped.Values.FirstOrDefault();

            return new
            {
                current = new
                {
                    value = total,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = $"Issues by {CultureInfo.InvariantCulture.TextInfo.ToTitleCase(breakdownType)}"
                },
                total,
                categories,
                items = grouped.Select(kvp => new
                {
                    id = kvp.Key.ToLowerInvariant().Replace(' ', '_'),
                    name = kvp.Key,
                    label = kvp.Key,
                    description = $"{kvp.Value} issues",
                    value = kvp.Value,
                    progress = total > 0 ? Math.Round((decimal)kvp.Value / total * 100m, 2) : 0m,
                    status = kvp.Value > 0 ? "inprogress" : "completed",
                    priority = breakdownType == "priority" ? kvp.Key : null,
                    timestamp = DateTime.UtcNow,
                    type = breakdownType,
                    text = $"{kvp.Key}: {kvp.Value}"
                }).Cast<object>().ToList(),
                summary = new
                {
                    primaryLabel,
                    primaryValue,
                    breakdownType
                },
                metadata = GetDataSourceMetadata(GetIssueBreakdownDataSourceKey(breakdownType))
            };
        }

        private async Task<object> BuildRecentIssuesAsync(DashboardMetricRequestDto request, bool overdueOnly)
        {
            var rawIssues = await BuildIssueBaseQuery(request)
                .Select(i => new
                {
                    i.Id,
                    i.ProblemTitle,
                    CategoryName = i.IssueCategory != null ? i.IssueCategory.Name : null,
                    StatusName = i.StatusNavigation != null ? i.StatusNavigation.Status : null,
                    PriorityName = i.PriorityNavigation != null ? i.PriorityNavigation.Name : null,
                    SiteName = i.Site != null ? i.Site.Name : null,
                    VehicleName = i.Vehicle != null
                        ? (!string.IsNullOrWhiteSpace(i.Vehicle.NumberPlate)
                            ? i.Vehicle.NumberPlate
                            : !string.IsNullOrWhiteSpace(i.Vehicle.HyoungNo)
                                ? i.Vehicle.HyoungNo
                                : $"Vehicle {i.VehicleId}")
                        : "Unknown",
                    i.OpenDate,
                    i.DueDate
                })
                .ToListAsync();

            var filteredIssues = rawIssues
                .Where(i => !overdueOnly || (IsOpenIssueStatus(i.StatusName)
                    && i.DueDate.HasValue
                    && i.DueDate.Value < DateTime.UtcNow))
                .OrderByDescending(i => i.OpenDate ?? i.DueDate ?? DateTime.MinValue)
                .Take(overdueOnly ? 15 : 10)
                .ToList();

            var items = filteredIssues.Select(i => new
            {
                id = i.Id,
                name = string.IsNullOrWhiteSpace(i.ProblemTitle) ? $"Issue #{i.Id}" : i.ProblemTitle,
                label = overdueOnly ? "Overdue Issue" : (string.IsNullOrWhiteSpace(i.CategoryName) ? "Issue" : i.CategoryName),
                description = BuildIssueListDescription(i.StatusName, i.PriorityName, i.SiteName, i.VehicleName, i.DueDate, overdueOnly),
                status = GetIssueStatusBucket(i.StatusName),
                priority = GetIssuePriorityBucket(i.PriorityName),
                type = string.IsNullOrWhiteSpace(i.CategoryName) ? "Issue" : i.CategoryName,
                source = i.SiteName,
                value = overdueOnly && i.DueDate.HasValue
                    ? Math.Max(1, (DateTime.UtcNow.Date - i.DueDate.Value.Date).Days)
                    : 1,
                target = 1,
                timestamp = i.OpenDate ?? i.DueDate ?? DateTime.UtcNow,
                dueDate = i.DueDate,
                siteName = i.SiteName,
                vehicleName = i.VehicleName,
                text = string.IsNullOrWhiteSpace(i.ProblemTitle) ? $"Issue #{i.Id}" : i.ProblemTitle
            }).Cast<object>().ToList();

            var dataSourceKey = overdueOnly ? OverdueIssuesDataSource : RecentIssuesDataSource;

            return new
            {
                current = new
                {
                    value = items.Count,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = overdueOnly ? "Overdue Issues" : "Recent Issues"
                },
                items,
                rows = items,
                metadata = GetDataSourceMetadata(dataSourceKey)
            };
        }

        private async Task<object> BuildIssuesOverTimeAsync(DashboardMetricRequestDto request, string aggregationInterval)
        {
            var query = BuildIssueBaseQuery(request)
                .Where(i => (i.OpenDate ?? i.LastModfield).HasValue);

            var granularity = ResolveIssueTrendGranularity(aggregationInterval, request.Granularity);

            List<(DateTime timestamp, decimal value)> series = granularity == "hour"
                ? await query
                    .GroupBy(i => new
                    {
                        Year = (i.OpenDate ?? i.LastModfield).Value.Year,
                        Month = (i.OpenDate ?? i.LastModfield).Value.Month,
                        Day = (i.OpenDate ?? i.LastModfield).Value.Day,
                        Hour = (i.OpenDate ?? i.LastModfield).Value.Hour
                    })
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
                    .GroupBy(i => new
                    {
                        Year = (i.OpenDate ?? i.LastModfield).Value.Year,
                        Month = (i.OpenDate ?? i.LastModfield).Value.Month,
                        Day = (i.OpenDate ?? i.LastModfield).Value.Day
                    })
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
            var latest = series.LastOrDefault().value;
            var previous = series.Count > 1 ? series[^2].value : 0m;

            return new
            {
                current = new
                {
                    value = total,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label = "Issues Over Time"
                },
                change = BuildChangePayload(latest, previous),
                timeSeries = series.Select(point => new { timestamp = point.timestamp, value = point.value }).ToList(),
                summary = new
                {
                    total,
                    latest,
                    previous,
                    granularity
                },
                metadata = GetDataSourceMetadata(IssuesOverTimeDataSource)
            };
        }

        private IQueryable<Issuetracker> BuildIssueBaseQuery(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);

            var query = _context.Issuetrackers
                .AsNoTracking()
                .Where(i =>
                    (i.OpenDate ?? i.LastModfield ?? i.ClosingDate ?? DateTime.MinValue) <= end &&
                    (!i.ClosingDate.HasValue || i.ClosingDate.Value >= start));

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                query = query.Where(i => request.SiteIds.Contains(i.SiteId));
            }

            if (request.VehicleIds != null && request.VehicleIds.Any())
            {
                query = query.Where(i => request.VehicleIds.Contains(i.VehicleId));
            }

            if (request.VehicleType != null && request.VehicleType.Any())
            {
                query = query.Where(i => i.Vehicle != null && i.Vehicle.VehicleTypeId.HasValue && request.VehicleType.Contains(i.Vehicle.VehicleTypeId.Value));
            }

            return query;
        }

        private IQueryable<Issuetracker> BuildPreviousPeriodIssueBaseQuery(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);
            var duration = end - start;
            var previousEnd = start.AddSeconds(-1);
            var previousStart = previousEnd - duration;

            var previousRequest = new DashboardMetricRequestDto
            {
                SiteIds = request.SiteIds,
                VehicleIds = request.VehicleIds,
                VehicleType = request.VehicleType,
                StartDate = previousStart,
                EndDate = previousEnd,
                DatePreset = "custom"
            };

            return BuildIssueBaseQuery(previousRequest);
        }

        private async Task<(List<Dictionary<string, object?>> Rows, List<object> Columns, DateTime LastUpdated)> BuildIssueTableViewAsync(
            DashboardMetricRequestDto request,
            int maxRows)
        {
            var rows = await BuildIssueBaseQuery(request)
                .Select(i => new
                {
                    i.Id,
                    i.ProblemTitle,
                    i.ProblemDescription,
                    StatusName = i.StatusNavigation != null ? i.StatusNavigation.Status : null,
                    PriorityName = i.PriorityNavigation != null ? i.PriorityNavigation.Name : null,
                    CategoryName = i.IssueCategory != null ? i.IssueCategory.Name : null,
                    SiteName = i.Site != null ? i.Site.Name : null,
                    VehicleName = i.Vehicle != null
                        ? (!string.IsNullOrWhiteSpace(i.Vehicle.NumberPlate)
                            ? i.Vehicle.NumberPlate
                            : !string.IsNullOrWhiteSpace(i.Vehicle.HyoungNo)
                                ? i.Vehicle.HyoungNo
                                : $"Vehicle {i.VehicleId}")
                        : null,
                    i.AssignedTo,
                    i.ReportedBy,
                    i.OpenDate,
                    i.DueDate,
                    i.ClosingDate,
                    i.LastModfield
                })
                .ToListAsync();

            var now = DateTime.UtcNow;
            var orderedRows = rows
                .Select(item => new
                {
                    item.Id,
                    Title = string.IsNullOrWhiteSpace(item.ProblemTitle) ? $"Issue {item.Id}" : item.ProblemTitle.Trim(),
                    Description = item.ProblemDescription,
                    Status = GetIssueStatusBucket(item.StatusName),
                    Priority = GetIssuePriorityBucket(item.PriorityName),
                    Category = string.IsNullOrWhiteSpace(item.CategoryName) ? "Uncategorized" : item.CategoryName,
                    Site = string.IsNullOrWhiteSpace(item.SiteName) ? "Unknown site" : item.SiteName,
                    Vehicle = string.IsNullOrWhiteSpace(item.VehicleName) ? "Unassigned" : item.VehicleName,
                    AssignedTo = string.IsNullOrWhiteSpace(item.AssignedTo) ? "Unassigned" : item.AssignedTo,
                    ReportedBy = string.IsNullOrWhiteSpace(item.ReportedBy) ? "System" : item.ReportedBy,
                    OpenedOn = item.OpenDate ?? item.LastModfield,
                    item.DueDate,
                    item.ClosingDate,
                    IsOverdue = IsOpenIssueStatus(item.StatusName) && item.DueDate.HasValue && item.DueDate.Value < now,
                    PriorityRank = GetIssuePriorityRank(GetIssuePriorityBucket(item.PriorityName))
                })
                .OrderByDescending(item => item.IsOverdue)
                .ThenByDescending(item => item.PriorityRank)
                .ThenBy(item => item.DueDate ?? DateTime.MaxValue)
                .ThenByDescending(item => item.OpenedOn ?? DateTime.MinValue)
                .Take(Math.Max(1, maxRows))
                .Select(item => new Dictionary<string, object?>
                {
                    ["issueNumber"] = $"ISS-{item.Id}",
                    ["title"] = item.Title,
                    ["status"] = item.Status,
                    ["priority"] = item.Priority,
                    ["category"] = item.Category,
                    ["site"] = item.Site,
                    ["vehicle"] = item.Vehicle,
                    ["assignedTo"] = item.AssignedTo,
                    ["reportedBy"] = item.ReportedBy,
                    ["openedOn"] = item.OpenedOn,
                    ["dueOn"] = item.DueDate,
                    ["closedOn"] = item.ClosingDate,
                    ["ageDays"] = GetIssueAgeInDays(item.OpenedOn, now),
                    ["overdue"] = item.IsOverdue,
                    ["description"] = item.Description ?? string.Empty
                })
                .ToList();

            return (orderedRows, BuildIssueTableColumns(), now);
        }

        private static bool IsClosedIssueStatus(string? statusName)
        {
            var normalized = (statusName ?? string.Empty).Trim().ToLowerInvariant();
            return normalized.Contains("closed")
                || normalized.Contains("complete")
                || normalized.Contains("resolved")
                || normalized.Contains("done");
        }

        private static bool IsInProgressIssueStatus(string? statusName)
        {
            var normalized = (statusName ?? string.Empty).Trim().ToLowerInvariant();
            return normalized.Contains("progress")
                || normalized.Contains("working")
                || normalized.Contains("ongoing")
                || normalized.Contains("pending");
        }

        private static bool IsOpenIssueStatus(string? statusName)
        {
            return !IsClosedIssueStatus(statusName);
        }

        private static bool IsHighPriorityIssue(string? priorityName)
        {
            var normalized = (priorityName ?? string.Empty).Trim().ToLowerInvariant();
            return normalized.Contains("critical") || normalized.Contains("high");
        }

        private static string GetIssueStatusBucket(string? statusName)
        {
            if (string.IsNullOrWhiteSpace(statusName))
            {
                return "Open";
            }

            if (IsClosedIssueStatus(statusName))
            {
                return "Closed";
            }

            if (IsInProgressIssueStatus(statusName))
            {
                return "In Progress";
            }

            return "Open";
        }

        private static string GetIssuePriorityBucket(string? priorityName)
        {
            var normalized = (priorityName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return "Unspecified";
            }

            if (normalized.Contains("critical", StringComparison.OrdinalIgnoreCase))
            {
                return "Critical";
            }

            if (normalized.Contains("high", StringComparison.OrdinalIgnoreCase))
            {
                return "High";
            }

            if (normalized.Contains("medium", StringComparison.OrdinalIgnoreCase))
            {
                return "Medium";
            }

            if (normalized.Contains("low", StringComparison.OrdinalIgnoreCase))
            {
                return "Low";
            }

            return normalized;
        }

        private static int GetIssuePriorityRank(string priorityName)
        {
            return priorityName.ToLowerInvariant() switch
            {
                "critical" => 5,
                "high" => 4,
                "medium" => 3,
                "low" => 2,
                "unspecified" => 1,
                _ => 0
            };
        }

        private static string ResolveIssueTrendGranularity(string aggregationInterval, string? requestGranularity)
        {
            var normalized = (requestGranularity ?? aggregationInterval ?? string.Empty).Trim().ToLowerInvariant();
            return normalized switch
            {
                "hour" or "hourly" => "hour",
                _ => "day"
            };
        }

        private static string GetIssueBreakdownDataSourceKey(string breakdownType)
        {
            return breakdownType switch
            {
                "status" => IssuesByStatusDataSource,
                "priority" => IssuesByPriorityDataSource,
                "category" => IssuesByCategoryDataSource,
                "vehicle" => IssuesByVehicleDataSource,
                "site" => IssuesBySiteDataSource,
                _ => IssueTrackerSummaryDataSource
            };
        }

        private static List<object> BuildIssueTableColumns()
        {
            return new List<object>
            {
                new { field = "issueNumber", title = "Issue #", type = "text", sortable = true, width = "110px" },
                new { field = "title", title = "Issue", type = "text", sortable = true, width = "minmax(220px, 2fr)", isPrimary = true },
                new { field = "status", title = "Status", type = "badge", sortable = true, width = "140px" },
                new { field = "priority", title = "Priority", type = "badge", sortable = true, width = "130px" },
                new { field = "category", title = "Category", type = "text", sortable = true, width = "150px" },
                new { field = "site", title = "Site", type = "text", sortable = true, width = "150px" },
                new { field = "vehicle", title = "Vehicle", type = "text", sortable = true, width = "140px" },
                new { field = "assignedTo", title = "Assigned To", type = "text", sortable = true, width = "150px" },
                new { field = "openedOn", title = "Opened", type = "datetime", sortable = true, width = "150px" },
                new { field = "dueOn", title = "Due", type = "date", sortable = true, width = "130px" },
                new { field = "ageDays", title = "Age (days)", type = "number", sortable = true, width = "120px" },
                new { field = "overdue", title = "Overdue", type = "boolean", sortable = true, width = "120px" },
                new { field = "reportedBy", title = "Reported By", type = "text", sortable = true, width = "140px", hidden = true },
                new { field = "closedOn", title = "Closed", type = "datetime", sortable = true, width = "150px", hidden = true },
                new { field = "description", title = "Description", type = "text", sortable = false, width = "240px", hidden = true }
            };
        }

        private static int GetIssueAgeInDays(DateTime? openedOn, DateTime now)
        {
            if (!openedOn.HasValue)
            {
                return 0;
            }

            return Math.Max(0, (int)Math.Floor((now.Date - openedOn.Value.Date).TotalDays));
        }

        private static string BuildIssueListDescription(
            string? statusName,
            string? priorityName,
            string? siteName,
            string? vehicleName,
            DateTime? dueDate,
            bool overdueOnly)
        {
            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(statusName))
            {
                parts.Add(GetIssueStatusBucket(statusName));
            }

            if (!string.IsNullOrWhiteSpace(priorityName))
            {
                parts.Add(GetIssuePriorityBucket(priorityName));
            }

            if (!string.IsNullOrWhiteSpace(siteName))
            {
                parts.Add(siteName);
            }

            if (!string.IsNullOrWhiteSpace(vehicleName) && !string.Equals(vehicleName, "Unknown", StringComparison.OrdinalIgnoreCase))
            {
                parts.Add(vehicleName);
            }

            if (dueDate.HasValue)
            {
                parts.Add(overdueOnly
                    ? $"Due {dueDate.Value:dd MMM yyyy}"
                    : $"Due {dueDate.Value:dd MMM}");
            }

            return string.Join(" • ", parts.Where(part => !string.IsNullOrWhiteSpace(part)));
        }
    }
}