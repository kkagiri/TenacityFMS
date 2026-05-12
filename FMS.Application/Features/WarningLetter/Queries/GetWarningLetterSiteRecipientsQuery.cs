/**
 * File: GetWarningLetterSiteRecipientsQuery.cs
 * Purpose: Returns site-assigned users that can be preselected as warning letter recipients before send.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, warning letter DTOs
 * Last Modified: 2026-04-11
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FMS.Application.Features.WarningLetter.Services;

namespace FMS.Application.Features.WarningLetter.Queries;

public record GetWarningLetterSiteRecipientsQuery(int SiteId) : IRequest<FMSResponse<List<WarningLetterSignatureRecipientDto>>>;

public class GetWarningLetterSiteRecipientsQueryHandler : IRequestHandler<GetWarningLetterSiteRecipientsQuery, FMSResponse<List<WarningLetterSignatureRecipientDto>>>
{
    private readonly GpsdataContext _context;

    public GetWarningLetterSiteRecipientsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<WarningLetterSignatureRecipientDto>>> Handle(GetWarningLetterSiteRecipientsQuery request, CancellationToken cancellationToken)
    {
        var siteExists = await _context.Sites.AsNoTracking().AnyAsync(site => site.Id == request.SiteId, cancellationToken);
        if (!siteExists)
        {
            return FMSResponse<List<WarningLetterSignatureRecipientDto>>.NotFound("WARNING_LETTER_SITE_NOT_FOUND", "Site not found");
        }

        var recipients = await WarningLetterRecipientGroupResolver.GetSiteRepresentativeRecipientsAsync(_context, request.SiteId, cancellationToken);

        return FMSResponse<List<WarningLetterSignatureRecipientDto>>.Success(recipients);
    }
}