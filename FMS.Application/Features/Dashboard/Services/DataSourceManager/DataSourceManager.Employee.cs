/**
 * File: DataSourceManager.Employee.cs
 * Purpose: Provides employee-module dashboard data sources (overview, site distribution, top assignments, recent updates).
 * Dependencies: GpsdataContext, DataSourceMetadata
 * Last Modified: 2026-03-21
 *
 * Key Functions:
 * - IsEmployeeDataSource(): Detects whether a canonical source key belongs to the employee module.
 * - GetEmployeeDataAsync(): Routes employee source requests to the correct builder.
 * - BuildEmployeeOverviewAsync(): Summary KPI card for employee counts and statuses.
 * - BuildEmployeeSiteDistributionAsync(): Employee distribution per site for chart widgets.
 * - BuildEmployeeTopAssignmentsAsync(): Top employees by assignment count for ranked lists.
 * - BuildEmployeeRecentUpdatesAsync(): Feed of recent employee record updates for ticker widgets.
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
        private const string EmployeeOverviewDataSource = "employee_overview";
        private const string EmployeeSiteDistributionDataSource = "employee_site_distribution";
        private const string EmployeeTopAssignmentsDataSource = "employee_top_assignments";
        private const string EmployeeRecentUpdatesDataSource = "employee_recent_updates";

        private static readonly string[] EmployeeDataSourceKeys =
        {
            EmployeeOverviewDataSource,
            EmployeeSiteDistributionDataSource,
            EmployeeTopAssignmentsDataSource,
            EmployeeRecentUpdatesDataSource
        };

        private bool IsEmployeeDataSource(string canonicalSource) =>
            EmployeeDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);

        private async Task<object> GetEmployeeDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode)
        {
            return canonicalSource switch
            {
                EmployeeOverviewDataSource => await BuildEmployeeOverviewAsync(request),
                EmployeeSiteDistributionDataSource => await BuildEmployeeSiteDistributionAsync(request),
                EmployeeTopAssignmentsDataSource => await BuildEmployeeTopAssignmentsAsync(request),
                EmployeeRecentUpdatesDataSource => await BuildEmployeeRecentUpdatesAsync(request),
                _ => new { error = $"Unsupported employee data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildEmployeeOverviewAsync(DashboardMetricRequestDto request)
        {
            var total = await _context.Employees.AsNoTracking().CountAsync();
            var active = await _context.Employees.AsNoTracking()
                .Where(e => e.Employeestatus == "Active")
                .CountAsync();

            return new
            {
                current = new
                {
                    value = total,
                    unit = "employees",
                    timestamp = DateTime.UtcNow,
                    label = "Total Employees"
                },
                summary = new
                {
                    total,
                    active,
                    inactive = total - active
                },
                metadata = GetDataSourceMetadata(EmployeeOverviewDataSource)
            };
        }

        private async Task<object> BuildEmployeeSiteDistributionAsync(DashboardMetricRequestDto request)
        {
            var distribution = await _context.Employees
                .AsNoTracking()
                .Where(e => e.Employeestatus == "Active")
                .GroupBy(e => e.SiteId)
                .Select(g => new { siteId = g.Key, count = g.Count() })
                .ToListAsync();

            var rows = distribution.Cast<object>().ToList();

            return new
            {
                current = new { value = rows.Count, unit = "sites", timestamp = DateTime.UtcNow },
                rows,
                items = rows,
                metadata = GetDataSourceMetadata(EmployeeSiteDistributionDataSource)
            };
        }

        private async Task<object> BuildEmployeeTopAssignmentsAsync(DashboardMetricRequestDto request)
        {
            // Placeholder: return empty list if no assignment entity exists yet
            var rows = new List<object>();

            return new
            {
                current = new { value = rows.Count, unit = "assignments", timestamp = DateTime.UtcNow },
                rows,
                items = rows,
                metadata = GetDataSourceMetadata(EmployeeTopAssignmentsDataSource)
            };
        }

        private async Task<object> BuildEmployeeRecentUpdatesAsync(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);
            var topK = 10;

            var recentEmployees = await _context.Employees
                .AsNoTracking()
                .Where(e => e.DateModified >= start && e.DateModified <= end)
                .OrderByDescending(e => e.DateModified)
                .Take(topK)
                .Select(e => new
                {
                    id = e.Id,
                    name = e.FullName,
                    updatedAt = e.DateModified,
                    status = e.Employeestatus
                })
                .ToListAsync();

            var rows = recentEmployees.Cast<object>().ToList();

            return new
            {
                current = new { value = rows.Count, unit = "employees", timestamp = DateTime.UtcNow },
                rows,
                items = rows,
                metadata = GetDataSourceMetadata(EmployeeRecentUpdatesDataSource)
            };
        }
    }
}
