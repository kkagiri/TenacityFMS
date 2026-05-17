using System.Text;
using System.Text.Json;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Application.Features.Reporting.Services;

namespace FMS.WebClient.Services.Reporting;

public class ReportGenerationService : IReportGenerationService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ReportGenerationService> _logger;

    public ReportGenerationService(IHttpClientFactory httpClientFactory, ILogger<ReportGenerationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<GenerateReportResponseDTO> GenerateJsonReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters)
    {
        var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);
        return CreateResponse(reportDefinition, data, "application/json", "json", JsonSerializer.SerializeToUtf8Bytes(data, JsonOptions));
    }

    public async Task<GenerateReportResponseDTO> GenerateExcelReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters)
    {
        var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);
        var content = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(data, JsonOptions));
        return CreateResponse(reportDefinition, data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx", content);
    }

    public async Task<GenerateReportResponseDTO> GeneratePdfReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters)
    {
        var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);
        var content = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(data, JsonOptions));
        return CreateResponse(reportDefinition, data, "application/pdf", "pdf", content);
    }

    public async Task<GenerateReportResponseDTO> GenerateCsvReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters)
    {
        var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);
        var content = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(data, JsonOptions));
        return CreateResponse(reportDefinition, data, "text/csv", "csv", content);
    }

    public async Task<object?> FetchReportDataAsync(string dataSourceEndpoint, Dictionary<string, object>? filters)
    {
        if (string.IsNullOrWhiteSpace(dataSourceEndpoint))
        {
            return Array.Empty<object>();
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            var requestUri = BuildRequestUri(dataSourceEndpoint, filters);
            var response = await client.GetAsync(requestUri);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<object>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unable to fetch report data from {DataSourceEndpoint}", dataSourceEndpoint);
            return Array.Empty<object>();
        }
    }

    private static string BuildRequestUri(string dataSourceEndpoint, Dictionary<string, object>? filters)
    {
        if (filters == null || filters.Count == 0)
        {
            return dataSourceEndpoint;
        }

        var separator = dataSourceEndpoint.Contains('?') ? '&' : '?';
        var query = string.Join("&", filters.Select(filter =>
            $"{Uri.EscapeDataString(filter.Key)}={Uri.EscapeDataString(filter.Value?.ToString() ?? string.Empty)}"));

        return $"{dataSourceEndpoint}{separator}{query}";
    }

    private static GenerateReportResponseDTO CreateResponse(
        ReportDefinitionDTO reportDefinition,
        object? data,
        string contentType,
        string extension,
        byte[] fileContent)
    {
        return new GenerateReportResponseDTO
        {
            Success = true,
            Message = "Report generated successfully",
            Data = data,
            FileContent = fileContent,
            FileName = $"{reportDefinition.ExportOptions?.DefaultFileName ?? reportDefinition.ReportId}.{extension}",
            ContentType = contentType,
            Metadata = new ReportMetadata
            {
                ReportId = reportDefinition.ReportId,
                ReportName = reportDefinition.ReportName,
                GeneratedAt = DateTime.UtcNow,
                TotalRecords = data is System.Collections.ICollection collection ? collection.Count : 0
            }
        };
    }
}
