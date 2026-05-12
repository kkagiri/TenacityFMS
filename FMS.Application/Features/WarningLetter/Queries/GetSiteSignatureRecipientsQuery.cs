/**
 * File:          GetSiteSignatureRecipientsQuery.cs
 * Purpose:       Returns full signature recipient options (site reps + CC) by site ID.
 * Dependencies:  MediatR, GpsdataContext, WarningLetterRecipientGroupResolver
 * Last Modified: 2026-06-18
 *
 * Key Functions:
 * - Handle(): Resolves both site representatives and CC recipients for a given site
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter.Services;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Features.WarningLetter.Queries;

public record GetSiteSignatureRecipientsQuery(int SiteId) : IRequest<FMSResponse<WarningLetterSignatureRecipientOptionsDto>>;

public class GetSiteSignatureRecipientsQueryHandler : IRequestHandler<GetSiteSignatureRecipientsQuery, FMSResponse<WarningLetterSignatureRecipientOptionsDto>>
{
    private readonly GpsdataContext _context;

    public GetSiteSignatureRecipientsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<WarningLetterSignatureRecipientOptionsDto>> Handle(GetSiteSignatureRecipientsQuery request, CancellationToken cancellationToken)
    {
        var recipientOptions = await WarningLetterRecipientGroupResolver.GetRecipientOptionsAsync(_context, request.SiteId, cancellationToken);
        return FMSResponse<WarningLetterSignatureRecipientOptionsDto>.Success(recipientOptions);
    }
}
