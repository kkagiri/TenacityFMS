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

    public async Task<GenerateReportResponseDTO> GenerateJsonReportAsync(
        ReportDefinitionDTO reportDefinition,
        Dictionary<string, object>? filters)
    {
        var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);
        var recordCount = CountRecords(data);

        return new GenerateReportResponseDTO
        {
            Success = true,
            Message = "Report generated successfully",
            Data = data,
            ContentType = "application/json",
            Metadata = CreateMetadata(recordCount)
        };
    }

    public async Task<GenerateReportResponseDTO> GenerateExcelReportAsync(
        ReportDefinitionDTO reportDefinition,
        Dictionary<string, object>? filters)
    {
        var csv = await BuildCsvAsync(reportDefinition, filters);

        return new GenerateReportResponseDTO
        {
            Success = true,
            Message = "Report generated successfully",
            FileContent = Encoding.UTF8.GetBytes(csv.Content),
            FileName = $"{GetFileName(reportDefinition)}.csv",
            ContentType = "text/csv",
            Metadata = CreateMetadata(csv.RecordCount)
        };
    }

    public async Task<GenerateReportResponseDTO> GeneratePdfReportAsync(
        ReportDefinitionDTO reportDefinition,
        Dictionary<string, object>? filters)
    {
        var data = await FetchReportDataAsync(reportDefinition.DataSourceEndpoint, filters);
        var json = JsonSerializer.Serialize(data, JsonOptions);

        return new GenerateReportResponseDTO
        {
            Success = true,
            Message = "PDF generation is handled by the JsReport pipeline; returning JSON payload.",
            Data = data,
            FileContent = Encoding.UTF8.GetBytes(json),
            FileName = $"{GetFileName(reportDefinition)}.json",
            ContentType = "application/json",
            Metadata = CreateMetadata(CountRecords(data))
        };
    }

    public async Task<GenerateReportResponseDTO> GenerateCsvReportAsync(
        ReportDefinitionDTO reportDefinition,
        Dictionary<string, object>? filters)
    {
        var csv = await BuildCsvAsync(reportDefinition, filters);

        return new GenerateReportResponseDTO
        {
            Success = true,
            Message = "Report generated successfully",
            FileContent = Encoding.UTF8.GetBytes(csv.Content),
            FileName = $"{GetFileName(reportDefinition)}.csv",
            ContentType = "text/csv",
            Metadata = CreateMetadata(csv.RecordCount)
        };
    }

    public Task<object?> FetchReportDataAsync(string dataSourceEndpoint, Dictionary<string, object>? filters)
    {
        return Task.FromResult<object?>(new
        {
            dataSourceEndpoint,
            filters,
            generatedAt = DateTime.UtcNow
        });
    }

    private static async Task<(string Content, int RecordCount)> BuildCsvAsync(
        ReportDefinitionDTO reportDefinition,
        Dictionary<string, object>? filters)
    {
        var data = await Task.FromResult(new Dictionary<string, object?>
        {
            ["reportId"] = reportDefinition.ReportId,
            ["reportName"] = reportDefinition.ReportName,
            ["dataSourceEndpoint"] = reportDefinition.DataSourceEndpoint,
            ["filters"] = filters == null ? "" : JsonSerializer.Serialize(filters, JsonOptions)
        });

        var header = string.Join(",", data.Keys.Select(EscapeCsv));
        var row = string.Join(",", data.Values.Select(value => EscapeCsv(value?.ToString() ?? "")));
        return ($"{header}{Environment.NewLine}{row}{Environment.NewLine}", 1);
    }

    private static ReportMetadata CreateMetadata(int recordCount)
    {
        return new ReportMetadata
        {
            GeneratedAt = DateTime.UtcNow,
            TotalRecords = recordCount
        };
    }

    private static int CountRecords(object? data)
    {
        return data is System.Collections.IEnumerable enumerable && data is not string
            ? enumerable.Cast<object>().Count()
            : data == null ? 0 : 1;
    }

    private static string GetFileName(ReportDefinitionDTO reportDefinition)
    {
        return string.IsNullOrWhiteSpace(reportDefinition.ExportOptions?.DefaultFileName)
            ? reportDefinition.ReportId
            : reportDefinition.ExportOptions.DefaultFileName;
    }

    private static string EscapeCsv(string value)
    {
        return $"\"{value.Replace("\"", "\"\"")}\"";
    }
}
