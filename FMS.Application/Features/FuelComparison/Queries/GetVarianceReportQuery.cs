using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelComparison.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelComparison.Queries
{
    /// <summary>
    /// Query to get variance analysis report with summary metrics
    /// </summary>
    public record GetVarianceReportQuery(
        DateTime StartDate,
        DateTime EndDate,
        string FilterType, // "all", "site", "tank"
        int? SiteId,
        int? TankId,
        string UserId
    ) : IRequest<FMSResponse<VarianceReportDto>>;

    public class GetVarianceReportQueryHandler : IRequestHandler<GetVarianceReportQuery, FMSResponse<VarianceReportDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMediator _mediator;
        private readonly ILogger<GetVarianceReportQueryHandler> _logger;

        public GetVarianceReportQueryHandler(
            GpsdataContext context,
            IMediator mediator,
            ILogger<GetVarianceReportQueryHandler> logger)
        {
            _context = context;
            _mediator = mediator;
            _logger = logger;
        }

        public async Task<FMSResponse<VarianceReportDto>> Handle(
            GetVarianceReportQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation($"Generating variance report from {request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}");

                // Get user's variance threshold
                var userSettings = await _context.FuelComparisonSettings
                    .FirstOrDefaultAsync(s => s.UserId == request.UserId, cancellationToken);

                var varianceThreshold = userSettings?.VarianceThreshold ?? 10.0m;

                // Get comparison data using the main query
                var comparisonQuery = new GetComparisonDataQuery(
                    request.StartDate,
                    request.EndDate,
                    request.FilterType,
                    request.SiteId,
                    request.TankId,
                    request.UserId,
                    ShowDeleted: false
                );

                var comparisonResponse = await _mediator.Send(comparisonQuery, cancellationToken);

                if (!comparisonResponse.IsSuccess || comparisonResponse.Data == null)
                {
                    return FMSResponse<VarianceReportDto>.Failed(
                        $"Failed to get comparison data: {comparisonResponse.Message}");
                }

                var comparisonData = comparisonResponse.Data;

                // Calculate summary metrics
                var totalRecords = comparisonData.Count;
                var completeRecords = comparisonData.Count(r => r.Status == "Complete" || r.Status == "HighVariance");
                var partialRecords = comparisonData.Count(r => r.Status == "Partial");
                var singleSourceRecords = comparisonData.Count(r => r.Status == "Single");
                var highVarianceRecords = comparisonData.Where(r => r.TotalVariance > varianceThreshold).ToList();

                var totalManualVolume = comparisonData
                    .Where(r => r.ManualVolume.HasValue)
                    .Sum(r => r.ManualVolume.Value);

                var totalPtsVolume = comparisonData
                    .Where(r => r.PtsVolume.HasValue)
                    .Sum(r => r.PtsVolume.Value);

                var totalGpsVolume = comparisonData
                    .Where(r => r.EffectiveGpsVolume.HasValue)
                    .Sum(r => r.EffectiveGpsVolume.Value);

                var modifiedGpsCount = comparisonData.Count(r => r.IsGpsModified);

                // Get deleted GPS entries count
                var deletedGpsCount = await _context.GpsGateReportEntries
                    .Where(g => g.IsDeleted &&
                           g.DispenseDate >= request.StartDate &&
                           g.DispenseDate <= request.EndDate)
                    .CountAsync(cancellationToken);

                var avgVariance = comparisonData.Any() ? comparisonData.Average(r => r.TotalVariance) : 0;
                var maxVariance = comparisonData.Any() ? comparisonData.Max(r => r.TotalVariance) : 0;

                var dataCompletenessPercent = totalRecords > 0
                    ? (decimal)completeRecords / totalRecords * 100
                    : 0;

                var highVariancePercent = totalRecords > 0
                    ? (decimal)highVarianceRecords.Count / totalRecords * 100
                    : 0;

                var summary = new VarianceReportSummary
                {
                    TotalRecords = totalRecords,
                    CompleteRecords = completeRecords,
                    PartialRecords = partialRecords,
                    SingleSourceRecords = singleSourceRecords,
                    HighVarianceCount = highVarianceRecords.Count,
                    AverageVariance = avgVariance,
                    MaxVariance = maxVariance,
                    TotalManualVolume = totalManualVolume,
                    TotalPtsVolume = totalPtsVolume,
                    TotalGpsVolume = totalGpsVolume,
                    ModifiedGpsEntriesCount = modifiedGpsCount,
                    DeletedGpsEntriesCount = deletedGpsCount,
                    DataCompletenessPercent = dataCompletenessPercent,
                    HighVariancePercent = highVariancePercent
                };

                var report = new VarianceReportDto
                {
                    GeneratedAt = DateTime.UtcNow,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    FilterType = request.FilterType,
                    SiteId = request.SiteId,
                    TankId = request.TankId,
                    VarianceThreshold = varianceThreshold,
                    Summary = summary,
                    Details = comparisonData,
                    HighVarianceRecords = highVarianceRecords
                };

                _logger.LogInformation(
                    $"Variance report generated: Total={totalRecords}, " +
                    $"Complete={completeRecords}, HighVariance={highVarianceRecords.Count}");

                return FMSResponse<VarianceReportDto>.Success(
                    report,
                    $"Variance report generated with {totalRecords} records");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating variance report");
                return FMSResponse<VarianceReportDto>.Failed(
                    $"Error generating variance report: {ex.Message}");
            }
        }
    }
}
