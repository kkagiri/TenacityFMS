/**
 * File: IWarningLetterService.cs
 * Purpose: Coordinates warning letter HTML preview, PDF generation, and email delivery workflows.
 * Dependencies: FMSResponse, warning letter DTOs
 * Last Modified: 2026-04-11
 */
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;

namespace FMS.Application.Features.WarningLetter.Services;

public interface IWarningLetterService
{
    Task<FMSResponse<string>> PreviewHtmlAsync(CreateWarningLetterDto request, CancellationToken cancellationToken = default);
    Task<FMSResponse<string>> GetHtmlAsync(int warningLetterId, CancellationToken cancellationToken = default);
    Task<FMSResponse<WarningLetterDocumentDto>> GeneratePdfAsync(int warningLetterId, string? modifiedBy = null, CancellationToken cancellationToken = default);
    Task<FMSResponse<WarningLetterDocumentDto>> GetPdfAsync(int warningLetterId, CancellationToken cancellationToken = default);
    Task<FMSResponse> SendEmailAsync(int warningLetterId, string modifiedBy, string? emailRecipient = null, CancellationToken cancellationToken = default);
    Task<FMSResponse<WarningLetterDto>> RequestSignatureAsync(int warningLetterId, string modifiedBy, RequestWarningLetterSignatureDto request, CancellationToken cancellationToken = default);
    Task<FMSResponse<WarningLetterDto>> UploadApproveLetterAsync(int warningLetterId, IFormFile file, string uploadedBy, CancellationToken cancellationToken = default);
    Task<FMSResponse<WarningLetterDocumentDto>> GetApproveLetterAsync(int warningLetterId, CancellationToken cancellationToken = default);
    Task<FMSResponse<WarningLetterDto>> UploadSignedCopyAsync(int warningLetterId, IFormFile file, string uploadedBy, CancellationToken cancellationToken = default);
    Task<FMSResponse<WarningLetterDocumentDto>> GetSignedCopyAsync(int warningLetterId, CancellationToken cancellationToken = default);
}