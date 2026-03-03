using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Domain.Entities.Features.Reporting;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Handler for logging report executions
    /// </summary>
    public class LogReportExecutionCommandHandler
        : IRequestHandler<LogReportExecutionCommand, FMSResponse<ReportExecutionHistoryDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<LogReportExecutionCommandHandler> _logger;

        public LogReportExecutionCommandHandler(
            GpsdataContext context,
            ILogger<LogReportExecutionCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<ReportExecutionHistoryDTO>> Handle(
            LogReportExecutionCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Validate FK: ReportDefinitionId must reference an existing row
                if (request.ReportDefinitionId <= 0)
                {
                    _logger.LogWarning(
                        "Skipping execution log — ReportDefinitionId is {Id} (invalid)",
                        request.ReportDefinitionId);
                    return FMSResponse<ReportExecutionHistoryDTO>.Failed(
                        "Cannot log execution: ReportDefinitionId is missing or invalid.");
                }

                var definitionExists = await _context.ReportDefinitions
                    .AnyAsync(d => d.ReportDefinitionId == request.ReportDefinitionId, cancellationToken);

                if (!definitionExists)
                {
                    _logger.LogWarning(
                        "Skipping execution log — ReportDefinitionId {Id} not found in report_definitions",
                        request.ReportDefinitionId);
                    return FMSResponse<ReportExecutionHistoryDTO>.Failed(
                        $"Cannot log execution: ReportDefinitionId {request.ReportDefinitionId} does not exist.");
                }

                var entity = new ReportExecutionHistory
                {
                    ReportDefinitionId = request.ReportDefinitionId,
                    ExecutedBy = request.ExecutedBy,
                    ExecutedAt = DateTime.UtcNow,
                    Filters = request.Filters,
                    ExportFormat = request.ExportFormat,
                    RecordCount = request.RecordCount,
                    ExecutionTimeMs = request.ExecutionTimeMs,
                    Success = request.Success,
                    ErrorMessage = request.ErrorMessage,
                    IpAddress = request.IpAddress,
                    UserAgent = request.UserAgent
                };

                _context.ReportExecutionHistories.Add(entity);
                await _context.SaveChangesAsync(cancellationToken);

                var dto = new ReportExecutionHistoryDTO
                {
                    ReportExecutionId = entity.ReportExecutionId,
                    ReportDefinitionId = entity.ReportDefinitionId,
                    ExecutedBy = entity.ExecutedBy,
                    ExecutedAt = entity.ExecutedAt,
                    Filters = entity.Filters,
                    ExportFormat = entity.ExportFormat,
                    RecordCount = entity.RecordCount,
                    ExecutionTimeMs = entity.ExecutionTimeMs,
                    Success = entity.Success,
                    ErrorMessage = entity.ErrorMessage,
                    IpAddress = entity.IpAddress
                };

                return FMSResponse<ReportExecutionHistoryDTO>.Success(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging report execution");
                return FMSResponse<ReportExecutionHistoryDTO>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
