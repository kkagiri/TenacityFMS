/**
 * File: IWarningLetterPdfRenderer.cs
 * Purpose: Abstraction for converting warning letter HTML into PDF bytes.
 * Dependencies: System.Threading.Tasks
 * Last Modified: 2026-04-06
 */
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.WarningLetter.Services;

public interface IWarningLetterPdfRenderer
{
    Task<byte[]> RenderPdfAsync(string html, CancellationToken cancellationToken = default);
}