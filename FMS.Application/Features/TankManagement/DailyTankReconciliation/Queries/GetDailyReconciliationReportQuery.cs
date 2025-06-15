//  using System.ComponentModel.DataAnnotations;
//  using System;
//  using FMS.Application.Common;
//  using MediatR;

//  namespace FMS.Application.Features.TankManagement.DailyTankReconciliation.Queries;

//  //Cursor - Query to get daily reconciliation report for dashboard display
//  public class GetDailyReconciliationReportQuery : IRequest<FMSResponse<DailyReconciliationReport>> {
//      [Required]
//      public DateTime StartDate { get; set; }

//      [Required]
//      public DateTime EndDate { get; set; }

//      public int? SiteId { get; set; }

//      public int? TankId { get; set; }

//      public bool IncludeDiscrepanciesOnly { get; set; } = false;

//      public int PageNumber { get; set; } = 1;

//      public int PageSize { get; set; } = 50;
//  }

//  //Cursor - Daily reconciliation report structure for dashboard
//  public class DailyReconciliationReport {
//      public DateTime ReportStartDate { get; set; }
//      public DateTime ReportEndDate { get; set; }
//      public DailyReconciliationSummary Summary { get; set; } = new ();
//      public List<DailyReconciliationReportItem> Items { get; set; } = new ();
//      public List<DiscrepancyAlert> DiscrepancyAlerts { get; set; } = new ();
//      public PaginationInfo Pagination { get; set; } = new ();
//  }

//  //Cursor - Summary statistics for the report
//  public class DailyReconciliationSummary {
//      public int TotalRecords { get; set; }
//      public int TotalTanks { get; set; }
//      public int TotalSites { get; set; }
//      public int RecordsWithDiscrepancies { get; set; }
//      public decimal TotalVarianceAmount { get; set; }
//      public decimal AverageVariance { get; set; }
//      public decimal MaxVariance { get; set; }
//      public string MostProblematicTank { get; set; }
//      public decimal DiscrepancyRate { get; set; }
//  }

//  //Cursor - Individual report item
//  public class DailyReconciliationReportItem {
//      public int Id { get; set; }
//      public int TankId { get; set; }
//      public string TankName { get; set; }
//      public string SiteName { get; set; }
//      public DateTime ReconciliationDate { get; set; }
//      public decimal OpeningLevel { get; set; }
//      public decimal ClosingLevel { get; set; }
//      public decimal TotalRefills { get; set; }
//      public decimal TotalDeliveries { get; set; }
//      public decimal TotalTransfersIn { get; set; }
//      public decimal TotalTransfersOut { get; set; }
//      public decimal CalculatedClosing { get; set; }
//      public decimal Variance { get; set; }
//      public decimal VariancePercentage { get; set; }
//      public bool HasDiscrepancy { get; set; }
//      public string Status { get; set; }
//      public DateTime CreatedOn { get; set; }
//  }

//  //Cursor - Discrepancy alert for dashboard notifications
//  public class DiscrepancyAlert {
//      public int TankId { get; set; }
//      public string TankName { get; set; }
//      public string SiteName { get; set; }
//      public DateTime Date { get; set; }
//      public decimal Variance { get; set; }
//      public string Severity { get; set; }
//      public string Message { get; set; }
//  }

//  //Cursor - Pagination information
//  public class PaginationInfo {
//      public int CurrentPage { get; set; }
//      public int PageSize { get; set; }
//      public int TotalRecords { get; set; }
//      public int TotalPages { get; set; }
//      public bool HasNextPage { get; set; }
//      public bool HasPreviousPage { get; set; }
//  }