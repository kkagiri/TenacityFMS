using FMS.Application.Common;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Application.Features.GPSGate.Processors;
using FMS.Application.Features.GPSGate.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace FMS.Application.Features.GPSGate.Queries
{
    /// <summary>
    /// Handler for processing reports with specific type
    /// </summary>
    /// <typeparam name="T">The DTO type for the report data</typeparam>
    public class ProcessReportQueryHandler<T> : IRequestHandler<ProcessReportQuery<T>, FMSResponse<ProcessedReportDto<T>>>
        where T : class
    {
        private readonly ITrackingReportService _reportingService;
        private readonly ITrackingDirectoryService _directoryService;
        private readonly IReportProcessorFactory _processorFactory;
        private readonly GpsdataContext _context;
        private readonly ILogger<ProcessReportQueryHandler<T>> _logger;

        public ProcessReportQueryHandler(
            ITrackingReportService reportingService,
            ITrackingDirectoryService directoryService,
            IReportProcessorFactory processorFactory,
            GpsdataContext context,
            ILogger<ProcessReportQueryHandler<T>> logger)
        {
            _reportingService = reportingService;
            _directoryService = directoryService;
            _processorFactory = processorFactory;
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<ProcessedReportDto<T>>> Handle(
            ProcessReportQuery<T> request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation($"Processing report {request.ReportId} with handle {request.HandleId}");

                // Validate session
                var session = await _directoryService.ValidateSessionAsync(request.SessionId);
                if (session == null)
                {
                    return FMSResponse<ProcessedReportDto<T>>.Failed("Invalid or expired session");
                }

                // Check if processor exists for this report type
                if (!_processorFactory.HasProcessor(request.ReportId))
                {
                    return FMSResponse<ProcessedReportDto<T>>.Failed(
                        $"No processor available for report ID {request.ReportId}. " +
                        $"Supported reports: {string.Join(", ", _processorFactory.GetSupportedReportIds())}");
                }

                // Get report from database
                var report = await _context.GPSGateReports
                    .FirstOrDefaultAsync(r => r.HandleId == request.HandleId, cancellationToken);

                if (report == null)
                {
                    return FMSResponse<ProcessedReportDto<T>>.Failed($"Report with handle ID {request.HandleId} not found");
                }

                // Check if report is completed - GPSGate returns "Done" or "Completed"
                var completedStatuses = new[] { "Completed", "Done", "Ready" };
                if (!completedStatuses.Any(s => s.Equals(report.Status, StringComparison.OrdinalIgnoreCase)))
                {
                    return FMSResponse<ProcessedReportDto<T>>.Failed(
                        $"Report is not completed. Current status: {report.Status}");
                }

                // Get report data
                string reportXmlString = report.ReportData;

                // If data not in database, fetch from GPSGate
                if (string.IsNullOrEmpty(reportXmlString))
                {
                    _logger.LogInformation($"Fetching report data from GPSGate for handle {request.HandleId}");
                    var fetchResponse = await _reportingService.FetchReportAsync(request.SessionId, request.HandleId);
                    reportXmlString = fetchResponse.ReportData;

                    // Update database with fetched data
                    report.ReportData = reportXmlString;
                    await _context.SaveChangesAsync(cancellationToken);
                }

                // Parse XML
                var reportXml = XDocument.Load(new StringReader(reportXmlString));

                // Get processor with scope and process report
                var (processor, scope) = _processorFactory.GetProcessorWithScope<T>(request.ReportId);
                try
                {
                    var parsedData = processor.ProcessReport(reportXml);

                    // Create response
                    var result = new ProcessedReportDto<T>
                    {
                        ReportId = request.ReportId,
                        ReportName = processor.ReportName,
                        HandleId = request.HandleId,
                        TotalRows = parsedData.Count,
                        Data = parsedData
                    };

                    _logger.LogInformation($"Successfully processed report {request.ReportId} with {result.TotalRows} rows");

                    return FMSResponse<ProcessedReportDto<T>>.Success(
                        result,
                        $"Successfully processed {processor.ReportName} with {result.TotalRows} rows");
                }
                finally
                {
                    scope.Dispose();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing report {request.ReportId}");
                return FMSResponse<ProcessedReportDto<T>>.Failed($"Error processing report: {ex.Message}");
            }
        }
    }
}
