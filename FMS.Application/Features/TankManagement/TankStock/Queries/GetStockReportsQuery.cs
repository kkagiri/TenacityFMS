using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankStock.Queries;

//Cursor - Query for fetching stock reports list
public class GetStockReportsQuery : IRequest<FMSResponse<List<StockReportSummaryDTO>>> {
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? ReportType { get; set; }
    public int? SiteId { get; set; }
    public string? UserId { get; set; }
}

public class GetStockReportsQueryHandler : IRequestHandler<GetStockReportsQuery, FMSResponse<List<StockReportSummaryDTO>>> {
    private readonly GpsdataContext _context;
    private readonly ILogger<GetStockReportsQueryHandler> _logger;

    public GetStockReportsQueryHandler (GpsdataContext context, ILogger<GetStockReportsQueryHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<StockReportSummaryDTO>>> Handle (GetStockReportsQuery request, CancellationToken cancellationToken) {
        try {
            //Cursor - Updated to use real StockReport data instead of mock data
            var reportsQuery = _context.StockReports
                .Include (sr => sr.GeneratedByNavigation)
                .AsQueryable ();

            // Apply filters
            if (request.StartDate.HasValue) {
                reportsQuery = reportsQuery.Where (sr => sr.GeneratedDate >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue) {
                reportsQuery = reportsQuery.Where (sr => sr.GeneratedDate <= request.EndDate.Value);
            }

            if (!string.IsNullOrEmpty (request.ReportType)) {
                reportsQuery = reportsQuery.Where (sr => sr.ReportType.ToLower () == request.ReportType.ToLower ());
            }

            if (request.SiteId.HasValue) {
                reportsQuery = reportsQuery.Where (sr => sr.SiteId == request.SiteId.Value);
            }

            if (!string.IsNullOrEmpty (request.UserId)) {
                reportsQuery = reportsQuery.Where (sr => sr.GeneratedBy == request.UserId);
            }

            // Execute query and map to DTO
            var stockReports = await reportsQuery
                .OrderByDescending (sr => sr.GeneratedDate)
                .ToListAsync (cancellationToken);

            var reports = stockReports.Select (sr => new StockReportSummaryDTO {
                Id = sr.Id,
                    ReportType = sr.ReportType,
                    GeneratedDate = sr.GeneratedDate,
                    GeneratedBy = sr.GeneratedByNavigation?.UserName ?? sr.GeneratedBy,
                    Status = GetStatusText (sr.Status),
                    StartDate = sr.StartDate,
                    EndDate = sr.EndDate,
                    SiteId = sr.SiteId,
                    FileName = sr.FileName,
                    ContentType = sr.ContentType,
                    FileSize = sr.FileSize,
                    ErrorMessage = sr.ErrorMessage
            }).ToList ();

            _logger.LogInformation ("Retrieved {Count} stock reports from database", reports.Count);

            return FMSResponse<List<StockReportSummaryDTO>>.Success (reports, $"Retrieved {reports.Count} stock reports");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error retrieving stock reports");
            return FMSResponse<List<StockReportSummaryDTO>>.SystemError ($"Error retrieving stock reports: {ex.Message}");
        }
    }

    //Cursor - Helper method to convert status code to text
    private static string GetStatusText (int status) {
        return status
        switch {
            0 => "Generating",
                1 => "Completed",
                2 => "Failed",
                _ => "Unknown"
        };
    }
}