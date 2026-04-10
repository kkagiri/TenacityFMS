/**
 * File: IWarningLetterPdfRenderer.cs
 * Purpose: Abstraction for rendering warning letters through the shared jsreport template pipeline.
 * Dependencies: System.Threading.Tasks
 * Last Modified: 2026-04-07
 */
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.WarningLetter.Services;

public interface IWarningLetterPdfRenderer
{
    Task<string> RenderHtmlAsync(string templateName, object data, CancellationToken cancellationToken = default);
    Task<byte[]> RenderPdfAsync(string templateName, object data, CancellationToken cancellationToken = default);
}