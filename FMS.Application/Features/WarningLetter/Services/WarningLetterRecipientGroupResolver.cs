/**
 * File: WarningLetterRecipientGroupResolver.cs
 * Purpose: Resolves warning-letter recipients from site-scoped notification groups.
 * Dependencies: GpsdataContext, NotificationGroups, WarningLetter recipient DTOs
 * Last Modified: 2026-04-11
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Services;

internal static class WarningLetterRecipientGroupResolver
{
    public const string SiteRepresentativesGroupName = "Warning Letter Site Representatives";
    public const string SignatureCcGroupName = "Warning Letter Signature CC";

    private const string SiteRepresentativesGroupDescription = "Configured site representatives that can receive warning letter signature requests.";
    private const string SignatureCcGroupDescription = "Configured CC recipients for warning letter signature request emails.";
    private const string SystemActor = "system";

    public static async Task<WarningLetterSignatureRecipientOptionsDto> GetRecipientOptionsAsync(GpsdataContext context, int siteId, CancellationToken cancellationToken = default)
    {
        var groupIds = await EnsureRecipientGroupsAsync(context, siteId, cancellationToken);
        var siteRepresentatives = await ResolveRecipientsForGroupAsync(context, siteId, groupIds[SiteRepresentativesGroupName], cancellationToken);
        var signatureCcRecipients = await ResolveRecipientsForGroupAsync(context, siteId, groupIds[SignatureCcGroupName], cancellationToken);

        return new WarningLetterSignatureRecipientOptionsDto
        {
            SiteRepresentativeGroupName = SiteRepresentativesGroupName,
            SignatureCcGroupName = SignatureCcGroupName,
            SiteRepresentatives = siteRepresentatives,
            SignatureCcRecipients = signatureCcRecipients
        };
    }

    public static async Task<List<WarningLetterSignatureRecipientDto>> GetSiteRepresentativeRecipientsAsync(GpsdataContext context, int siteId, CancellationToken cancellationToken = default)
    {
        var groupIds = await EnsureRecipientGroupsAsync(context, siteId, cancellationToken);
        return await ResolveRecipientsForGroupAsync(context, siteId, groupIds[SiteRepresentativesGroupName], cancellationToken);
    }

    private static async Task<Dictionary<string, int>> EnsureRecipientGroupsAsync(GpsdataContext context, int siteId, CancellationToken cancellationToken)
    {
        var groups = await context.NotificationGroups
            .Where(group => group.SiteId == siteId &&
                (group.Name == SiteRepresentativesGroupName || group.Name == SignatureCcGroupName))
            .ToListAsync(cancellationToken);

        var created = false;

        if (!groups.Any(group => string.Equals(group.Name, SiteRepresentativesGroupName, StringComparison.Ordinal)))
        {
            groups.Add(new NotificationGroup
            {
                Name = SiteRepresentativesGroupName,
                Description = SiteRepresentativesGroupDescription,
                SiteId = siteId,
                AllowedDeliveryMethods = "Email",
                IsActive = true,
                CreatedBy = SystemActor,
                CreatedAt = DateTime.UtcNow
            });
            created = true;
        }

        if (!groups.Any(group => string.Equals(group.Name, SignatureCcGroupName, StringComparison.Ordinal)))
        {
            groups.Add(new NotificationGroup
            {
                Name = SignatureCcGroupName,
                Description = SignatureCcGroupDescription,
                SiteId = siteId,
                AllowedDeliveryMethods = "Email",
                IsActive = true,
                CreatedBy = SystemActor,
                CreatedAt = DateTime.UtcNow
            });
            created = true;
        }

        if (created)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        return groups.ToDictionary(group => group.Name, group => group.Id, StringComparer.Ordinal);
    }

    private static async Task<List<WarningLetterSignatureRecipientDto>> ResolveRecipientsForGroupAsync(GpsdataContext context, int siteId, int groupId, CancellationToken cancellationToken)
    {
        var groupMembers = await context.NotificationGroupMembers
            .AsNoTracking()
            .Where(member => member.GroupId == groupId)
            .Select(member => new { member.MemberType, member.MemberId })
            .ToListAsync(cancellationToken);

        if (groupMembers.Count == 0)
        {
            return new List<WarningLetterSignatureRecipientDto>();
        }

        var userIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var memberId in groupMembers
                     .Where(member => string.Equals(member.MemberType, "User", StringComparison.OrdinalIgnoreCase))
                     .Select(member => member.MemberId)
                     .Where(memberId => !string.IsNullOrWhiteSpace(memberId)))
        {
            userIds.Add(memberId);
        }

        var roleIdentifiers = groupMembers
            .Where(member => string.Equals(member.MemberType, "Role", StringComparison.OrdinalIgnoreCase))
            .Select(member => member.MemberId)
            .Where(memberId => !string.IsNullOrWhiteSpace(memberId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (roleIdentifiers.Count > 0)
        {
            var roleIds = await context.Roles
                .AsNoTracking()
                .Where(role => roleIdentifiers.Contains(role.Id) || (role.Name != null && roleIdentifiers.Contains(role.Name)))
                .Select(role => role.Id)
                .Distinct()
                .ToListAsync(cancellationToken);

            if (roleIds.Count > 0)
            {
                var roleUserIds = await context.UserRoles
                    .AsNoTracking()
                    .Where(userRole => roleIds.Contains(userRole.RoleId))
                    .Join(
                        context.UserSites.AsNoTracking().Where(userSite => userSite.SiteId == siteId),
                        userRole => userRole.UserId,
                        userSite => userSite.UserId,
                        (userRole, userSite) => userRole.UserId)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                foreach (var roleUserId in roleUserIds)
                {
                    userIds.Add(roleUserId);
                }
            }
        }

        if (userIds.Count == 0)
        {
            return new List<WarningLetterSignatureRecipientDto>();
        }

        return await context.Users
            .AsNoTracking()
            .Where(user => userIds.Contains(user.Id) && user.IsDeleted != true && user.Email != null && user.Email != string.Empty)
            .Select(user => new WarningLetterSignatureRecipientDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                IsSiteAdmin = false
            })
            .OrderBy(recipient => recipient.UserName)
            .ThenBy(recipient => recipient.Email)
            .ToListAsync(cancellationToken);
    }
}