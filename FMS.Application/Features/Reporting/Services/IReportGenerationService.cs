using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Reporting.DTOs;

namespace FMS.Application.Features.Reporting.Services
{
    /// <summary>
    /// Service for generating reports in various formats
    /// </summary>
    public interface IReportGenerationService
    {
        /// <summary>
        /// Generate report data in JSON format
        /// </summary>
        Task<GenerateReportResponseDTO> GenerateJsonReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters);

        /// <summary>
        /// Generate report as Excel file
        /// </summary>
        Task<GenerateReportResponseDTO> GenerateExcelReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters);

        /// <summary>
        /// Generate report as PDF file
        /// </summary>
        Task<GenerateReportResponseDTO> GeneratePdfReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters);

        /// <summary>
        /// Generate report as CSV file
        /// </summary>
        Task<GenerateReportResponseDTO> GenerateCsvReportAsync(ReportDefinitionDTO reportDefinition, Dictionary<string, object>? filters);

        /// <summary>
        /// Fetch data from the report's data source endpoint
        /// </summary>
        Task<object?> FetchReportDataAsync(string dataSourceEndpoint, Dictionary<string, object>? filters);
    }
}
