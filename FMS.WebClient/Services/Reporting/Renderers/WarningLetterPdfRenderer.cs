/**
 * File: WarningLetterPdfRenderer.cs
 * Purpose: Renders warning letters through the shared jsreport template engine for HTML and PDF output.
 * Dependencies: IJsReportService, IWarningLetterPdfRenderer
 * Last Modified: 2026-04-07
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.WarningLetter.Services;

namespace FMS.WebClient.Services.Reporting;

public class WarningLetterPdfRenderer : IWarningLetterPdfRenderer
{
    private readonly IJsReportService _jsReportService;

    public WarningLetterPdfRenderer(IJsReportService jsReportService)
    {
        _jsReportService = jsReportService;
    }

    public Task<string> RenderHtmlAsync(string templateName, object data, CancellationToken cancellationToken = default)
    {
        return _jsReportService.RenderHtmlAsync(templateName, data);
    }

    public Task<byte[]> RenderPdfAsync(string templateName, object data, CancellationToken cancellationToken = default)
    {
        return _jsReportService.RenderPdfAsync(templateName, data);
    }
}