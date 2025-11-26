using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Features.Reporting.DTOs;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Reporting.Services
{
    /// <summary>
    /// Service for generating reports in various formats
    /// This is a stub implementation - enhance as needed for production use
    /// </summary>
    public class ReportGenerationService : IReportGenerationService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ReportGenerationService> _logger;

        public ReportGenerationService(
            IHttpClientFactory httpClientFactory,
            ILogger<ReportGenerationService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<GenerateReportResponseDTO> GenerateJsonReportAsync(
            ReportDefinitionDTO reportDefinition,
            Dictionary<string, object>? filters)
        {
            try
            {
                var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);

                return new GenerateReportResponseDTO
                {
                    Success = true,
                    Data = data,
                    Metadata = new ReportMetadata
                    {
                        TotalRecords = GetRecordCount(data)
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating JSON report");
                return new GenerateReportResponseDTO
                {
                    Success = false,
                    Message = $"Error generating report: {ex.Message}"
                };
            }
        }

        public async Task<GenerateReportResponseDTO> GenerateExcelReportAsync(
            ReportDefinitionDTO reportDefinition,
            Dictionary<string, object>? filters)
        {
            try
            {
                // For Excel export, you can:
                // 1. Use a library like EPPlus or ClosedXML
                // 2. Return data as JSON and let frontend handle export (recommended for DevExtreme)
                // 3. Generate Excel on backend

                // For now, return JSON data and let DevExtreme handle export on frontend
                var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);

                return new GenerateReportResponseDTO
                {
                    Success = true,
                    Data = data,
                    Message = "Use frontend DevExtreme export for Excel generation",
                    Metadata = new ReportMetadata
                    {
                        TotalRecords = GetRecordCount(data)
                    }
                };

                // TODO: Implement server-side Excel generation if needed
                // Example with EPPlus:
                // using (var package = new ExcelPackage())
                // {
                //     var worksheet = package.Workbook.Worksheets.Add(reportDefinition.ReportName);
                //     // Add headers and data
                //     return new GenerateReportResponseDTO
                //     {
                //         Success = true,
                //         FileContent = package.GetAsByteArray(),
                //         FileName = $"{reportDefinition.ExportOptions?.DefaultFileName ?? "report"}_{DateTime.Now:yyyyMMdd}.xlsx",
                //         ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                //     };
                // }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Excel report");
                return new GenerateReportResponseDTO
                {
                    Success = false,
                    Message = $"Error generating Excel report: {ex.Message}"
                };
            }
        }

        public async Task<GenerateReportResponseDTO> GeneratePdfReportAsync(
            ReportDefinitionDTO reportDefinition,
            Dictionary<string, object>? filters)
        {
            try
            {
                // TODO: Implement PDF generation
                // You can use libraries like:
                // - iTextSharp
                // - PdfSharp
                // - QuestPDF
                // - Telerik Reporting

                var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);

                return new GenerateReportResponseDTO
                {
                    Success = false,
                    Message = "PDF generation not implemented yet. Use frontend export or implement server-side PDF generation.",
                    Data = data
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating PDF report");
                return new GenerateReportResponseDTO
                {
                    Success = false,
                    Message = $"Error generating PDF report: {ex.Message}"
                };
            }
        }

        public async Task<GenerateReportResponseDTO> GenerateCsvReportAsync(
            ReportDefinitionDTO reportDefinition,
            Dictionary<string, object>? filters)
        {
            try
            {
                var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);

                if (data == null)
                {
                    return new GenerateReportResponseDTO
                    {
                        Success = false,
                        Message = "No data available for CSV export"
                    };
                }

                // Simple CSV generation
                var csv = GenerateCsvContent(data, reportDefinition.Columns);
                var csvBytes = Encoding.UTF8.GetBytes(csv);

                return new GenerateReportResponseDTO
                {
                    Success = true,
                    FileContent = csvBytes,
                    FileName = $"{reportDefinition.ExportOptions?.DefaultFileName ?? "report"}_{DateTime.Now:yyyyMMdd}.csv",
                    ContentType = "text/csv",
                    Metadata = new ReportMetadata
                    {
                        TotalRecords = GetRecordCount(data)
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating CSV report");
                return new GenerateReportResponseDTO
                {
                    Success = false,
                    Message = $"Error generating CSV report: {ex.Message}"
                };
            }
        }

        public async Task<object?> FetchReportDataAsync(string dataSourceEndpoint, Dictionary<string, object>? filters)
        {
            try
            {
                // Build query string from filters
                var queryString = BuildQueryString(filters);
                var url = $"{dataSourceEndpoint}{queryString}";

                // Note: This assumes you have an HttpClient that can make internal API calls
                // You may need to adjust this based on your application architecture
                // Alternative: Inject IMediator and send queries directly

                var client = _httpClientFactory.CreateClient("InternalApi");
                var response = await client.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<object>(content);
                }

                _logger.LogWarning("Failed to fetch report data from {Endpoint}: {StatusCode}", url, response.StatusCode);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching report data from {Endpoint}", dataSourceEndpoint);
                throw;
            }
        }

        private string BuildQueryString(Dictionary<string, object>? filters)
        {
            if (filters == null || filters.Count == 0)
                return string.Empty;

            var queryParams = filters
                .Where(kvp => kvp.Value != null)
                .Select(kvp => $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value.ToString() ?? string.Empty)}");

            return "?" + string.Join("&", queryParams);
        }

        private int GetRecordCount(object? data)
        {
            if (data == null)
                return 0;

            // Try to get count from collection
            if (data is System.Collections.IEnumerable enumerable)
            {
                return enumerable.Cast<object>().Count();
            }

            return 1;
        }

        private string GenerateCsvContent(object data, List<ReportColumnDTO>? columns)
        {
            var sb = new StringBuilder();

            // Add headers
            if (columns != null && columns.Any())
            {
                var headers = columns.Where(c => c.Visible).Select(c => EscapeCsvValue(c.Caption));
                sb.AppendLine(string.Join(",", headers));
            }

            // Add data rows
            if (data is System.Collections.IEnumerable enumerable)
            {
                foreach (var item in enumerable)
                {
                    var itemType = item.GetType();
                    var values = new List<string>();

                    if (columns != null && columns.Any())
                    {
                        foreach (var column in columns.Where(c => c.Visible))
                        {
                            var property = itemType.GetProperty(column.DataField);
                            var value = property?.GetValue(item)?.ToString() ?? string.Empty;
                            values.Add(EscapeCsvValue(value));
                        }
                    }

                    sb.AppendLine(string.Join(",", values));
                }
            }

            return sb.ToString();
        }

        private string EscapeCsvValue(string value)
        {
            if (string.IsNullOrEmpty(value))
                return string.Empty;

            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (value.Contains(",") || value.Contains("\"") || value.Contains("\n"))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }

            return value;
        }
    }
}
