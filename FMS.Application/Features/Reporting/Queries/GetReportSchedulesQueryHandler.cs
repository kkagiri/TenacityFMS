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
    /// Handler for querying report schedules
    /// </summary>
    public class GetReportSchedulesQueryHandler
        : IRequestHandler<GetReportSchedulesQuery, FMSResponse<List<ReportScheduleDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetReportSchedulesQueryHandler> _logger;

        public GetReportSchedulesQueryHandler(
            GpsdataContext context,
            ILogger<GetReportSchedulesQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<ReportScheduleDTO>>> Handle(
            GetReportSchedulesQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.ReportSchedules.AsQueryable();

                if (!string.IsNullOrEmpty(request.Status))
                    query = query.Where(s => s.Status == request.Status);

                var result = await query
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new ReportScheduleDTO
                    {
                        ReportScheduleId = s.ReportScheduleId,
                        ScheduleName = s.ScheduleName,
                        Description = s.Description,
                        ReportSourceId = s.ReportSourceId,
                        Filters = s.Filters,
                        OutputFormat = s.OutputFormat,
                        Frequency = s.Frequency,
                        RepeatCount = s.RepeatCount,
                        ExecutedCount = s.ExecutedCount,
                        Recipients = s.Recipients,
                        ScheduleConfig = s.ScheduleConfig,
                        ScheduledAt = s.ScheduledAt,
                        LastExecutedAt = s.LastExecutedAt,
                        NextExecutionAt = s.NextExecutionAt,
                        Status = s.Status,
                        ErrorMessage = s.ErrorMessage,
                        CreatedBy = s.CreatedBy,
                        CreatedAt = s.CreatedAt
                    })
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<ReportScheduleDTO>>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error querying report schedules");
                return FMSResponse<List<ReportScheduleDTO>>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
