/**
 * File: NotificationReportRenderer.cs
 * Purpose: Bridges notification scheduled-report rendering to the existing JsReport service.
 * Dependencies: IJsReportService, INotificationReportRenderer
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - RenderPdfAsync: Renders report template to PDF bytes.
 * - RenderExcelAsync: Renders report template to Excel bytes.
 * - RenderHtmlAsync: Renders report template to HTML string.
 */
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Services;

namespace FMS.WebClient.Services.Reporting
{
    public class NotificationReportRenderer : INotificationReportRenderer
    {
        private readonly IJsReportService _jsReportService;

        public NotificationReportRenderer(IJsReportService jsReportService)
        {
            _jsReportService = jsReportService;
        }

        public Task<byte[]> RenderPdfAsync(string templateName, object data)
        {
            return _jsReportService.RenderPdfAsync(templateName, data);
        }

        public Task<byte[]> RenderExcelAsync(string templateName, object data)
        {
            return _jsReportService.RenderExcelAsync(templateName, data);
        }

        public Task<string> RenderHtmlAsync(string templateName, object data)
        {
            return _jsReportService.RenderHtmlAsync(templateName, data);
        }
    }
}
