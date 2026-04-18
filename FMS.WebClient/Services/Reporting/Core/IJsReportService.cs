using System.Threading.Tasks;

namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Interface for JsReport PDF/Excel report generation service
    /// </summary>
    public interface IJsReportService
    {
        /// <summary>
        /// Render a report template to PDF
        /// </summary>
        /// <param name="landscape">When true, renders in A4 landscape orientation.</param>
        Task<byte[]> RenderPdfAsync(string templateName, object data, bool landscape = false);

        /// <summary>
        /// Render a report template to Excel
        /// </summary>
        Task<byte[]> RenderExcelAsync(string templateName, object data);

        /// <summary>
        /// Render a report template to HTML (for preview)
        /// </summary>
        Task<string> RenderHtmlAsync(string templateName, object data);

        /// <summary>
        /// Render inline HTML template to PDF
        /// </summary>
        /// <param name="landscape">When true, renders in A4 landscape orientation.</param>
        Task<byte[]> RenderInlinePdfAsync(string htmlTemplate, object data, bool landscape = false);

        /// <summary>
        /// Get list of available report templates
        /// </summary>
        Task<IEnumerable<string>> GetTemplateListAsync();

        /// <summary>
        /// Get template content by name
        /// </summary>
        Task<string?> GetTemplateAsync(string templateName);

        /// <summary>
        /// Save or update a template
        /// </summary>
        Task SaveTemplateAsync(string templateName, string content);

        /// <summary>
        /// Delete a template
        /// </summary>
        Task<bool> DeleteTemplateAsync(string templateName);
    }
}
