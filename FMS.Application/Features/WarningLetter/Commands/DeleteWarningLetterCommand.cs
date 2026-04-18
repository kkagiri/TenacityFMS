/**
 * File: DeleteWarningLetterCommand.cs
 * Purpose: Deletes warning letters that have not reached signed or acknowledged workflow states, including stored draft and approved documents.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetterStatus, System.IO
 * Last Modified: 2026-04-14
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Commands;

public record DeleteWarningLetterCommand(int Id, string RequestedBy, bool CanDeleteAny) : IRequest<FMSResponse>;

public class DeleteWarningLetterCommandHandler : IRequestHandler<DeleteWarningLetterCommand, FMSResponse>
{
    private const string DefaultUploadedDocumentStoragePath = @"C:\FMSData\uploads\warning-letters";
    private const string UploadedDocumentRelativeRoot = "warning-letters";

    private readonly GpsdataContext _context;

    public DeleteWarningLetterCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse> Handle(DeleteWarningLetterCommand request, CancellationToken cancellationToken)
    {
        var warningLetter = await _context.WarningLetters.FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);
        if (warningLetter == null)
        {
            return FMSResponse.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (string.IsNullOrWhiteSpace(request.RequestedBy))
        {
            return FMSResponse.ValidationFailed(new List<string> { "RequestedBy is required." });
        }

        var isCreator = string.Equals(warningLetter.CreatedBy, request.RequestedBy, StringComparison.OrdinalIgnoreCase);
        if (!isCreator && !request.CanDeleteAny)
        {
            return FMSResponse.BusinessLogicError("WARNING_LETTER_DELETE_FORBIDDEN", "Only the user who created this warning letter can delete it unless they have the override delete permission.");
        }

        var hasLockedWorkflowArtifacts = warningLetter.SignedCopyUploadedAt.HasValue
            || warningLetter.EmployeeAcknowledgedAt.HasValue
            || warningLetter.Status == WarningLetterStatus.SignedCopyReceived
            || warningLetter.Status == WarningLetterStatus.Acknowledged;

        if (hasLockedWorkflowArtifacts)
        {
            return FMSResponse.BusinessLogicError("WARNING_LETTER_NOT_DELETABLE", "Warning letters cannot be deleted after a signed copy or acknowledgement has been recorded.");
        }

        DeleteFileIfExists(warningLetter.PdfFilePath);
        DeleteFileIfExists(GetUploadedDocumentFullPath(warningLetter.ApproveLetterFilePath));

        _context.WarningLetters.Remove(warningLetter);
        await _context.SaveChangesAsync(cancellationToken);

        return FMSResponse.SuccessResponse("Warning letter deleted successfully");
    }

    private static void DeleteFileIfExists(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return;
        }

        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch
        {
            // Preserve delete behavior even if the physical file is already missing or locked.
        }
    }

    private static string? GetUploadedDocumentFullPath(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return null;
        }

        var stripped = relativePath.StartsWith($"{UploadedDocumentRelativeRoot}/", StringComparison.OrdinalIgnoreCase)
            ? relativePath.Substring($"{UploadedDocumentRelativeRoot}/".Length)
            : relativePath;

        return Path.Combine(DefaultUploadedDocumentStoragePath, stripped.Replace('/', Path.DirectorySeparatorChar));
    }
}