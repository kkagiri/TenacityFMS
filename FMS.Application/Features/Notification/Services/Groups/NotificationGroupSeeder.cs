using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Notification.Services.Groups {
    public static class NotificationGroupSeeder {
        public static async Task SeedAsync (GpsdataContext context, CancellationToken cancellationToken = default) {
            // Guard: only seed if none exist
            if (await context.NotificationGroups.AnyAsync (cancellationToken)) return;

            var now = DateTime.UtcNow;

            var groups = new List<NotificationGroup> {
                new NotificationGroup {
                Name = "All Site Managers",
                Description = "Managers at Site 1",
                SiteId = 1,
                AllowedDeliveryMethods = "System,Email",
                IsActive = true,
                CreatedBy = "System",
                CreatedAt = now,
                Members = new List<NotificationGroupMember> ()
                },
                new NotificationGroup {
                Name = "Global Operations",
                Description = "Cross-site ops leadership",
                SiteId = null,
                AllowedDeliveryMethods = "System,Email,SMS",
                IsActive = true,
                CreatedBy = "System",
                CreatedAt = now,
                Members = new List<NotificationGroupMember> ()
                }
            };

            // Persist groups first to get IDs
            await context.NotificationGroups.AddRangeAsync (groups, cancellationToken);
            await context.SaveChangesAsync (cancellationToken);

            // Add sample members: one role and one user per group (if they exist)
            // These are best-effort; skip if not found
            // Site group: add role "SiteManager" and any existing user id
            var anyUserId = await context.Users.Select (u => u.Id).FirstOrDefaultAsync (cancellationToken);
            if (!string.IsNullOrEmpty (anyUserId)) {
                var siteGroup = await context.NotificationGroups.FirstAsync (g => g.Name == "All Site Managers", cancellationToken);
                context.NotificationGroupMembers.Add (new NotificationGroupMember { GroupId = siteGroup.Id, MemberType = "User", MemberId = anyUserId });
            }

            // Global group: add role member
            var anyRole = await context.Roles.Select (r => r).FirstOrDefaultAsync (cancellationToken);
            if (anyRole != null) {
                var globalGroup = await context.NotificationGroups.FirstAsync (g => g.Name == "Global Operations", cancellationToken);
                context.NotificationGroupMembers.Add (new NotificationGroupMember { GroupId = globalGroup.Id, MemberType = "Role", MemberId = anyRole.Id });
            }

            await context.SaveChangesAsync (cancellationToken);

            // Map an active policy (if any) to each group
            var anyPolicy = await context.NotificationPolicies.Where (p => p.IsActive).Select (p => p).FirstOrDefaultAsync (cancellationToken);
            if (anyPolicy != null) {
                var groupIds = await context.NotificationGroups.Select (g => g.Id).ToListAsync (cancellationToken);
                foreach (var gid in groupIds) {
                    bool exists = await context.NotificationPolicyGroups.AnyAsync (pg => pg.PolicyId == anyPolicy.Id && pg.GroupId == gid, cancellationToken);
                    if (!exists) {
                        context.NotificationPolicyGroups.Add (new NotificationPolicyGroup {
                            PolicyId = anyPolicy.Id,
                                GroupId = gid,
                                AllowedDeliveryMethods = null // defer to group + policy
                        });
                    }
                }
                await context.SaveChangesAsync (cancellationToken);
            }
        }
    }
}