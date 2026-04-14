/**
 * File: GetWarningLetterSignatureRecipientsQuery.cs
 * Purpose: Returns site-assigned users that can receive warning letter signature requests.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, warning letter DTOs
 * Last Modified: 2026-04-09
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FMS.Application.Features.WarningLetter.Services;

namespace FMS.Application.Features.WarningLetter.Queries;

public record GetWarningLetterSignatureRecipientsQuery(int WarningLetterId) : IRequest<FMSResponse<WarningLetterSignatureRecipientOptionsDto>>;

public class GetWarningLetterSignatureRecipientsQueryHandler : IRequestHandler<GetWarningLetterSignatureRecipientsQuery, FMSResponse<WarningLetterSignatureRecipientOptionsDto>>
{
    private readonly GpsdataContext _context;

    public GetWarningLetterSignatureRecipientsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<WarningLetterSignatureRecipientOptionsDto>> Handle(GetWarningLetterSignatureRecipientsQuery request, CancellationToken cancellationToken)
    {
        var siteId = await _context.WarningLetters
            .AsNoTracking()
            .Where(w => w.Id == request.WarningLetterId)
            .Select(w => (int?)w.SiteId)
            .FirstOrDefaultAsync(cancellationToken);

        if (!siteId.HasValue)
        {
            return FMSResponse<WarningLetterSignatureRecipientOptionsDto>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        var recipientOptions = await WarningLetterRecipientGroupResolver.GetRecipientOptionsAsync(_context, siteId.Value, cancellationToken);

        return FMSResponse<WarningLetterSignatureRecipientOptionsDto>.Success(recipientOptions);
    }
}