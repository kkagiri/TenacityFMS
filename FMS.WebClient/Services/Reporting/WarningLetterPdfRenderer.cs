/**
 * File: WarningLetterPdfRenderer.cs
 * Purpose: Converts warning letter HTML into PDF bytes using the shared jsreport renderer.
 * Dependencies: IJsReportService, IWarningLetterPdfRenderer
 * Last Modified: 2026-04-06
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

    public Task<byte[]> RenderPdfAsync(string html, CancellationToken cancellationToken = default)
    {
        return _jsReportService.RenderInlinePdfAsync(html, new { });
    }
}