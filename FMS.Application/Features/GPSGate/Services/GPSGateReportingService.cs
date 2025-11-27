using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Persistence.DataAccess;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.GPSGate.Services
{
    public class GPSGateReportingService : IGPSGateReportingService
    {
        private GPSGateReportingSoapHttpClient? _reportingClient;
        private readonly GpsdataContext _context;
        private readonly ILogger<GPSGateReportingService> _logger;
        private ProviderConfigurationEntity? _providerConfig;
        private GPSGateProviderSettings? _settings;

        public GPSGateReportingService(
            GpsdataContext context,
            ILogger<GPSGateReportingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private async Task<bool> InitializeClientAsync()
        {
            if (_reportingClient != null)
                return true;

            try
            {
                // Get GPSGate SOAP provider configuration from database
                _providerConfig = await _context.ProviderConfigurations
                    .Where(pc => pc.Name == "GPSGateSOAP" && pc.IsEnabled && !pc.IsDeleted)
                    .OrderByDescending(pc => pc.Priority)
                    .FirstOrDefaultAsync();

                if (_providerConfig == null)
                {
                    _logger.LogError("GPSGate SOAP provider configuration not found in database. Please add a record with Name='GPSGateSOAP' to provider_configurations table.");
                    return false;
                }

                // Parse settings JSON
                _settings = JsonSerializer.Deserialize<GPSGateProviderSettings>(_providerConfig.Settings);
                if (_settings == null || string.IsNullOrEmpty(_settings.BaseUrl))
                {
                    _logger.LogError($"Invalid settings in provider configuration ID {_providerConfig.Id}. Settings JSON: {_providerConfig.Settings}");
                    return false;
                }

                // Validate URL format
                if (!Uri.TryCreate(_settings.BaseUrl, UriKind.Absolute, out var validatedUri) ||
                    (validatedUri.Scheme != Uri.UriSchemeHttp && validatedUri.Scheme != Uri.UriSchemeHttps))
                {
                    _logger.LogError($"BaseUrl in provider configuration is not a valid HTTP/HTTPS URL: {_settings.BaseUrl}");
                    return false;
                }

                // Create direct HTTP SOAP client (bypasses broken WCF client)
                _reportingClient = new GPSGateReportingSoapHttpClient(_settings.BaseUrl, _logger);

                _logger.LogInformation($"GPSGate HTTP SOAP Reporting client initialized with BaseUrl: {_settings.BaseUrl}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing GPSGate SOAP Reporting client");
                return false;
            }
        }

        public async Task<GenerateReportResponseDto> GenerateReportAsync(string sessionId, int reportId, DateTime startDate, DateTime endDate, string? jobId = null)
        {
            if (!await InitializeClientAsync() || _reportingClient == null)
            {
                return new GenerateReportResponseDto
                {
                    Success = false,
                    Message = "GPSGate SOAP Reporting service not initialized"
                };
            }

            try
            {
                _logger.LogInformation($"Generating report {reportId} from {startDate} to {endDate}");

                var (success, handleId, message) = await _reportingClient.GenerateReportAsync(
                    sessionId, reportId, startDate, endDate);

                if (!success || !handleId.HasValue)
                {
                    _logger.LogError($"Report generation failed: {message}");
                    return new GenerateReportResponseDto
                    {
                        Success = false,
                        Message = message
                    };
                }

                // Save report request to database
                var report = new Domain.Entities.GPSGate.GPSGateReport
                {
                    ReportId = reportId,
                    HandleId = handleId.Value,
                    JobId = jobId, // Store the GUID job identifier for tracking cancellation
                    SessionId = sessionId,
                    StartDate = startDate,
                    EndDate = endDate,
                    Status = "Processing",
                    RequestedAt = DateTime.UtcNow
                };

                _context.GPSGateReports.Add(report);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Report generation initiated with handle ID: {handleId.Value}");

                return new GenerateReportResponseDto
                {
                    HandleId = handleId.Value,
                    Success = true,
                    Message = "Report generation initiated"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating report {reportId}");
                return new GenerateReportResponseDto
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<ReportStatusDto> GetReportStatusAsync(string sessionId, int handleId)
        {
            if (!await InitializeClientAsync() || _reportingClient == null)
                throw new InvalidOperationException("GPSGate SOAP Reporting service not initialized");

            try
            {
                _logger.LogInformation($"Checking status for report handle: {handleId}");

                var (success, status, progress, message) = await _reportingClient.GetReportStatusAsync(sessionId, handleId);

                if (!success)
                {
                    throw new Exception(message);
                }

                // Update database
                var report = await _context.GPSGateReports
                    .FirstOrDefaultAsync(r => r.HandleId == handleId);

                if (report != null)
                {
                    report.Status = status ?? "Unknown";

                    // GPSGate returns "Done" when report is ready
                    var completedStatuses = new[] { "Completed", "Done", "Ready" };
                    if (completedStatuses.Any(s => s.Equals(status, StringComparison.OrdinalIgnoreCase)))
                    {
                        report.CompletedAt = DateTime.UtcNow;
                    }
                    await _context.SaveChangesAsync();
                }

                return new ReportStatusDto
                {
                    HandleId = handleId,
                    Status = status ?? "Unknown",
                    Progress = progress,
                    Message = $"Report is {status}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking report status for handle: {handleId}");
                throw;
            }
        }

        public async Task<FetchReportResponseDto> FetchReportAsync(string sessionId, int handleId)
        {
            if (!await InitializeClientAsync() || _reportingClient == null)
            {
                return new FetchReportResponseDto
                {
                    Success = false,
                    Message = "GPSGate SOAP Reporting service not initialized"
                };
            }

            try
            {
                _logger.LogInformation($"Fetching report data for handle: {handleId}");

                var (success, reportData, message) = await _reportingClient.FetchReportAsync(sessionId, handleId);

                if (!success)
                {
                    // Update error in database
                    var failedReport = await _context.GPSGateReports
                        .FirstOrDefaultAsync(r => r.HandleId == handleId);

                    if (failedReport != null)
                    {
                        failedReport.Status = "Failed";
                        failedReport.ErrorMessage = message;
                        await _context.SaveChangesAsync();
                    }

                    return new FetchReportResponseDto
                    {
                        Success = false,
                        Message = message
                    };
                }

                // Update database
                var report = await _context.GPSGateReports
                    .FirstOrDefaultAsync(r => r.HandleId == handleId);

                if (report != null)
                {
                    report.ReportData = reportData;
                    report.Status = "Completed";
                    report.CompletedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation($"Report data fetched successfully for handle: {handleId}");

                return new FetchReportResponseDto
                {
                    ReportData = reportData,
                    Success = true,
                    Message = "Report fetched successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching report for handle: {handleId}");

                // Update error in database
                var report = await _context.GPSGateReports
                    .FirstOrDefaultAsync(r => r.HandleId == handleId);

                if (report != null)
                {
                    report.Status = "Failed";
                    report.ErrorMessage = ex.Message;
                    await _context.SaveChangesAsync();
                }

                return new FetchReportResponseDto
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<bool> CancelReportAsync(string sessionId, int handleId)
        {
            if (!await InitializeClientAsync() || _reportingClient == null)
            {
                _logger.LogError("GPSGate SOAP Reporting service not initialized");
                return false;
            }

            try
            {
                _logger.LogInformation($"Cancelling report for handle: {handleId}");

                var (success, message) = await _reportingClient.CancelReportAsync(sessionId, handleId);

                if (!success)
                {
                    _logger.LogError($"Failed to cancel report: {message}");
                    return false;
                }

                // Update database
                var report = await _context.GPSGateReports
                    .FirstOrDefaultAsync(r => r.HandleId == handleId);

                if (report != null)
                {
                    report.Status = "Cancelled";
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation($"Report cancelled successfully for handle: {handleId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling report for handle: {handleId}");
                return false;
            }
        }
    }
}
