// //Cursor - CQRS Query for retrieving analytics dashboard data
// using FMS.Application.Common;
// using MediatR;
// using System;
// using System.Collections.Generic;
// using System.Threading;
// using System.Threading.Tasks;

// namespace FMS.Application.Features.AutomatedReconciliation.Queries;

// public class GetAnalyticsDashboardQuery : IRequest<FMSResponse<AnalyticsDashboardDTO>>
// {
//     public DateTime? StartDate { get; set; }
//     public DateTime? EndDate { get; set; }
//     public int? SiteId { get; set; }
// }

// public class GetAnalyticsDashboardQueryHandler : IRequestHandler<GetAnalyticsDashboardQuery, FMSResponse<AnalyticsDashboardDTO>>
// {
//     // TODO: Add dependencies (repository, analytics service, etc.)

//     public async Task<FMSResponse<AnalyticsDashboardDTO>> Handle(
//         GetAnalyticsDashboardQuery request,
//         CancellationToken cancellationToken)
//     {

//         try
//         {
//             // TODO: Implement analytics dashboard logic
//             // 1. Calculate performance metrics
//             // 2. Generate system health indicators
//             // 3. Compute trend analysis
//             // 4. Aggregate execution statistics
//             // 5. Return comprehensive dashboard data

//             // Placeholder implementation
//             var dashboard = new AnalyticsDashboardDTO
//             {
//                 TotalPolicies = 5,
//                 ActivePolicies = 3,
//                 TotalExecutions = 150,
//                 SuccessfulExecutions = 142,
//                 FailedExecutions = 8,
//                 SuccessRate = 94.67m,
//                 TotalDiscrepanciesDetected = 45,
//                 TotalDiscrepanciesResolved = 42,
//                 ResolutionRate = 93.33m,
//                 AverageExecutionTime = 850.5m,
//                 TotalTanksReconciled = 320,
//                 SystemHealth = "Healthy",
//                 LastUpdated = DateTime.UtcNow,

//                 // Performance metrics
//                 PerformanceMetrics = new PerformanceMetricsDTO
//                 {
//                     ExecutionsLast24Hours = 12,
//                     ExecutionsLast7Days = 84,
//                     ExecutionsLast30Days = 360,
//                     AverageDiscrepanciesPerExecution = 2.1m,
//                     AverageResolutionTime = 45.5m,
//                     PeakExecutionTime = DateTime.UtcNow.Date.AddHours(2),
//                     MostActivePolicy = "Daily Reconciliation"
//                 },

//                 // Trend data
//                 TrendData = new List<TrendDataPoint> {
//                 new TrendDataPoint { Date = DateTime.UtcNow.Date.AddDays (-6), Value = 8 },
//                 new TrendDataPoint { Date = DateTime.UtcNow.Date.AddDays (-5), Value = 10 },
//                 new TrendDataPoint { Date = DateTime.UtcNow.Date.AddDays (-4), Value = 12 },
//                 new TrendDataPoint { Date = DateTime.UtcNow.Date.AddDays (-3), Value = 9 },
//                 new TrendDataPoint { Date = DateTime.UtcNow.Date.AddDays (-2), Value = 11 },
//                 new TrendDataPoint { Date = DateTime.UtcNow.Date.AddDays (-1), Value = 13 },
//                 new TrendDataPoint { Date = DateTime.UtcNow.Date, Value = 12 }
//                 },

//                 // Site statistics
//                 SiteStatistics = new List<SiteStatisticsDTO> {
//                 new SiteStatisticsDTO {
//                 SiteId = 1,
//                 SiteName = "Main Site",
//                 TanksCount = 15,
//                 ExecutionsCount = 45,
//                 DiscrepanciesCount = 12,
//                 SuccessRate = 95.5m
//                 }
//                 }
//             };

//             return FMSResponse<AnalyticsDashboardDTO>.Success(
//                 dashboard,
//                 "Analytics dashboard data retrieved successfully");

//         }
//         catch (Exception ex)
//         {
//             return FMSResponse<AnalyticsDashboardDTO>.SystemError(
//                 $"Failed to retrieve analytics dashboard: {ex.Message}");
//         }
//     }
// }

// // Analytics DTOs
// public class AnalyticsDashboardDTO
// {
//     // Executive Summary
//     public int TotalPolicies { get; set; }
//     public int ActivePolicies { get; set; }
//     public int TotalExecutions { get; set; }
//     public int SuccessfulExecutions { get; set; }
//     public int FailedExecutions { get; set; }
//     public decimal SuccessRate { get; set; }
//     public int TotalDiscrepanciesDetected { get; set; }
//     public int TotalDiscrepanciesResolved { get; set; }
//     public decimal ResolutionRate { get; set; }
//     public decimal AverageExecutionTime { get; set; }
//     public int TotalTanksReconciled { get; set; }
//     public string SystemHealth { get; set; } = null!;
//     public DateTime LastUpdated { get; set; }

//     // Detailed Metrics
//     public PerformanceMetricsDTO PerformanceMetrics { get; set; } = null!;
//     public List<TrendDataPoint> TrendData { get; set; } = new List<TrendDataPoint>();
//     public List<SiteStatisticsDTO> SiteStatistics { get; set; } = new List<SiteStatisticsDTO>();
// }

// public class PerformanceMetricsDTO
// {
//     public int ExecutionsLast24Hours { get; set; }
//     public int ExecutionsLast7Days { get; set; }
//     public int ExecutionsLast30Days { get; set; }
//     public decimal AverageDiscrepanciesPerExecution { get; set; }
//     public decimal AverageResolutionTime { get; set; }
//     public DateTime PeakExecutionTime { get; set; }
//     public string MostActivePolicy { get; set; } = null!;
// }

// public class TrendDataPoint
// {
//     public DateTime Date { get; set; }
//     public decimal Value { get; set; }
// }

// public class SiteStatisticsDTO
// {
//     public int SiteId { get; set; }
//     public string SiteName { get; set; } = null!;
//     public int TanksCount { get; set; }
//     public int ExecutionsCount { get; set; }
//     public int DiscrepanciesCount { get; set; }
//     public decimal SuccessRate { get; set; }
// }