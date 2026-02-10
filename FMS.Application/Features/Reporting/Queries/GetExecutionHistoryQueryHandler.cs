using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Reporting.Queries
{
    /// <summary>
    /// Handler for querying report execution history
    /// </summary>
    public class GetExecutionHistoryQueryHandler
        : IRequestHandler<GetExecutionHistoryQuery, FMSResponse<List<ReportExecutionHistoryDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetExecutionHistoryQueryHandler> _logger;

        public GetExecutionHistoryQueryHandler(
            GpsdataContext context,
            ILogger<GetExecutionHistoryQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<ReportExecutionHistoryDTO>>> Handle(
            GetExecutionHistoryQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.ReportExecutionHistories.AsQueryable();

                if (request.DateFrom.HasValue)
                    query = query.Where(e => e.ExecutedAt >= request.DateFrom.Value);

                if (request.DateTo.HasValue)
                    query = query.Where(e => e.ExecutedAt <= request.DateTo.Value);

                var result = await query
                    .OrderByDescending(e => e.ExecutedAt)
                    .Take(500)
                    .Select(e => new ReportExecutionHistoryDTO
                    {
                        ReportExecutionId = e.ReportExecutionId,
                        ReportDefinitionId = e.ReportDefinitionId,
                        ExecutedBy = e.ExecutedBy,
                        ExecutedAt = e.ExecutedAt,
                        Filters = e.Filters,
                        ExportFormat = e.ExportFormat,
                        RecordCount = e.RecordCount,
                        ExecutionTimeMs = e.ExecutionTimeMs,
                        Success = e.Success,
                        ErrorMessage = e.ErrorMessage,
                        IpAddress = e.IpAddress
                    })
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<ReportExecutionHistoryDTO>>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error querying execution history");
                return FMSResponse<List<ReportExecutionHistoryDTO>>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
