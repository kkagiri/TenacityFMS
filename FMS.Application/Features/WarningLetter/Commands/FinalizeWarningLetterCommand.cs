/**
 * File: FinalizeWarningLetterCommand.cs
 * Purpose: Locks a draft warning letter for final issue and delivery.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetter DTOs/entities
 * Last Modified: 2026-04-06
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Commands;

public record FinalizeWarningLetterCommand(int Id, string ModifiedBy) : IRequest<FMSResponse<WarningLetterDto>>;

public class FinalizeWarningLetterCommandHandler : IRequestHandler<FinalizeWarningLetterCommand, FMSResponse<WarningLetterDto>>
{
    private readonly GpsdataContext _context;

    public FinalizeWarningLetterCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<WarningLetterDto>> Handle(FinalizeWarningLetterCommand request, CancellationToken cancellationToken)
    {
        var warningLetter = await _context.WarningLetters.FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);
        if (warningLetter == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        if (warningLetter.Status != WarningLetterStatus.Draft)
        {
            return FMSResponse<WarningLetterDto>.BusinessLogicError("WARNING_LETTER_NOT_FINALIZABLE", "Only draft warning letters can be finalized.");
        }

        warningLetter.Status = WarningLetterStatus.Finalized;
        warningLetter.DateModified = DateTime.UtcNow;
        warningLetter.ModifiedBy = request.ModifiedBy;

        await _context.SaveChangesAsync(cancellationToken);

        var employee = await _context.Employees.FirstAsync(e => e.Id == warningLetter.EmployeeId, cancellationToken);
        var vehicle = await _context.Vehicles.FirstAsync(v => v.VehicleId == warningLetter.VehicleId, cancellationToken);
        var site = await _context.Sites.FirstAsync(s => s.Id == warningLetter.SiteId, cancellationToken);

        return FMSResponse<WarningLetterDto>.Success(CreateWarningLetterCommandHandler.MapToDto(warningLetter, employee, vehicle, site), "Warning letter finalized successfully");
    }
}