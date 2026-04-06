/**
 * File: DeleteWarningLetterCommand.cs
 * Purpose: Deletes draft warning letters that have not entered a finalized workflow state.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetterStatus
 * Last Modified: 2026-04-06
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Commands;

public record DeleteWarningLetterCommand(int Id) : IRequest<FMSResponse>;

public class DeleteWarningLetterCommandHandler : IRequestHandler<DeleteWarningLetterCommand, FMSResponse>
{
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

        if (warningLetter.Status != WarningLetterStatus.Draft)
        {
            return FMSResponse.BusinessLogicError("WARNING_LETTER_NOT_DELETABLE", "Only draft warning letters can be deleted.");
        }

        _context.WarningLetters.Remove(warningLetter);
        await _context.SaveChangesAsync(cancellationToken);

        return FMSResponse.SuccessResponse("Warning letter deleted successfully");
    }
}