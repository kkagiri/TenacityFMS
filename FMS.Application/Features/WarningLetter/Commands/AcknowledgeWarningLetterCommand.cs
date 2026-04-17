/**
 * File: AcknowledgeWarningLetterCommand.cs
 * Purpose: Marks a warning letter as acknowledged by the employee workflow.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetter DTOs/entities
 * Last Modified: 2026-04-06
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Commands;

public record AcknowledgeWarningLetterCommand(int Id, string ModifiedBy) : IRequest<FMSResponse<WarningLetterDto>>;

public class AcknowledgeWarningLetterCommandHandler : IRequestHandler<AcknowledgeWarningLetterCommand, FMSResponse<WarningLetterDto>>
{
    private readonly GpsdataContext _context;

    public AcknowledgeWarningLetterCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<WarningLetterDto>> Handle(AcknowledgeWarningLetterCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ModifiedBy))
        {
            return FMSResponse<WarningLetterDto>.ValidationFailed(new List<string> { "ModifiedBy is required." });
        }

        var warningLetter = await _context.WarningLetters.FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);
        if (warningLetter == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        var isCreator = string.Equals(warningLetter.CreatedBy, request.ModifiedBy, StringComparison.OrdinalIgnoreCase);
        if (!isCreator)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_ACKNOWLEDGE_FORBIDDEN", "Only the user who created this warning letter can acknowledge it.");
        }

        var alreadyAcknowledged = warningLetter.Status == WarningLetterStatus.Acknowledged;

        if (!warningLetter.SignedCopyUploadedAt.HasValue)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_NOT_ACKNOWLEDGEABLE", "Only signed warning letters can be acknowledged.");
        }

        if (!alreadyAcknowledged)
        {
            warningLetter.Status = WarningLetterStatus.Acknowledged;
            warningLetter.EmployeeAcknowledgedAt ??= DateTime.UtcNow;
            warningLetter.DateModified = DateTime.UtcNow;
            warningLetter.ModifiedBy = request.ModifiedBy;

            await _context.SaveChangesAsync(cancellationToken);
        }

        var employee = await _context.Employees.FirstAsync(e => e.Id == warningLetter.EmployeeId, cancellationToken);
        var vehicle = await _context.Vehicles.FirstAsync(v => v.VehicleId == warningLetter.VehicleId, cancellationToken);
        var site = await _context.Sites.FirstAsync(s => s.Id == warningLetter.SiteId, cancellationToken);

        return FMSResponse<WarningLetterDto>.Success(
            CreateWarningLetterCommandHandler.MapToDto(warningLetter, employee, vehicle, site),
            alreadyAcknowledged
                ? "Warning letter is already acknowledged"
                : "Warning letter acknowledged successfully");
    }
}