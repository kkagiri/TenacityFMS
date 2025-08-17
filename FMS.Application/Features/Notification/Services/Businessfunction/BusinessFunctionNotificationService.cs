using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services.Businessfunction {
    /// <summary>
    /// Service for managing business function notification groups
    /// Allows internal business functions to target specific groups without requiring NotificationPolicy
    /// </summary>
    public class BusinessFunctionNotificationService : IBusinessFunctionNotificationService {
        private readonly GpsdataContext _context;
        private readonly ILogger<BusinessFunctionNotificationService> _logger;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;

        public BusinessFunctionNotificationService (
            GpsdataContext context,
            ILogger<BusinessFunctionNotificationService> logger,
            UserManager<User> userManager,
            RoleManager<Role> roleManager) {
            _context = context;
            _logger = logger;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<List<NotificationGroup>> GetGroupsForTriggerSourceAsync (
            string triggerSource,
            int? siteId = null,
            CancellationToken cancellationToken = default) {

            var query = _context.BusinessFunctionNotificationGroups
                .Where (bfg => bfg.TriggerSource == triggerSource && bfg.IsActive);

            // Site filtering: include global (null) and site-specific mappings
            if (siteId.HasValue) {
                query = query.Where (bfg => bfg.SiteId == null || bfg.SiteId == siteId.Value);
            } else {
                // If no site specified, only return global mappings
                query = query.Where (bfg => bfg.SiteId == null);
            }

            var mappings = await query
                .Include (bfg => bfg.Group)
                .ThenInclude (g => g.Members)
                .ToListAsync (cancellationToken);
            return mappings.Select (m => m.Group).Where (g => g.IsActive).ToList ();
        }

        public async Task<List<NotificationRecipientDto>> ResolveRecipientsFromTriggerSourceAsync (
            string triggerSource,
            int? siteId = null,
            string? minimumSeverity = null,
            CancellationToken cancellationToken = default) {

            var recipients = new List<NotificationRecipientDto> ();
            var addedUserIds = new HashSet<string> ();

            try {
                var groups = await GetGroupsForTriggerSourceAsync (triggerSource, siteId, cancellationToken);

                foreach (var group in groups) {
                    var groupRecipients = await ResolveGroupMembersAsync (group, minimumSeverity, cancellationToken);

                    foreach (var recipient in groupRecipients) {
                        if (!addedUserIds.Contains (recipient.UserId)) {
                            recipients.Add (recipient);
                            addedUserIds.Add (recipient.UserId);
                        }
                    }
                }

                _logger.LogInformation ("Resolved {Count} recipients for trigger source {TriggerSource} (Site: {SiteId})",
                    recipients.Count, triggerSource, siteId);

                return recipients;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to resolve recipients for trigger source {TriggerSource}", triggerSource);
                return recipients;
            }
        }

        public async Task<FMSResponse> CreateDefaultGroupsForSiteAsync (
            int siteId,
            string createdBy,
            CancellationToken cancellationToken = default) {

            try {
                var site = await _context.Sites.FindAsync (new object[] { siteId }, cancellationToken);
                if (site == null) {
                    return FMSResponse.FailedResponse ("Site not found");
                }

                var defaultGroups = new [] {
                    new { Name = $"Site {siteId} - Stock Management", TriggerSources = new [] { "ClosingStock", "StockDiscrepancy" } },
                    new { Name = $"Site {siteId} - System Administrators", TriggerSources = new [] { "AutomatedClosingStock", "AutomatedReconciliation" } },
                    new { Name = $"Site {siteId} - Maintenance Team", TriggerSources = new [] { "TagMonitoring", "SensorVariance" } }
                };

                foreach (var groupDef in defaultGroups) {
                    // Create notification group
                    var group = new NotificationGroup {
                        Name = groupDef.Name,
                        Description = $"Default group for site {siteId} business function notifications",
                        SiteId = siteId,
                        AllowedDeliveryMethods = "System,Email,SMS",
                        IsActive = true,
                        CreatedBy = createdBy
                    };

                    _context.NotificationGroups.Add (group);
                    await _context.SaveChangesAsync (cancellationToken);

                    // Add site administrator as default member if exists
                    if (!string.IsNullOrEmpty (site.SiteAdministratorId)) {
                        _context.NotificationGroupMembers.Add (new NotificationGroupMember {
                            GroupId = group.Id,
                                MemberType = "User",
                                MemberId = site.SiteAdministratorId
                        });
                    }

                    // Create business function mappings
                    foreach (var triggerSource in groupDef.TriggerSources) {
                        _context.BusinessFunctionNotificationGroups.Add (new BusinessFunctionNotificationGroup {
                            TriggerSource = triggerSource,
                                GroupId = group.Id,
                                SiteId = siteId,
                                IsActive = true,
                                CreatedBy = createdBy
                        });
                    }
                }

                await _context.SaveChangesAsync (cancellationToken);
                return FMSResponse.SuccessResponse ($"Created default business function groups for site {siteId}");
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to create default groups for site {SiteId}", siteId);
                return FMSResponse.FailedResponse ($"Failed to create default groups: {ex.Message}");
            }
        }

        public async Task<FMSResponse> MapTriggerSourceToGroupAsync (
            string triggerSource,
            int groupId,
            int? siteId = null,
            string? allowedDeliveryMethods = null,
            string? minimumSeverity = null,
            string createdBy = "System",
            CancellationToken cancellationToken = default) {

            try {
                // Validate group exists
                var group = await _context.NotificationGroups.FindAsync (new object[] { groupId }, cancellationToken);
                if (group == null) {
                    return FMSResponse.FailedResponse ("Notification group not found");
                }

                // Check for existing mapping
                var existing = await _context.BusinessFunctionNotificationGroups
                    .FirstOrDefaultAsync (bfg =>
                        bfg.TriggerSource == triggerSource &&
                        bfg.GroupId == groupId &&
                        bfg.SiteId == siteId,
                        cancellationToken);

                if (existing != null) {
                    return FMSResponse.SuccessResponse ("Mapping already exists");
                }

                // Create new mapping
                var mapping = new BusinessFunctionNotificationGroup {
                    TriggerSource = triggerSource,
                    GroupId = groupId,
                    SiteId = siteId,
                    AllowedDeliveryMethods = allowedDeliveryMethods,
                    MinimumSeverity = minimumSeverity,
                    IsActive = true,
                    CreatedBy = createdBy
                };

                _context.BusinessFunctionNotificationGroups.Add (mapping);
                await _context.SaveChangesAsync (cancellationToken);

                return FMSResponse.SuccessResponse ("Business function mapped to group successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to map trigger source {TriggerSource} to group {GroupId}", triggerSource, groupId);
                return FMSResponse.FailedResponse ($"Failed to create mapping: {ex.Message}");
            }
        }

        public async Task<FMSResponse> UnmapTriggerSourceFromGroupAsync (
            string triggerSource,
            int groupId,
            int? siteId = null,
            CancellationToken cancellationToken = default) {

            try {
                var mapping = await _context.BusinessFunctionNotificationGroups
                    .FirstOrDefaultAsync (bfg =>
                        bfg.TriggerSource == triggerSource &&
                        bfg.GroupId == groupId &&
                        bfg.SiteId == siteId,
                        cancellationToken);

                if (mapping == null) {
                    return FMSResponse.SuccessResponse ("Mapping not found");
                }

                _context.BusinessFunctionNotificationGroups.Remove (mapping);
                await _context.SaveChangesAsync (cancellationToken);

                return FMSResponse.SuccessResponse ("Business function unmapped from group successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to unmap trigger source {TriggerSource} from group {GroupId}", triggerSource, groupId);
                return FMSResponse.FailedResponse ($"Failed to remove mapping: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<BusinessFunctionGroupMappingDto>>> GetBusinessFunctionMappingsAsync (
            int? siteId = null,
            CancellationToken cancellationToken = default) {

            try {
                var query = _context.BusinessFunctionNotificationGroups
                    .Include (bfg => bfg.Group)
                    .ThenInclude (g => g.Members)
                    .Include (bfg => bfg.Site)
                    .AsQueryable ();

                if (siteId.HasValue) {
                    query = query.Where (bfg => bfg.SiteId == null || bfg.SiteId == siteId.Value);
                }

                var mappings = await query
                    .Select (bfg => new BusinessFunctionGroupMappingDto {
                        Id = bfg.Id,
                            TriggerSource = bfg.TriggerSource,
                            GroupId = bfg.GroupId,
                            GroupName = bfg.Group.Name,
                            SiteId = bfg.SiteId,
                            SiteName = bfg.Site != null ? bfg.Site.Name : "Global",
                            IsActive = bfg.IsActive,
                            AllowedDeliveryMethods = bfg.AllowedDeliveryMethods,
                            MinimumSeverity = bfg.MinimumSeverity,
                            MemberCount = bfg.Group.Members.Count
                    })
                    .ToListAsync (cancellationToken);

                return FMSResponse<List<BusinessFunctionGroupMappingDto>>.Success (mappings, $"Retrieved {mappings.Count} business function mappings");
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to get business function mappings");
                return FMSResponse<List<BusinessFunctionGroupMappingDto>>.Failed ($"Failed to retrieve mappings: {ex.Message}");
            }
        }

        public async Task<FMSResponse> SeedDefaultBusinessFunctionMappingsAsync (
            string createdBy = "System",
            CancellationToken cancellationToken = default) {

            try {
                // Create global system administrators group if not exists
                var systemAdminGroup = await _context.NotificationGroups
                    .FirstOrDefaultAsync (g => g.Name == "System Administrators" && g.SiteId == null, cancellationToken);

                if (systemAdminGroup == null) {
                    systemAdminGroup = new NotificationGroup {
                    Name = "System Administrators",
                    Description = "Global system administrators for critical business function notifications",
                    SiteId = null, // Global
                    AllowedDeliveryMethods = "System,Email,SMS",
                    IsActive = true,
                    CreatedBy = createdBy
                    };

                    _context.NotificationGroups.Add (systemAdminGroup);
                    await _context.SaveChangesAsync (cancellationToken);

                    // Add users with "Administrator" role
                    var adminRole = await _roleManager.FindByNameAsync ("Administrator");
                    if (adminRole != null) {
                        _context.NotificationGroupMembers.Add (new NotificationGroupMember {
                            GroupId = systemAdminGroup.Id,
                                MemberType = "Role",
                                MemberId = adminRole.Id
                        });
                        await _context.SaveChangesAsync (cancellationToken);
                    }
                }

                // Default global mappings for critical system functions
                var globalMappings = new [] {
                    "AutomatedClosingStock",
                    "AutomatedReconciliation",
                    "SystemError",
                    "CriticalFailure"
                };

                foreach (var triggerSource in globalMappings) {
                    var existingMapping = await _context.BusinessFunctionNotificationGroups
                        .FirstOrDefaultAsync (bfg =>
                            bfg.TriggerSource == triggerSource &&
                            bfg.GroupId == systemAdminGroup.Id &&
                            bfg.SiteId == null,
                            cancellationToken);

                    if (existingMapping == null) {
                        _context.BusinessFunctionNotificationGroups.Add (new BusinessFunctionNotificationGroup {
                            TriggerSource = triggerSource,
                                GroupId = systemAdminGroup.Id,
                                SiteId = null, // Global
                                AllowedDeliveryMethods = "System,Email",
                                MinimumSeverity = triggerSource.Contains ("Critical") ? "Critical" : "Medium",
                                IsActive = true,
                                CreatedBy = createdBy
                        });
                    }
                }

                await _context.SaveChangesAsync (cancellationToken);
                return FMSResponse.SuccessResponse ("Default business function mappings seeded successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to seed default business function mappings");
                return FMSResponse.FailedResponse ($"Failed to seed mappings: {ex.Message}");
            }
        }

        private async Task<List<NotificationRecipientDto>> ResolveGroupMembersAsync (
            NotificationGroup group,
            string? minimumSeverity = null,
            CancellationToken cancellationToken = default) {

            var recipients = new List<NotificationRecipientDto> ();

            try {
                foreach (var member in group.Members) {
                    if (member.MemberType == "User") {
                        var user = await _userManager.FindByIdAsync (member.MemberId);
                        if (user != null) {
                            recipients.Add (new NotificationRecipientDto {
                                UserId = user.Id,
                                    DeliveryMethods = SplitMethods (group.AllowedDeliveryMethods ?? "System,Email"),
                                    PriorityOverride = minimumSeverity
                            });
                        }
                    } else if (member.MemberType == "Role") {
                        var role = await _roleManager.FindByIdAsync (member.MemberId);
                        if (role != null) {
                            var usersInRole = await _userManager.GetUsersInRoleAsync (role.Name ?? "");
                            foreach (var user in usersInRole) {
                                recipients.Add (new NotificationRecipientDto {
                                    UserId = user.Id,
                                        DeliveryMethods = SplitMethods (group.AllowedDeliveryMethods ?? "System,Email"),
                                        PriorityOverride = minimumSeverity
                                });
                            }
                        }
                    }
                }

                return recipients;
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to resolve group members for group {GroupId}", group.Id);
                return recipients;
            }
        }

        private static List<string> SplitMethods (string? methodsCsv) {
            if (string.IsNullOrWhiteSpace (methodsCsv)) {
                return new List<string> { "System", "Email" };
            }

            return methodsCsv
                .Split (',', StringSplitOptions.RemoveEmptyEntries)
                .Select (m => m.Trim ())
                .Where (m => !string.IsNullOrEmpty (m))
                .Distinct ()
                .ToList ();
        }
    }

    /// <summary>
    /// DTO for business function group mapping display
    /// </summary>
    public class BusinessFunctionGroupMappingDto {
        public int Id { get; set; }
        public string TriggerSource { get; set; } = null!;
        public int GroupId { get; set; }
        public string GroupName { get; set; } = null!;
        public int? SiteId { get; set; }
        public string? SiteName { get; set; }
        public bool IsActive { get; set; }
        public string? AllowedDeliveryMethods { get; set; }
        public string? MinimumSeverity { get; set; }
        public int MemberCount { get; set; }
    }

}