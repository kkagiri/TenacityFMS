//Cursor - CQRS Query for retrieving analytics dashboard data
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.AutomatedReconciliation.Queries;

public class GetAnalyticsDashboardQuery : IRequest<FMSResponse<AnalyticsDashboardDTO>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? SiteId { get; set; }
}

public class GetAnalyticsDashboardQueryHandler : IRequestHandler<GetAnalyticsDashboardQuery, FMSResponse<AnalyticsDashboardDTO>>
{
    //Cursor - Inject required dependencies
    private readonly GpsdataContext _context;

    public GetAnalyticsDashboardQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<AnalyticsDashboardDTO>> Handle(
        GetAnalyticsDashboardQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            //Cursor - Set default date range if not provided
            var endDate = request.EndDate ?? DateTime.UtcNow;
            var startDate = request.StartDate ?? endDate.AddDays(-30);

            //Cursor - Build base queries
            var policiesQuery = _context.ReconciliationPolicies.AsQueryable();
            var executionsQuery = _context.ReconciliationPolicyExecutions
                .Include(e => e.Policy)
                .AsQueryable();
            var discrepanciesQuery = _context.ReconciliationDiscrepancies
                .Include(d => d.PolicyExecution)
                .ThenInclude(pe => pe.Policy)
                .AsQueryable();

            //Cursor - Apply site filter if provided
            if (request.SiteId.HasValue)
            {
                policiesQuery = policiesQuery.Where(p => p.SiteId == request.SiteId.Value);
                executionsQuery = executionsQuery.Where(e => e.Policy.SiteId == request.SiteId.Value);
                discrepanciesQuery = discrepanciesQuery.Where(d => d.PolicyExecution.Policy.SiteId == request.SiteId.Value);
            }

            //Cursor - Apply date range filter for executions and discrepancies
            executionsQuery = executionsQuery.Where(e => e.ExecutionStartTime >= startDate && e.ExecutionStartTime <= endDate);
            discrepanciesQuery = discrepanciesQuery.Where(d => d.DetectedAt >= startDate && d.DetectedAt <= endDate);

            //Cursor - Calculate policy statistics
            var totalPolicies = await policiesQuery.CountAsync(cancellationToken);
            var activePolicies = await policiesQuery.Where(p => p.IsActive).CountAsync(cancellationToken);

            //Cursor - Calculate execution statistics
            var executions = await executionsQuery.ToListAsync(cancellationToken);
            var totalExecutions = executions.Count;
            var successfulExecutions = executions.Count(e => e.Status == Domain.Entities.enums.ReconciliationExecutionStatus.Completed);
            var failedExecutions = executions.Count(e => e.Status == Domain.Entities.enums.ReconciliationExecutionStatus.Failed);
            var successRate = totalExecutions > 0 ? (decimal)successfulExecutions / totalExecutions * 100 : 0;
            var averageExecutionTime = executions.Where(e => e.ExecutionDurationMs.HasValue).Average(e => (decimal?)e.ExecutionDurationMs) ?? 0;
            var totalTanksReconciled = executions.Sum(e => e.TanksReconciled);

            //Cursor - Calculate discrepancy statistics
            var discrepancies = await discrepanciesQuery.ToListAsync(cancellationToken);
            var totalDiscrepanciesDetected = discrepancies.Count;
            var totalDiscrepanciesResolved = discrepancies.Count(d => d.IsResolved);
            var resolutionRate = totalDiscrepanciesDetected > 0 ? (decimal)totalDiscrepanciesResolved / totalDiscrepanciesDetected * 100 : 0;

            //Cursor - Calculate system health
            var systemHealth = "Healthy";
            if (successRate < 90) systemHealth = "Warning";
            if (successRate < 70 || resolutionRate < 80) systemHealth = "Critical";

            //Cursor - Calculate performance metrics
            var last24Hours = DateTime.UtcNow.AddHours(-24);
            var last7Days = DateTime.UtcNow.AddDays(-7);
            var last30Days = DateTime.UtcNow.AddDays(-30);

            var executionsLast24Hours = executions.Count(e => e.ExecutionStartTime >= last24Hours);
            var executionsLast7Days = executions.Count(e => e.ExecutionStartTime >= last7Days);
            var executionsLast30Days = executions.Count(e => e.ExecutionStartTime >= last30Days);

            var averageDiscrepanciesPerExecution = totalExecutions > 0 ? (decimal)totalDiscrepanciesDetected / totalExecutions : 0;
            var averageResolutionTime = discrepancies.Where(d => d.IsResolved && d.ResolvedAt.HasValue)
                .Select(d => (d.ResolvedAt.Value - d.DetectedAt).TotalMinutes)
                .DefaultIfEmpty(0)
                .Average();

            //Cursor - Find peak execution time
            var peakExecutionTime = executions
                .GroupBy(e => e.ExecutionStartTime.Hour)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key ?? DateTime.UtcNow.Hour;

            //Cursor - Find most active policy
            var mostActivePolicy = executions
                .GroupBy(e => e.Policy.Name)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key ?? "N/A";

            //Cursor - Generate trend data for the last 7 days
            var trendData = new List<TrendDataPoint>();
            for (int i = 6; i >= 0; i--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-i);
                var executionsOnDate = executions.Count(e => e.ExecutionStartTime.Date == date);
                trendData.Add(new TrendDataPoint
                {
                    Date = date,
                    Value = executionsOnDate
                });
            }

            //Cursor - Calculate site statistics
            var siteStatistics = new List<SiteStatisticsDTO>();
            if (request.SiteId.HasValue)
            {
                var site = await _context.Sites.FindAsync(request.SiteId.Value);
                if (site != null)
                {
                    var siteTanksCount = await _context.Tanks.CountAsync(t => t.SiteId == request.SiteId.Value, cancellationToken);
                    var siteExecutionsCount = executions.Count(e => e.Policy.SiteId == request.SiteId.Value);
                    var siteDiscrepanciesCount = discrepancies.Count(d => d.PolicyExecution.Policy.SiteId == request.SiteId.Value);
                    var siteSuccessRate = siteExecutionsCount > 0 ?
                        (decimal)executions.Count(e => e.Policy.SiteId == request.SiteId.Value && e.Status == Domain.Entities.enums.ReconciliationExecutionStatus.Completed) / siteExecutionsCount * 100 : 0;

                    siteStatistics.Add(new SiteStatisticsDTO
                    {
                        SiteId = site.Id,
                        SiteName = site.Name,
                        TanksCount = siteTanksCount,
                        ExecutionsCount = siteExecutionsCount,
                        DiscrepanciesCount = siteDiscrepanciesCount,
                        SuccessRate = siteSuccessRate
                    });
                }
            }
            else
            {
                //Cursor - Get statistics for all sites
                var sites = await _context.Sites.ToListAsync(cancellationToken);
                foreach (var site in sites.Take(10)) // Limit to top 10 sites for performance
                {
                    var siteTanksCount = await _context.Tanks.CountAsync(t => t.SiteId == site.Id, cancellationToken);
                    var siteExecutionsCount = executions.Count(e => e.Policy.SiteId == site.Id);
                    var siteDiscrepanciesCount = discrepancies.Count(d => d.PolicyExecution.Policy.SiteId == site.Id);
                    var siteSuccessRate = siteExecutionsCount > 0 ?
                        (decimal)executions.Count(e => e.Policy.SiteId == site.Id && e.Status == Domain.Entities.enums.ReconciliationExecutionStatus.Completed) / siteExecutionsCount * 100 : 0;

                    siteStatistics.Add(new SiteStatisticsDTO
                    {
                        SiteId = site.Id,
                        SiteName = site.Name,
                        TanksCount = siteTanksCount,
                        ExecutionsCount = siteExecutionsCount,
                        DiscrepanciesCount = siteDiscrepanciesCount,
                        SuccessRate = siteSuccessRate
                    });
                }
            }

            //Cursor - Create dashboard DTO with real data
            var dashboard = new AnalyticsDashboardDTO
            {
                TotalPolicies = totalPolicies,
                ActivePolicies = activePolicies,
                TotalExecutions = totalExecutions,
                SuccessfulExecutions = successfulExecutions,
                FailedExecutions = failedExecutions,
                SuccessRate = successRate,
                TotalDiscrepanciesDetected = totalDiscrepanciesDetected,
                TotalDiscrepanciesResolved = totalDiscrepanciesResolved,
                ResolutionRate = resolutionRate,
                AverageExecutionTime = averageExecutionTime,
                TotalTanksReconciled = totalTanksReconciled,
                SystemHealth = systemHealth,
                LastUpdated = DateTime.UtcNow,

                // Performance metrics
                PerformanceMetrics = new PerformanceMetricsDTO
                {
                    ExecutionsLast24Hours = executionsLast24Hours,
                    ExecutionsLast7Days = executionsLast7Days,
                    ExecutionsLast30Days = executionsLast30Days,
                    AverageDiscrepanciesPerExecution = averageDiscrepanciesPerExecution,
                    AverageResolutionTime = (decimal)averageResolutionTime,
                    PeakExecutionTime = DateTime.UtcNow.Date.AddHours(peakExecutionTime),
                    MostActivePolicy = mostActivePolicy
                },

                // Trend data
                TrendData = trendData,

                // Site statistics
                SiteStatistics = siteStatistics
            };

            return FMSResponse<AnalyticsDashboardDTO>.Success(
                dashboard,
                "Analytics dashboard data retrieved successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<AnalyticsDashboardDTO>.SystemError(
                $"Failed to retrieve analytics dashboard: {ex.Message}");
        }
    }
}

// Analytics DTOs
public class AnalyticsDashboardDTO
{
    // Executive Summary
    public int TotalPolicies { get; set; }
    public int ActivePolicies { get; set; }
    public int TotalExecutions { get; set; }
    public int SuccessfulExecutions { get; set; }
    public int FailedExecutions { get; set; }
    public decimal SuccessRate { get; set; }
    public int TotalDiscrepanciesDetected { get; set; }
    public int TotalDiscrepanciesResolved { get; set; }
    public decimal ResolutionRate { get; set; }
    public decimal AverageExecutionTime { get; set; }
    public int TotalTanksReconciled { get; set; }
    public string SystemHealth { get; set; } = null!;
    public DateTime LastUpdated { get; set; }

    // Detailed Metrics
    public PerformanceMetricsDTO PerformanceMetrics { get; set; } = null!;
    public List<TrendDataPoint> TrendData { get; set; } = new List<TrendDataPoint>();
    public List<SiteStatisticsDTO> SiteStatistics { get; set; } = new List<SiteStatisticsDTO>();
}

public class PerformanceMetricsDTO
{
    public int ExecutionsLast24Hours { get; set; }
    public int ExecutionsLast7Days { get; set; }
    public int ExecutionsLast30Days { get; set; }
    public decimal AverageDiscrepanciesPerExecution { get; set; }
    public decimal AverageResolutionTime { get; set; }
    public DateTime PeakExecutionTime { get; set; }
    public string MostActivePolicy { get; set; } = null!;
}

public class TrendDataPoint
{
    public DateTime Date { get; set; }
    public decimal Value { get; set; }
}

public class SiteStatisticsDTO
{
    public int SiteId { get; set; }
    public string SiteName { get; set; } = null!;
    public int TanksCount { get; set; }
    public int ExecutionsCount { get; set; }
    public int DiscrepanciesCount { get; set; }
    public decimal SuccessRate { get; set; }
}