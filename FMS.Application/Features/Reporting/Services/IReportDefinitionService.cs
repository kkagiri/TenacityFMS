using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Reporting.DTOs;

namespace FMS.Application.Features.Reporting.Services
{
    /// <summary>
    /// Service for managing report definitions and templates
    /// </summary>
    public interface IReportDefinitionService
    {
        /// <summary>
        /// Get a specific report definition by ID
        /// </summary>
        Task<ReportDefinitionDTO?> GetReportDefinitionAsync(string reportId);

        /// <summary>
        /// Get all available report definitions
        /// </summary>
        Task<List<ReportDefinitionDTO>> GetAllReportDefinitionsAsync();

        /// <summary>
        /// Save a report template
        /// </summary>
        Task<ReportTemplateDTO> SaveReportTemplateAsync(SaveReportTemplateDTO template, string userId);

        /// <summary>
        /// Get report templates for a user
        /// </summary>
        Task<List<ReportTemplateDTO>> GetReportTemplatesAsync(string? userId, string? reportId, bool includeShared);

        /// <summary>
        /// Delete a report template
        /// </summary>
        Task<bool> DeleteReportTemplateAsync(string templateId, string userId);
    }
}
