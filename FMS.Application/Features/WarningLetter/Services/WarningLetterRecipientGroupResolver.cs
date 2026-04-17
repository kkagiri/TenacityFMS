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
    private const string LegacySiteRepresentativesGroupName = "Warning Letter Site Representatives";
    private const string LegacySignatureCcGroupName = "Warning Letter Signature CC";
    private const string SiteRepresentativesGroupSuffix = "Site Representatives";
    private const string SignatureCcGroupSuffix = "Signature CC";

    private const string SiteRepresentativesGroupDescription = "Configured site representatives that can receive warning letter signature requests.";
    private const string SignatureCcGroupDescription = "Configured CC recipients for warning letter signature request emails.";
    private const string SystemActor = "system";

    private enum WarningLetterGroupRole
    {
        SiteRepresentatives,
        SignatureCc
    }

    private sealed class ResolvedWarningLetterGroups
    {
        public int SiteRepresentativesGroupId { get; init; }
        public int SignatureCcGroupId { get; init; }
        public string SiteRepresentativesGroupName { get; init; } = string.Empty;
        public string SignatureCcGroupName { get; init; } = string.Empty;
    }

    public static async Task<WarningLetterSignatureRecipientOptionsDto> GetRecipientOptionsAsync(GpsdataContext context, int siteId, CancellationToken cancellationToken = default)
    {
        var resolvedGroups = await EnsureRecipientGroupsAsync(context, siteId, cancellationToken);
        var siteRepresentatives = await ResolveRecipientsForGroupAsync(context, siteId, resolvedGroups.SiteRepresentativesGroupId, cancellationToken);
        var signatureCcRecipients = await ResolveRecipientsForGroupAsync(context, siteId, resolvedGroups.SignatureCcGroupId, cancellationToken);

        return new WarningLetterSignatureRecipientOptionsDto
        {
            SiteRepresentativeGroupName = resolvedGroups.SiteRepresentativesGroupName,
            SignatureCcGroupName = resolvedGroups.SignatureCcGroupName,
            SiteRepresentatives = siteRepresentatives,
            SignatureCcRecipients = signatureCcRecipients
        };
    }

    public static async Task<List<WarningLetterSignatureRecipientDto>> GetSiteRepresentativeRecipientsAsync(GpsdataContext context, int siteId, CancellationToken cancellationToken = default)
    {
        var resolvedGroups = await EnsureRecipientGroupsAsync(context, siteId, cancellationToken);
        return await ResolveRecipientsForGroupAsync(context, siteId, resolvedGroups.SiteRepresentativesGroupId, cancellationToken);
    }

    private static async Task<ResolvedWarningLetterGroups> EnsureRecipientGroupsAsync(GpsdataContext context, int siteId, CancellationToken cancellationToken)
    {
        var siteName = await context.Sites
            .AsNoTracking()
            .Where(site => site.Id == siteId)
            .Select(site => site.Name)
            .FirstOrDefaultAsync(cancellationToken);

        var normalizedSiteName = string.IsNullOrWhiteSpace(siteName)
            ? $"Site {siteId}"
            : siteName.Trim();

        var groups = await context.NotificationGroups
            .Where(group => group.SiteId == siteId)
            .ToListAsync(cancellationToken);

        var siteRepresentativesGroup = SelectPreferredGroup(groups, WarningLetterGroupRole.SiteRepresentatives, normalizedSiteName);
        var signatureCcGroup = SelectPreferredGroup(groups, WarningLetterGroupRole.SignatureCc, normalizedSiteName);
        var changed = false;

        if (siteRepresentativesGroup == null)
        {
            siteRepresentativesGroup = new NotificationGroup
            {
                Name = BuildGroupName(normalizedSiteName, WarningLetterGroupRole.SiteRepresentatives),
                Description = SiteRepresentativesGroupDescription,
                SiteId = siteId,
                AllowedDeliveryMethods = "Email",
                IsActive = true,
                CreatedBy = SystemActor,
                CreatedAt = DateTime.UtcNow
            };
            groups.Add(siteRepresentativesGroup);
            context.NotificationGroups.Add(siteRepresentativesGroup);
            changed = true;
        }
        else
        {
            changed |= SyncGroupMetadata(siteRepresentativesGroup, normalizedSiteName, WarningLetterGroupRole.SiteRepresentatives);
        }

        if (signatureCcGroup == null)
        {
            signatureCcGroup = new NotificationGroup
            {
                Name = BuildGroupName(normalizedSiteName, WarningLetterGroupRole.SignatureCc),
                Description = SignatureCcGroupDescription,
                SiteId = siteId,
                AllowedDeliveryMethods = "Email",
                IsActive = true,
                CreatedBy = SystemActor,
                CreatedAt = DateTime.UtcNow
            };
            groups.Add(signatureCcGroup);
            context.NotificationGroups.Add(signatureCcGroup);
            changed = true;
        }
        else
        {
            changed |= SyncGroupMetadata(signatureCcGroup, normalizedSiteName, WarningLetterGroupRole.SignatureCc);
        }

        if (changed)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        return new ResolvedWarningLetterGroups
        {
            SiteRepresentativesGroupId = siteRepresentativesGroup.Id,
            SignatureCcGroupId = signatureCcGroup.Id,
            SiteRepresentativesGroupName = siteRepresentativesGroup.Name,
            SignatureCcGroupName = signatureCcGroup.Name
        };
    }

    private static NotificationGroup? SelectPreferredGroup(IEnumerable<NotificationGroup> groups, WarningLetterGroupRole role, string siteName)
    {
        var expectedName = BuildGroupName(siteName, role);
        var expectedDescription = GetGroupDescription(role);

        return groups.FirstOrDefault(group => string.Equals(group.Name, expectedName, StringComparison.OrdinalIgnoreCase))
            ?? groups.FirstOrDefault(group => string.Equals(group.Description, expectedDescription, StringComparison.OrdinalIgnoreCase))
            ?? groups.FirstOrDefault(group => string.Equals(group.Name, GetLegacyGroupName(role), StringComparison.OrdinalIgnoreCase))
            ?? groups.FirstOrDefault(group => IsRoleMatch(group, role));
    }

    private static bool SyncGroupMetadata(NotificationGroup group, string siteName, WarningLetterGroupRole role)
    {
        var expectedName = BuildGroupName(siteName, role);
        var expectedDescription = GetGroupDescription(role);
        var changed = false;

        if (!string.Equals(group.Name, expectedName, StringComparison.Ordinal))
        {
            group.Name = expectedName;
            changed = true;
        }

        if (!string.Equals(group.Description, expectedDescription, StringComparison.Ordinal))
        {
            group.Description = expectedDescription;
            changed = true;
        }

        if (!string.Equals(group.AllowedDeliveryMethods, "Email", StringComparison.OrdinalIgnoreCase))
        {
            group.AllowedDeliveryMethods = "Email";
            changed = true;
        }

        if (!group.IsActive)
        {
            group.IsActive = true;
            changed = true;
        }

        if (changed)
        {
            group.UpdatedBy = SystemActor;
            group.UpdatedAt = DateTime.UtcNow;
        }

        return changed;
    }

    private static bool IsRoleMatch(NotificationGroup group, WarningLetterGroupRole role)
    {
        var description = group.Description?.Trim();
        var name = group.Name?.Trim();

        if (string.Equals(description, GetGroupDescription(role), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(name, GetLegacyGroupName(role), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return role switch
        {
            WarningLetterGroupRole.SiteRepresentatives => !string.IsNullOrWhiteSpace(name)
                && name.EndsWith($" {SiteRepresentativesGroupSuffix}", StringComparison.OrdinalIgnoreCase),
            WarningLetterGroupRole.SignatureCc => !string.IsNullOrWhiteSpace(name)
                && name.EndsWith($" {SignatureCcGroupSuffix}", StringComparison.OrdinalIgnoreCase),
            _ => false
        };
    }

    private static string BuildGroupName(string siteName, WarningLetterGroupRole role)
    {
        var suffix = role == WarningLetterGroupRole.SiteRepresentatives
            ? SiteRepresentativesGroupSuffix
            : SignatureCcGroupSuffix;

        return $"{siteName} {suffix}";
    }

    private static string GetGroupDescription(WarningLetterGroupRole role) =>
        role == WarningLetterGroupRole.SiteRepresentatives
            ? SiteRepresentativesGroupDescription
            : SignatureCcGroupDescription;

    private static string GetLegacyGroupName(WarningLetterGroupRole role) =>
        role == WarningLetterGroupRole.SiteRepresentatives
            ? LegacySiteRepresentativesGroupName
            : LegacySignatureCcGroupName;

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