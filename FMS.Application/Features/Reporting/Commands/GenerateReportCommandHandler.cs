using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Application.Features.Reporting.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Handler for generating reports
    /// </summary>
    public class GenerateReportCommandHandler : IRequestHandler<GenerateReportCommand, GenerateReportResponseDTO>
    {
        private readonly IReportDefinitionService _reportDefinitionService;
        private readonly IReportGenerationService _reportGenerationService;
        private readonly ILogger<GenerateReportCommandHandler> _logger;

        public GenerateReportCommandHandler(
            IReportDefinitionService reportDefinitionService,
            IReportGenerationService reportGenerationService,
            ILogger<GenerateReportCommandHandler> logger)
        {
            _reportDefinitionService = reportDefinitionService;
            _reportGenerationService = reportGenerationService;
            _logger = logger;
        }

        public async Task<GenerateReportResponseDTO> Handle(GenerateReportCommand request, CancellationToken cancellationToken)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // Get report definition
                var reportDefinition = await _reportDefinitionService.GetReportDefinitionAsync(request.ReportId);

                if (reportDefinition == null)
                {
                    return new GenerateReportResponseDTO
                    {
                        Success = false,
                        Message = $"Report definition not found: {request.ReportId}"
                    };
                }

                // Generate report based on format
                var result = request.ExportFormat.ToLower() switch
                {
                    "excel" => await _reportGenerationService.GenerateExcelReportAsync(reportDefinition, request.Filters),
                    "pdf" => await _reportGenerationService.GeneratePdfReportAsync(reportDefinition, request.Filters),
                    "csv" => await _reportGenerationService.GenerateCsvReportAsync(reportDefinition, request.Filters),
                    _ => await _reportGenerationService.GenerateJsonReportAsync(reportDefinition, request.Filters)
                };

                stopwatch.Stop();

                // Add metadata
                if (result.Success && result.Metadata != null)
                {
                    result.Metadata.ReportId = request.ReportId;
                    result.Metadata.ReportName = reportDefinition.ReportName;
                    result.Metadata.GeneratedBy = request.UserId ?? "System";
                    result.Metadata.ExecutionTime = stopwatch.Elapsed;
                    result.Metadata.AppliedFilters = request.Filters;
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating report {ReportId}", request.ReportId);
                return new GenerateReportResponseDTO
                {
                    Success = false,
                    Message = $"Error generating report: {ex.Message}"
                };
            }
        }
    }

    /// <summary>
    /// Handler for saving report templates
    /// </summary>
    public class SaveReportTemplateCommandHandler : IRequestHandler<SaveReportTemplateCommand, ReportTemplateDTO>
    {
        private readonly IReportDefinitionService _reportService;
        private readonly ILogger<SaveReportTemplateCommandHandler> _logger;

        public SaveReportTemplateCommandHandler(
            IReportDefinitionService reportService,
            ILogger<SaveReportTemplateCommandHandler> logger)
        {
            _reportService = reportService;
            _logger = logger;
        }

        public async Task<ReportTemplateDTO> Handle(SaveReportTemplateCommand request, CancellationToken cancellationToken)
        {
            try
            {
                return await _reportService.SaveReportTemplateAsync(request.Template, request.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving report template");
                throw;
            }
        }
    }

    /// <summary>
    /// Handler for deleting report templates
    /// </summary>
    public class DeleteReportTemplateCommandHandler : IRequestHandler<DeleteReportTemplateCommand, bool>
    {
        private readonly IReportDefinitionService _reportService;
        private readonly ILogger<DeleteReportTemplateCommandHandler> _logger;

        public DeleteReportTemplateCommandHandler(
            IReportDefinitionService reportService,
            ILogger<DeleteReportTemplateCommandHandler> logger)
        {
            _reportService = reportService;
            _logger = logger;
        }

        public async Task<bool> Handle(DeleteReportTemplateCommand request, CancellationToken cancellationToken)
        {
            try
            {
                return await _reportService.DeleteReportTemplateAsync(request.TemplateId, request.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting report template {TemplateId}", request.TemplateId);
                return false;
            }
        }
    }
}
