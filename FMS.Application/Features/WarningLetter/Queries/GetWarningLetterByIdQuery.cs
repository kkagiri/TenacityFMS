/**
 * File: GetWarningLetterByIdQuery.cs
 * Purpose: Returns a detailed warning letter record by identifier.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetter DTOs
 * Last Modified: 2026-04-06
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.Commands;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Queries;

public record GetWarningLetterByIdQuery(int Id) : IRequest<FMSResponse<WarningLetterDto>>;

public class GetWarningLetterByIdQueryHandler : IRequestHandler<GetWarningLetterByIdQuery, FMSResponse<WarningLetterDto>>
{
    private readonly GpsdataContext _context;

    public GetWarningLetterByIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<WarningLetterDto>> Handle(GetWarningLetterByIdQuery request, CancellationToken cancellationToken)
    {
        var warningLetter = await _context.WarningLetters
            .AsNoTracking()
            .Include(w => w.Employee)
            .Include(w => w.Vehicle)
            .Include(w => w.Site)
            .FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);

        if (warningLetter == null)
        {
            return FMSResponse<WarningLetterDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        return FMSResponse<WarningLetterDto>.Success(CreateWarningLetterCommandHandler.MapToDto(warningLetter, warningLetter.Employee, warningLetter.Vehicle, warningLetter.Site));
    }
}