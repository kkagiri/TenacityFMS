/**
 * File: DataSourceManager.Reports.cs
 * Purpose: Provides report-module dashboard data sources (execution stats, history, format usage).
 * Dependencies: GpsdataContext, DataSourceMetadata
 * Last Modified: 2026-03-21
 *
 * Key Functions:
 * - IsReportDataSource(): Detects whether a canonical source key belongs to the reports module.
 * - GetReportDataAsync(): Routes report source requests to the correct builder.
 * - BuildReportExecutionStatsAsync(): Report execution summary KPIs (total, success, failed).
 * - BuildReportExecutionHistoryAsync(): Historical report execution feed for table/ticker widgets.
 * - BuildReportFormatUsageAsync(): Report output format distribution for pie/bar chart widgets.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Features.Reporting;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string ReportExecutionStatsDataSource = "report_execution_stats";
        private const string ReportExecutionHistoryDataSource = "report_execution_history";
        private const string ReportFormatUsageDataSource = "report_format_usage";

        private static readonly string[] ReportDataSourceKeys =
        {
            ReportExecutionStatsDataSource,
            ReportExecutionHistoryDataSource,
            ReportFormatUsageDataSource
        };

        private bool IsReportDataSource(string canonicalSource) =>
            ReportDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);

        private async Task<object> GetReportDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode)
        {
            return canonicalSource switch
            {
                ReportExecutionStatsDataSource => await BuildReportExecutionStatsAsync(request),
                ReportExecutionHistoryDataSource => await BuildReportExecutionHistoryAsync(request),
                ReportFormatUsageDataSource => await BuildReportFormatUsageAsync(request),
                _ => new { error = $"Unsupported report data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildReportExecutionStatsAsync(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);

            var total = await _context.ReportExecutionHistories
                .AsNoTracking()
                .Where(r => r.ExecutedAt >= start && r.ExecutedAt <= end)
                .CountAsync();

            var success = await _context.ReportExecutionHistories
                .AsNoTracking()
                .Where(r => r.ExecutedAt >= start && r.ExecutedAt <= end && r.Success)
                .CountAsync();

            var failed = total - success;

            return new
            {
                current = new
                {
                    value = total,
                    unit = "reports",
                    timestamp = DateTime.UtcNow,
                    label = "Report Executions"
                },
                summary = new
                {
                    total,
                    success,
                    failed,
                    successRate = total > 0 ? Math.Round((decimal)success / total * 100, 1) : 0m
                },
                metadata = GetDataSourceMetadata(ReportExecutionStatsDataSource)
            };
        }

        private async Task<object> BuildReportExecutionHistoryAsync(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);
            var topK = 20;

            var history = await _context.ReportExecutionHistories
                .AsNoTracking()
                .Where(r => r.ExecutedAt >= start && r.ExecutedAt <= end)
                .OrderByDescending(r => r.ExecutedAt)
                .Take(topK)
                .Select(r => new
                {
                    id = r.ReportExecutionId,
                    executedAt = r.ExecutedAt,
                    isSuccess = r.Success,
                    outputFormat = r.ExportFormat,
                    errorMessage = r.ErrorMessage
                })
                .ToListAsync();

            var rows = history.Cast<object>().ToList();

            return new
            {
                current = new { value = rows.Count, unit = "executions", timestamp = DateTime.UtcNow },
                rows,
                items = rows,
                metadata = GetDataSourceMetadata(ReportExecutionHistoryDataSource)
            };
        }

        private async Task<object> BuildReportFormatUsageAsync(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);

            var formatGroups = await _context.ReportExecutionHistories
                .AsNoTracking()
                .Where(r => r.ExecutedAt >= start && r.ExecutedAt <= end && r.Success)
                .GroupBy(r => r.ExportFormat)
                .Select(g => new { format = g.Key ?? "unknown", count = g.Count() })
                .ToListAsync();

            var rows = formatGroups.Cast<object>().ToList();

            return new
            {
                current = new { value = rows.Count, unit = "formats", timestamp = DateTime.UtcNow },
                rows,
                items = rows,
                metadata = GetDataSourceMetadata(ReportFormatUsageDataSource)
            };
        }
    }
}
