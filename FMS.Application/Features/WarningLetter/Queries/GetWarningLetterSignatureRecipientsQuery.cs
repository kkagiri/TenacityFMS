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

namespace FMS.Application.Features.WarningLetter.Queries;

public record GetWarningLetterSignatureRecipientsQuery(int WarningLetterId) : IRequest<FMSResponse<List<WarningLetterSignatureRecipientDto>>>;

public class GetWarningLetterSignatureRecipientsQueryHandler : IRequestHandler<GetWarningLetterSignatureRecipientsQuery, FMSResponse<List<WarningLetterSignatureRecipientDto>>>
{
    private readonly GpsdataContext _context;

    public GetWarningLetterSignatureRecipientsQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<WarningLetterSignatureRecipientDto>>> Handle(GetWarningLetterSignatureRecipientsQuery request, CancellationToken cancellationToken)
    {
        var siteId = await _context.WarningLetters
            .AsNoTracking()
            .Where(w => w.Id == request.WarningLetterId)
            .Select(w => (int?)w.SiteId)
            .FirstOrDefaultAsync(cancellationToken);

        if (!siteId.HasValue)
        {
            return FMSResponse<List<WarningLetterSignatureRecipientDto>>.NotFound("WARNING_LETTER_NOT_FOUND", "Warning letter not found");
        }

        var siteAdminIds = await _context.Sites
            .AsNoTracking()
            .Where(s => s.SiteAdministratorId != null)
            .Select(s => s.SiteAdministratorId!)
            .Distinct()
            .ToListAsync(cancellationToken);

        var siteAdminSet = siteAdminIds.ToHashSet();

        var recipients = await _context.UserSites
            .AsNoTracking()
            .Where(us => us.SiteId == siteId.Value)
            .Join(
                _context.Users.AsNoTracking().Where(u => u.IsDeleted != true && u.Email != null && u.Email != string.Empty),
                us => us.UserId,
                user => user.Id,
                (us, user) => new WarningLetterSignatureRecipientDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    IsSiteAdmin = siteAdminSet.Contains(user.Id)
                })
            .GroupBy(x => new { x.Id, x.UserName, x.Email, x.IsSiteAdmin })
            .Select(g => new WarningLetterSignatureRecipientDto
            {
                Id = g.Key.Id,
                UserName = g.Key.UserName,
                Email = g.Key.Email,
                IsSiteAdmin = g.Key.IsSiteAdmin
            })
            .OrderByDescending(x => x.IsSiteAdmin)
            .ThenBy(x => x.UserName)
            .ToListAsync(cancellationToken);

        return FMSResponse<List<WarningLetterSignatureRecipientDto>>.Success(recipients);
    }
}