/**
 * File: INotificationReportRenderer.cs
 * Purpose: Abstraction for rendering scheduled report templates into HTML/PDF/Excel.
 * Dependencies: System.Threading.Tasks
 * Last Modified: 2026-02-07
 */
using System.Threading.Tasks;

namespace FMS.Application.Features.Notification.Services
{
    public interface INotificationReportRenderer
    {
        Task<byte[]> RenderPdfAsync(string templateName, object data);
        Task<byte[]> RenderExcelAsync(string templateName, object data);
        Task<string> RenderHtmlAsync(string templateName, object data);
    }
}
