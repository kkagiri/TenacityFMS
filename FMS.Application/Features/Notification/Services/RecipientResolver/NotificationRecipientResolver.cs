using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Services.Businessfunction;
using FMS.Application.Features.Notification.Services.Groups;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services.RecipientResolver
{
    public class NotificationRecipientResolver : INotificationRecipientResolver
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<NotificationRecipientResolver> _logger;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly IBusinessFunctionNotificationService _businessFunctionService;

        public NotificationRecipientResolver(
            GpsdataContext context,
            ILogger<NotificationRecipientResolver> logger,
            UserManager<User> userManager,
            RoleManager<Role> roleManager,
            IBusinessFunctionNotificationService businessFunctionService)
        {
            _context = context;
            _logger = logger;
            _userManager = userManager;
            _roleManager = roleManager;
            _businessFunctionService = businessFunctionService;
        }

        public async Task<List<NotificationRecipientDto>> ResolveRecipientsAsync(
            CreateNotificationRequest request, CancellationToken cancellationToken = default)
        {

            List<NotificationRecipientDto> recipients = new List<NotificationRecipientDto>();
            HashSet<string> addedUserIds = new HashSet<string>();

            _logger.LogInformation("Starting recipient resolution for TriggerSource: {TriggerSource}, PolicyId: {PolicyId}, CategoryId: {CategoryId}",
                request.TriggerSource, request.NotificationPolicyId, request.CategoryId);

            /*
             * RECIPIENT RESOLUTION STRATEGY:
             *
             * ✅ RECOMMENDED FOR INTERNAL BUSINESS FUNCTIONS:
             *    - Use TriggerSource (e.g., "ClosingStock", "AutomatedReconciliation")
             *    - Configure Business Function Groups in the system
             *    - Dynamic recipient resolution based on site/context
             *
             * ✅ RECOMMENDED FOR ALARM/THRESHOLD NOTIFICATIONS:
             *    - Use NotificationPolicy with proper recipient rules
             *    - Configurable via frontend interface
             *    - Support for escalation and complex rules
             *
             * ❌ DEPRECATED:
             *    - Hardcoded Recipients in CreateNotificationRequest
             *    - Should only be used for backward compatibility
             */

            // 1. Explicit Recipients - Always process when provided
            // These are manually specified recipients that should ALWAYS be honored
            if (request.Recipients?.Any() == true)
            {
                _logger.LogInformation("Processing {Count} explicit recipients for notification (TriggerSource: {TriggerSource})",
                    request.Recipients.Count, request.TriggerSource);

                foreach (NotificationRecipientDto explicitRecipient in request.Recipients)
                {
                    if (string.IsNullOrWhiteSpace(explicitRecipient.UserId))
                    {
                        continue;
                    }

                    if (addedUserIds.Contains(explicitRecipient.UserId))
                    {
                        continue;
                    }

                    recipients.Add(new NotificationRecipientDto
                    {
                        UserId = explicitRecipient.UserId,
                        DeliveryMethods = explicitRecipient.DeliveryMethods?.Any() == true
                                ? explicitRecipient.DeliveryMethods
                                : new List<string> { "System" },
                        PriorityOverride = explicitRecipient.PriorityOverride,
                        ResolvedFrom = explicitRecipient.ResolvedFrom ?? "Explicit"
                    });
                    addedUserIds.Add(explicitRecipient.UserId);
                }

                // If explicit recipients provided with DisableFallbackAllUsers, return immediately
                // This is the intended behavior for targeted notifications like FuelImport
                if (request.DisableFallbackAllUsers && recipients.Any())
                {
                    _logger.LogInformation("Returning {Count} explicit recipients only (DisableFallbackAllUsers=true)", recipients.Count);
                    return recipients;
                }
            }

            // 2. Site Administrator
            if (request.SiteId.HasValue)
            {
                string? siteAdminId = await GetSiteAdministratorAsync(request.SiteId.Value, cancellationToken);
                if (!string.IsNullOrEmpty(siteAdminId) && !addedUserIds.Contains(siteAdminId))
                {
                    recipients.Add(new NotificationRecipientDto
                    {
                        UserId = siteAdminId,
                        DeliveryMethods = new List<string> { "System", "Email" },
                        ResolvedFrom = "SiteAdministrator"
                    });
                    addedUserIds.Add(siteAdminId);
                }
            }

            // 3a. Business Function Groups (PRIMARY for internal business functions)
            // ✅ RECOMMENDED: Use TriggerSource to resolve recipients for internal business functions
            // Examples: "ClosingStock", "AutomatedReconciliation", "DiscrepancyDetection"
            if (request.NotificationPolicyId == null && !string.IsNullOrEmpty(request.TriggerSource))
            {
                try
                {
                    _logger.LogInformation("Resolving recipients from business function groups for TriggerSource: {TriggerSource}, SiteId: {SiteId}",
                        request.TriggerSource, request.SiteId);

                    var businessFunctionRecipients = await _businessFunctionService.ResolveRecipientsFromTriggerSourceAsync(
                        request.TriggerSource,
                        request.SiteId,
                        request.Priority?.ToString(),
                        cancellationToken);

                    foreach (var bfRecipient in businessFunctionRecipients)
                    {
                        if (!addedUserIds.Contains(bfRecipient.UserId))
                        {
                            recipients.Add(new NotificationRecipientDto
                            {
                                UserId = bfRecipient.UserId,
                                DeliveryMethods = bfRecipient.DeliveryMethods,
                                PriorityOverride = bfRecipient.PriorityOverride,
                                ResolvedFrom = $"BusinessFunction-{request.TriggerSource}"
                            });
                            addedUserIds.Add(bfRecipient.UserId);
                        }
                    }

                    _logger.LogInformation("Added {Count} recipients from business function groups for TriggerSource: {TriggerSource}",
                        businessFunctionRecipients.Count, request.TriggerSource);

                    // If no business function recipients found, log warning for missing configuration
                    if (businessFunctionRecipients.Count == 0)
                    {
                        _logger.LogWarning("No business function groups configured for TriggerSource: {TriggerSource}, SiteId: {SiteId}. " +
                            "Consider setting up Business Function Groups for better recipient targeting.",
                            request.TriggerSource, request.SiteId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to resolve business function recipients for TriggerSource: {TriggerSource}", request.TriggerSource);
                }
            }

            // 3b. Policy Recipients - using CategoryId and optional Site scope
            List<NotificationPolicy> policies = await GetNotificationPoliciesAsync(request.CategoryId, request.SiteId, cancellationToken);
            foreach (NotificationPolicy policy in policies)
            {
                List<NotificationRecipientDto> policyRecipients = await GetPolicyRecipientsAsync(policy, cancellationToken);
                foreach (NotificationRecipientDto recipient in policyRecipients)
                {
                    if (!addedUserIds.Contains(recipient.UserId) && recipient.DeliveryMethods.Any())
                    {
                        recipients.Add(recipient);
                        addedUserIds.Add(recipient.UserId);
                    }
                }

                // 3c. Policy -> Group Mappings: expand groups to users
                List<NotificationPolicyGroup> policyGroupMappings = await _context.NotificationPolicyGroups
                    .Where(pg => pg.PolicyId == policy.Id)
                    .ToListAsync(cancellationToken);

                foreach (NotificationPolicyGroup mapping in policyGroupMappings)
                {
                    NotificationGroup? group = await _context.NotificationGroups
                        .Include(g => g.Members)
                        .FirstOrDefaultAsync(g => g.Id == mapping.GroupId, cancellationToken);
                    if (group == null) { continue; }

                    // Apply site scope: if group has SiteId and request has SiteId, ensure they match
                    if (group.SiteId.HasValue && request.SiteId.HasValue && group.SiteId.Value != request.SiteId.Value)
                    {
                        continue;
                    }

                    // Allowed methods cascade: start with group-level allowed methods if set, then mapping-level override, then policy channel flags, finally user preference intersection
                    List<string> groupAllowed = SplitMethods(group.AllowedDeliveryMethods);
                    List<string> mappingAllowed = SplitMethods(mapping.AllowedDeliveryMethods);

                    // Collect users from members
                    HashSet<string> userIds = new HashSet<string>();
                    foreach (NotificationGroupMember m in group.Members)
                    {
                        if (m.MemberType == "User" && !string.IsNullOrWhiteSpace(m.MemberId))
                        {
                            userIds.Add(m.MemberId);
                        }
                        else if (m.MemberType == "Role" && !string.IsNullOrWhiteSpace(m.MemberId))
                        {
                            // Expand role -> users (optionally scoped by site)
                            List<string> usersInRole = await GetUsersByRoleAsync(m.MemberId, request.SiteId, cancellationToken);
                            foreach (string uid in usersInRole) { userIds.Add(uid); }
                        }
                    }

                    foreach (string userId in userIds)
                    {
                        if (addedUserIds.Contains(userId)) { continue; }

                        // Start with default by priority
                        List<string> methods = await GetDeliveryMethodsForUserAsync(userId, request.Priority?.ToString() ?? "Medium", cancellationToken);

                        // Apply group allowed if present
                        if (groupAllowed.Any()) { methods = methods.Intersect(groupAllowed).Distinct().ToList(); }
                        // Apply mapping allowed if present
                        if (mappingAllowed.Any()) { methods = methods.Intersect(mappingAllowed).Distinct().ToList(); }

                        // Apply policy channel flags
                        methods = ApplyPolicyChannelFlags(methods, policy);

                        if (!methods.Any()) { continue; }

                        // Respect user preference for this category
                        object? prefObj = await GetUserNotificationPreferenceAsync(userId, request.CategoryId, cancellationToken);
                        if (prefObj is UserNotificationPreference pref)
                        {
                            if (!pref.IsEnabled) { continue; }
                            List<string> prefMethods = SplitMethods(pref.DeliveryMethods);
                            if (prefMethods.Any())
                            {
                                methods = methods.Intersect(prefMethods).Distinct().ToList();
                                if (!methods.Any()) { continue; }
                            }
                        }

                        recipients.Add(new NotificationRecipientDto { UserId = userId, DeliveryMethods = methods });
                        addedUserIds.Add(userId);
                    }
                }
            }

            // 4. Subscribed Users (UserNotificationPreference) not already added
            List<string> subscribedUsers = await GetSubscribedUsersAsync(request.CategoryId, request.SiteId, cancellationToken);
            foreach (string userId in subscribedUsers)
            {
                if (addedUserIds.Contains(userId))
                {
                    continue;
                }

                object? prefObj = await GetUserNotificationPreferenceAsync(userId, request.CategoryId, cancellationToken);
                if (prefObj is UserNotificationPreference pref)
                {
                    if (!pref.IsEnabled)
                    {
                        continue;
                    }

                    List<string> methods = SplitMethods(pref.DeliveryMethods);
                    if (methods.Count == 0)
                    {
                        methods = await GetDeliveryMethodsForUserAsync(userId, request.Priority?.ToString() ?? "Medium", cancellationToken);
                    }

                    if (methods.Any())
                    {
                        recipients.Add(new NotificationRecipientDto
                        {
                            UserId = userId,
                            DeliveryMethods = methods,
                            PriorityOverride = pref.Priority
                        });
                        addedUserIds.Add(userId);
                    }
                }
                else
                {
                    // No explicit preference row: use defaults by priority
                    List<string> methods = await GetDeliveryMethodsForUserAsync(userId, request.Priority?.ToString() ?? "Medium", cancellationToken);
                    if (methods.Any())
                    {
                        recipients.Add(new NotificationRecipientDto { UserId = userId, DeliveryMethods = methods });
                        addedUserIds.Add(userId);
                    }
                }
            }

            // 5. Fallback: If still no recipients resolved
            if (!recipients.Any())
            {
                // For internal business functions, recommend proper configuration instead of fallback
                if (request.NotificationPolicyId == null && !string.IsNullOrEmpty(request.TriggerSource))
                {
                    _logger.LogWarning("No recipients resolved for internal business function '{TriggerSource}' (Category {CategoryId}). " +
                        "RECOMMENDED: Configure Business Function Groups for TriggerSource '{TriggerSource}' instead of using fallback to all users. " +
                        "This ensures proper recipient targeting for business functions.",
                        request.TriggerSource, request.CategoryId, request.TriggerSource);
                }

                try
                {
                    // Feature flag / simple toggle: now controlled per request
                    bool fallbackAllUsers = !request.DisableFallbackAllUsers; // legacy default true
                    if (fallbackAllUsers)
                    {
                        _logger.LogInformation("No notification recipients resolved for Category {CategoryId}. Falling back to all users.", request.CategoryId);
                        // Pull user IDs; if there is an IsActive field you can filter here. For now, include all.
                        List<string> allUserIds = await _userManager.Users
                            .Select(u => u.Id)
                            .ToListAsync(cancellationToken);
                        foreach (string uid in allUserIds)
                        {
                            if (addedUserIds.Contains(uid))
                            {
                                continue;
                            }
                            List<string> methods = await GetDeliveryMethodsForUserAsync(uid, request.Priority?.ToString() ?? "Medium", cancellationToken);
                            if (!methods.Any())
                            {
                                continue;
                            }
                            recipients.Add(new NotificationRecipientDto
                            {
                                UserId = uid,
                                DeliveryMethods = methods,
                                ResolvedFrom = "Fallback-AllUsers"
                            });
                            addedUserIds.Add(uid);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("No recipients resolved and fallback to all users is disabled for Category {CategoryId}, TriggerSource: {TriggerSource}",
                            request.CategoryId, request.TriggerSource);
                    }
                }
                catch (System.Exception ex)
                {
                    _logger.LogError(ex, "Failed fallback-all-users recipient expansion.");
                }
            }

            return recipients;
        }

        public async Task<string?> GetSiteAdministratorAsync(int siteId, CancellationToken cancellationToken = default)
        {
            Domain.Entities.Site? site = await _context.Sites
                .Include(s => s.SiteAdministrator)
                .FirstOrDefaultAsync(s => s.Id == siteId, cancellationToken);
            return site?.SiteAdministratorId;
        }

        public async Task<List<string>> GetUsersByRoleAsync(string roleIdentifier, int? siteId, CancellationToken cancellationToken = default)
        {
            try
            {
                // Try resolve as RoleId first
                Role? role = await _roleManager.FindByIdAsync(roleIdentifier);
                if (role == null)
                {
                    // Fallback: treat identifier as role name
                    role = await _roleManager.FindByNameAsync(roleIdentifier);
                }

                if (role == null)
                {
                    _logger.LogWarning("Role not found for identifier {Identifier}", roleIdentifier);
                    return new List<string>();
                }

                string roleName = !string.IsNullOrWhiteSpace(role.Name) ? role.Name : roleIdentifier;
                System.Collections.Generic.IList<User> usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
                IEnumerable<User> filtered = usersInRole;

                if (siteId.HasValue)
                {
                    int site = siteId.Value;
                    // Filter users associated to site via UserSites
                    List<string> userIdsForSite = await _context.UserSites
                        .Where(us => us.SiteId == site)
                        .Select(us => us.UserId)
                        .Distinct()
                        .ToListAsync(cancellationToken);
                    HashSet<string> siteSet = new HashSet<string>(userIdsForSite);
                    filtered = usersInRole.Where(u => siteSet.Contains(u.Id));
                }

                return filtered.Select(u => u.Id).Distinct().ToList();
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error resolving users for role {Identifier}", roleIdentifier);
                return new List<string>();
            }
        }

        public async Task<List<string>> GetSubscribedUsersAsync(int category, int? siteId, CancellationToken cancellationToken = default)
        {
            // Note: UserNotificationPreference doesn't scope by site; include all enabled users for the category
            List<string> subscribedUsers = await _context.UserNotificationPreferences
                .Where(p => p.NotificationCategoryId == category && p.IsEnabled)
                .Select(p => p.UserId)
                .Distinct()
                .ToListAsync(cancellationToken);
            return subscribedUsers;
        }

        private async Task<List<NotificationPolicy>> GetNotificationPoliciesAsync(int categoryId, int? siteId, CancellationToken cancellationToken = default)
        {
            IQueryable<NotificationPolicy> query = _context.NotificationPolicies
                .Where(p => p.NotificationCategoryId == categoryId && p.IsActive);

            if (siteId.HasValue)
            {
                // Include global (null) and site-specific policies
                query = query.Where(p => p.SiteId == null || p.SiteId == siteId);
            }

            return await query.ToListAsync(cancellationToken);
        }

        public async Task<object?> GetUserNotificationPreferenceAsync(string userId, int category, CancellationToken cancellationToken = default)
        {
            object? preference = await _context.UserNotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId && p.NotificationCategoryId == category, cancellationToken);
            return preference;
        }

        public Task<List<string>> GetDeliveryMethodsForUserAsync(string userId, string priority, CancellationToken cancellationToken = default)
        {
            // Default delivery methods by priority when user preference is not present.
            List<string> defaultMethods = priority
            switch
            {
                "Critical" => new List<string> { "System", "Email", "SMS" },
                "High" => new List<string> { "System", "Email" },
                _ => new List<string> { "System", "Email" }
            };
            return Task.FromResult(defaultMethods);
        }

        private async Task<List<NotificationRecipientDto>> GetPolicyRecipientsAsync(
            NotificationPolicy policy, CancellationToken cancellationToken = default)
        {
            // Fetch active policy recipients
            List<NotificationPolicyRecipient> policyRecipients = await _context.NotificationPolicyRecipients
                .Where(r => r.NotificationPolicyId == policy.Id && r.IsActive)
                .ToListAsync(cancellationToken);

            List<NotificationRecipientDto> results = new List<NotificationRecipientDto>();

            foreach (NotificationPolicyRecipient pr in policyRecipients)
            {
                // Start with recipient-specific delivery methods
                List<string> methods = SplitMethods(pr.DeliveryMethods);

                // Constrain by policy channel flags
                methods = ApplyPolicyChannelFlags(methods, policy);

                if (methods.Count == 0)
                {
                    continue; // nothing to deliver
                }

                // Respect user preference if exists (may disable or change methods)
                UserNotificationPreference? pref = await _context.UserNotificationPreferences
                    .FirstOrDefaultAsync(p => p.UserId == pr.UserId && p.NotificationCategoryId == policy.NotificationCategoryId, cancellationToken);

                if (pref != null)
                {
                    if (!pref.IsEnabled)
                    {
                        continue; // user opted out
                    }

                    List<string> prefMethods = SplitMethods(pref.DeliveryMethods);
                    if (prefMethods.Any())
                    {
                        // Intersect policy-allowed methods with user preferences
                        methods = methods.Intersect(prefMethods).Distinct().ToList();
                        if (methods.Count == 0)
                        {
                            continue; // no overlap
                        }
                    }
                }

                results.Add(new NotificationRecipientDto
                {
                    UserId = pr.UserId,
                    DeliveryMethods = methods,
                    PriorityOverride = pr.PriorityOverride
                });
            }

            return results;
        }

        private static List<string> SplitMethods(string? methodsCsv)
        {
            if (string.IsNullOrWhiteSpace(methodsCsv))
            {
                return new List<string>();
            }

            return methodsCsv
                .Split(',', System.StringSplitOptions.RemoveEmptyEntries)
                .Select(m => m.Trim())
                .Where(m => !string.IsNullOrEmpty(m))
                .Distinct()
                .ToList();
        }

        private static List<string> ApplyPolicyChannelFlags(List<string> methods, NotificationPolicy policy)
        {
            // If the policy disables a channel, remove it from the methods list
            HashSet<string> allowed = new HashSet<string>();
            if (policy.EnableSystem) { allowed.Add("System"); }
            if (policy.EnableEmail) { allowed.Add("Email"); }
            if (policy.EnableSms) { allowed.Add("SMS"); }

            if (allowed.Count == 0)
            {
                return new List<string>();
            }

            return methods.Where(m => allowed.Contains(m)).Distinct().ToList();
        }
    }
}