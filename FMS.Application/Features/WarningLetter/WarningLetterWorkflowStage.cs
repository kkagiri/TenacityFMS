/**
 * File: WarningLetterWorkflowStage.cs
 * Purpose: Defines the business workflow stages displayed for warning letters.
 * Dependencies: WarningLetter entity
 * Last Modified: 2026-04-11
 */
using FMS.Domain.Entities.Features.WarningLetterManagement;
using WarningLetterEntity = FMS.Domain.Entities.Features.WarningLetterManagement.WarningLetter;

namespace FMS.Application.Features.WarningLetter;

public enum WarningLetterWorkflowStage
{
    Draft = 0,
    Approved = 1,
    PendingSigned = 2,
    Signed = 3,
    Acknowledged = 4
}

public static class WarningLetterWorkflowStageResolver
{
    public static WarningLetterWorkflowStage Resolve(WarningLetterEntity warningLetter)
    {
        if (warningLetter.EmployeeAcknowledgedAt.HasValue || warningLetter.Status == WarningLetterStatus.Acknowledged)
        {
            return WarningLetterWorkflowStage.Acknowledged;
        }

        if (warningLetter.SignedCopyUploadedAt.HasValue)
        {
            return WarningLetterWorkflowStage.Signed;
        }

        if (warningLetter.SignatureRequestedAt.HasValue)
        {
            return WarningLetterWorkflowStage.PendingSigned;
        }

        if (warningLetter.ApproveLetterUploadedAt.HasValue)
        {
            return WarningLetterWorkflowStage.Approved;
        }

        return WarningLetterWorkflowStage.Draft;
    }
}