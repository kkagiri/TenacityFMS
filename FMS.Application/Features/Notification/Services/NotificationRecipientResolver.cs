using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services {
    public class NotificationRecipientResolver : INotificationRecipientResolver {
        private readonly GpsdataContext _context;
        private readonly ILogger<NotificationRecipientResolver> _logger;

        public NotificationRecipientResolver (GpsdataContext context, ILogger<NotificationRecipientResolver> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<List<CreateNotificationRecipientRequest>> ResolveRecipientsAsync (
            CreateNotificationRequest request, CancellationToken cancellationToken = default) {
            var recipients = new List<CreateNotificationRecipientRequest> ();
            var addedUserIds = new HashSet<string> ();

            // 1. Site Administrator
            if (request.SiteId.HasValue) {
                var siteAdminId = await GetSiteAdministratorAsync (request.SiteId.Value, cancellationToken);
                if (!string.IsNullOrEmpty (siteAdminId) && !addedUserIds.Contains (siteAdminId)) {
                    recipients.Add (new CreateNotificationRecipientRequest {
                        UserId = siteAdminId,
                            DeliveryMethods = new List<string> { "System", "Email" }
                    });
                    addedUserIds.Add (siteAdminId);
                }
            }

            // 2. Policy Recipients
            var policies = await GetNotificationPoliciesAsync (request.Category, cancellationToken);
            foreach (var policy in policies) {
                var policyRecipients = await GetPolicyRecipientsAsync (policy, request.SiteId, cancellationToken);
                foreach (var recipient in policyRecipients) {
                    if (!addedUserIds.Contains (recipient.UserId)) {
                        recipients.Add (recipient);
                        addedUserIds.Add (recipient.UserId);
                    }
                }
            }

            return recipients;
        }

        public async Task<string?> GetSiteAdministratorAsync (int siteId, CancellationToken cancellationToken = default) {
            var site = await _context.Sites
                .Include (s => s.SiteAdministrator)
                .FirstOrDefaultAsync (s => s.Id == siteId, cancellationToken);
            return site?.SiteAdministratorId;
        }

        public async Task<List<string>> GetUsersByRoleAsync (string role, int? siteId, CancellationToken cancellationToken = default) {
            _logger.LogWarning ("GetUsersByRoleAsync not implemented for role {Role}", role);
            return new List<string> ();
        }

        public async Task<List<string>> GetSubscribedUsersAsync (int category, int? siteId, CancellationToken cancellationToken = default) {
            var subscribedUsers = await _context.UserNotificationPreferences
                .Where (p => p.NotificationCategoryId == category && p.IsEnabled)
                .Select (p => p.UserId)
                .Distinct ()
                .ToListAsync (cancellationToken);
            return subscribedUsers;
        }

        public async Task<List<object>> GetNotificationPoliciesAsync (int category, CancellationToken cancellationToken = default) {
            var policies = await _context.NotificationPolicies
                .Include (p => p.PolicyRecipients)
                .Where (p => p.Category == category && p.IsActive)
                .ToListAsync (cancellationToken);
            return policies.Cast<object> ().ToList ();
        }

        public async Task<object?> GetUserNotificationPreferenceAsync (string userId, int category, CancellationToken cancellationToken = default) {
            var preference = await _context.UserNotificationPreferences
                .FirstOrDefaultAsync (p => p.UserId == userId && p.NotificationCategoryId == category, cancellationToken);
            return preference;
        }

        public async Task<List<string>> GetDeliveryMethodsForUserAsync (string userId, string priority, CancellationToken cancellationToken = default) {
            var defaultMethods = priority
            switch {
            "Critical" => new List<string> { "System", "Email", "SMS" },
            "High" => new List<string> { "System", "Email" },
            _ => new List<string> { "System", "Email" }
            };
            return defaultMethods;
        }

        private async Task<List<CreateNotificationRecipientRequest>> GetPolicyRecipientsAsync (
            object policy, int? siteId, CancellationToken cancellationToken = default) {
            return new List<CreateNotificationRecipientRequest> ();
        }
    }
}