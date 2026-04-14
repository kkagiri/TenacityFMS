/**
 * File: ResetWarningLetterWorkflowArtifactsCommand.cs
 * Purpose: Clears uploaded warning-letter workflow artifacts so existing letters can restart approval and acknowledgment from a clean state.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetterStatus, System.IO
 * Last Modified: 2026-04-14
 */
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Commands;

public record ResetWarningLetterWorkflowArtifactsCommand(string ModifiedBy) : IRequest<FMSResponse>;

public class ResetWarningLetterWorkflowArtifactsCommandHandler : IRequestHandler<ResetWarningLetterWorkflowArtifactsCommand, FMSResponse>
{
    private const string DefaultUploadedDocumentStoragePath = @"C:\FMSData\uploads\warning-letters";
    private const string UploadedDocumentRelativeRoot = "warning-letters";

    private readonly GpsdataContext _context;

    public ResetWarningLetterWorkflowArtifactsCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse> Handle(ResetWarningLetterWorkflowArtifactsCommand request, CancellationToken cancellationToken)
    {
        var warningLetters = await _context.WarningLetters
            .Where(w =>
                w.ApproveLetterUploadedAt.HasValue
                || !string.IsNullOrWhiteSpace(w.ApproveLetterFilePath)
                || w.SignatureRequestedAt.HasValue
                || !string.IsNullOrWhiteSpace(w.SignatureRequestRecipientUserId)
                || w.SignedCopyUploadedAt.HasValue
                || !string.IsNullOrWhiteSpace(w.SignedCopyFilePath)
                || w.EmployeeAcknowledgedAt.HasValue
                || w.Status == WarningLetterStatus.Sent
                || w.Status == WarningLetterStatus.SignedCopyReceived
                || w.Status == WarningLetterStatus.Acknowledged)
            .ToListAsync(cancellationToken);

        if (warningLetters.Count == 0)
        {
            return FMSResponse.SuccessResponse("No warning-letter workflow artifacts were found to clear.");
        }

        var now = DateTime.UtcNow;

        foreach (var warningLetter in warningLetters)
        {
            DeleteFileIfExists(GetUploadedDocumentFullPath(warningLetter.ApproveLetterFilePath));
            DeleteFileIfExists(GetUploadedDocumentFullPath(warningLetter.SignedCopyFilePath));

            warningLetter.ApproveLetterFileName = null;
            warningLetter.ApproveLetterStoredFileName = null;
            warningLetter.ApproveLetterFilePath = null;
            warningLetter.ApproveLetterContentType = null;
            warningLetter.ApproveLetterFileSize = null;
            warningLetter.ApproveLetterUploadedAt = null;
            warningLetter.ApproveLetterUploadedBy = null;

            warningLetter.SignatureRequestRecipientUserId = null;
            warningLetter.SignatureRequestRecipient = null;
            warningLetter.SignatureRequestCcUserIds = null;
            warningLetter.SignatureRequestCcRecipients = null;
            warningLetter.SignatureRequestedAt = null;
            warningLetter.SignatureRequestedBy = null;

            warningLetter.SignedCopyFileName = null;
            warningLetter.SignedCopyStoredFileName = null;
            warningLetter.SignedCopyFilePath = null;
            warningLetter.SignedCopyContentType = null;
            warningLetter.SignedCopyFileSize = null;
            warningLetter.SignedCopyUploadedAt = null;
            warningLetter.SignedCopyUploadedBy = null;

            warningLetter.EmployeeAcknowledgedAt = null;
            warningLetter.Status = warningLetter.Status == WarningLetterStatus.Draft
                ? WarningLetterStatus.Draft
                : WarningLetterStatus.Finalized;
            warningLetter.DateModified = now;
            warningLetter.ModifiedBy = request.ModifiedBy;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return FMSResponse.SuccessResponse($"Cleared warning-letter workflow artifacts for {warningLetters.Count} record(s).");
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
            // Keep the database reset moving even if a physical file is already missing or locked.
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