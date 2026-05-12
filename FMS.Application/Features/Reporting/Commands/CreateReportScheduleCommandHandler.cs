using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Domain.Entities.Features.Reporting;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Handler for creating a report schedule
    /// </summary>
    public class CreateReportScheduleCommandHandler
        : IRequestHandler<CreateReportScheduleCommand, FMSResponse<ReportScheduleDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateReportScheduleCommandHandler> _logger;

        public CreateReportScheduleCommandHandler(
            GpsdataContext context,
            ILogger<CreateReportScheduleCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<ReportScheduleDTO>> Handle(
            CreateReportScheduleCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Schedule.ScheduleName))
                    return FMSResponse<ReportScheduleDTO>.Failed("Schedule name is required");

                if (string.IsNullOrWhiteSpace(request.Schedule.ReportSourceId))
                    return FMSResponse<ReportScheduleDTO>.Failed("Report source is required");

                var entity = new ReportSchedule
                {
                    ScheduleName = request.Schedule.ScheduleName,
                    Description = request.Schedule.Description,
                    ReportSourceId = request.Schedule.ReportSourceId,
                    Filters = request.Schedule.Filters,
                    OutputFormat = request.Schedule.OutputFormat,
                    Frequency = request.Schedule.Frequency,
                    RepeatCount = request.Schedule.RepeatCount,
                    Recipients = request.Schedule.Recipients,
                    ScheduleConfig = request.Schedule.ScheduleConfig,
                    ScheduledAt = request.Schedule.ScheduledAt,
                    NextExecutionAt = request.Schedule.ScheduledAt,
                    Status = "active",
                    CreatedBy = request.UserId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ReportSchedules.Add(entity);
                await _context.SaveChangesAsync(cancellationToken);

                var dto = new ReportScheduleDTO
                {
                    ReportScheduleId = entity.ReportScheduleId,
                    ScheduleName = entity.ScheduleName,
                    Description = entity.Description,
                    ReportSourceId = entity.ReportSourceId,
                    Filters = entity.Filters,
                    OutputFormat = entity.OutputFormat,
                    Frequency = entity.Frequency,
                    RepeatCount = entity.RepeatCount,
                    ExecutedCount = entity.ExecutedCount,
                    Recipients = entity.Recipients,
                    ScheduleConfig = entity.ScheduleConfig,
                    ScheduledAt = entity.ScheduledAt,
                    NextExecutionAt = entity.NextExecutionAt,
                    Status = entity.Status,
                    CreatedBy = entity.CreatedBy,
                    CreatedAt = entity.CreatedAt
                };

                return FMSResponse<ReportScheduleDTO>.Success(dto, "Schedule created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating report schedule");
                return FMSResponse<ReportScheduleDTO>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
