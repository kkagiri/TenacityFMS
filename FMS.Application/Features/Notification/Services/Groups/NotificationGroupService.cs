using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs.Groups;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services.Groups {
    /// <summary>
    /// Service for managing notification groups and their members
    /// Handles group creation, member management, and policy mapping
    /// </summary>
    public class NotificationGroupService : INotificationGroupService {
        private readonly GpsdataContext _context;
        private readonly ILogger<NotificationGroupService> _logger;

        public NotificationGroupService (
            GpsdataContext context,
            ILogger<NotificationGroupService> logger) {
            _context = context ??
                throw new ArgumentNullException (nameof (context));
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
        }

        public async Task<FMSResponse<List<NotificationGroupDto>>> GetGroupsAsync (int? siteId, CancellationToken cancellationToken = default) {
            try {
                var query = _context.NotificationGroups
                    .Include (g => g.Members)
                    .AsQueryable ();

                if (siteId.HasValue) {
                    query = query.Where (g => g.SiteId == siteId.Value || g.SiteId == null);
                }

                var groups = await query
                    .OrderBy (g => g.Name)
                    .ToListAsync (cancellationToken);

                var groupDtos = groups.Select (g => new NotificationGroupDto {
                    Id = g.Id,
                        Name = g.Name,
                        Description = g.Description,
                        SiteId = g.SiteId,
                        AllowedDeliveryMethods = g.AllowedDeliveryMethods,
                        IsActive = g.IsActive,
                        CreatedBy = g.CreatedBy,
                        CreatedAt = g.CreatedAt,
                        UpdatedBy = g.UpdatedBy,
                        UpdatedAt = g.UpdatedAt,
                        MemberCount = g.Members.Count
                }).ToList ();

                return FMSResponse<List<NotificationGroupDto>>.Success (groupDtos, "Groups retrieved successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving notification groups for siteId: {SiteId}", siteId);
                return FMSResponse<List<NotificationGroupDto>>.SystemError ("Failed to retrieve groups due to system error");
            }
        }

        public async Task<FMSResponse<int>> CreateGroupAsync (CreateNotificationGroupRequest request, CancellationToken cancellationToken = default) {
            try {
                // Validate request
                var validationErrors = new List<string> ();

                if (string.IsNullOrWhiteSpace (request.Name)) {
                    validationErrors.Add ("Group name is required");
                }

                if (request.Name?.Length > 100) {
                    validationErrors.Add ("Group name cannot exceed 100 characters");
                }

                if (request.Description?.Length > 500) {
                    validationErrors.Add ("Description cannot exceed 500 characters");
                }

                if (string.IsNullOrWhiteSpace (request.CreatedBy)) {
                    validationErrors.Add ("CreatedBy is required");
                }

                if (validationErrors.Any ()) {
                    return FMSResponse<int>.ValidationFailed (validationErrors);
                }

                // Check for duplicate name within site
                NotificationGroup? existingGroup = await _context.NotificationGroups
                    .FirstOrDefaultAsync (g => g.Name == request.Name && g.SiteId == request.SiteId, cancellationToken);

                if (existingGroup != null) {
                    return FMSResponse<int>.ValidationFailed (new List<string> { "A group with this name already exists in this site scope" });
                }

                NotificationGroup group = new NotificationGroup {
                    Name = request.Name,
                    Description = request.Description,
                    SiteId = request.SiteId,
                    AllowedDeliveryMethods = request.AllowedDeliveryMethods,
                    IsActive = request.IsActive,
                    CreatedBy = request.CreatedBy!,
                    CreatedAt = DateTime.UtcNow
                };

                _context.NotificationGroups.Add (group);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Created notification group: {GroupName} (ID: {GroupId}) by {CreatedBy}",
                    group.Name, group.Id, group.CreatedBy);
                return FMSResponse<int>.Success (group.Id, "Group created successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating notification group: {GroupName}", request.Name);
                return FMSResponse<int>.SystemError ("Failed to create group due to system error");
            }
        }

        public async Task<FMSResponse> UpdateGroupAsync (UpdateNotificationGroupRequest request, CancellationToken cancellationToken = default) {
            try {
                // Validate request
                List<string> validationErrors = new List<string> ();

                if (string.IsNullOrWhiteSpace (request.Name)) {
                    validationErrors.Add ("Group name is required");
                }

                if (request.Name?.Length > 100) {
                    validationErrors.Add ("Group name cannot exceed 100 characters");
                }

                if (request.Description?.Length > 500) {
                    validationErrors.Add ("Description cannot exceed 500 characters");
                }

                if (string.IsNullOrWhiteSpace (request.UpdatedBy)) {
                    validationErrors.Add ("UpdatedBy is required");
                }

                if (validationErrors.Any ()) {
                    return FMSResponse.ValidationFailed (validationErrors);
                }

                NotificationGroup? group = await _context.NotificationGroups
                    .FirstOrDefaultAsync (g => g.Id == request.Id, cancellationToken);

                if (group == null) {
                    return FMSResponse.FailedResponse ("Group not found");
                }

                // Check for duplicate name within site (excluding current group)
                if (!string.IsNullOrWhiteSpace (request.Name) && request.Name != group.Name) {
                    NotificationGroup? existingGroup = await _context.NotificationGroups
                        .FirstOrDefaultAsync (g => g.Name == request.Name && g.SiteId == group.SiteId && g.Id != request.Id, cancellationToken);

                    if (existingGroup != null) {
                        return FMSResponse.ValidationFailed (new List<string> { "A group with this name already exists in this site scope" });
                    }
                }

                // Update properties
                group.Name = request.Name;
                group.Description = request.Description;
                group.SiteId = request.SiteId;
                group.AllowedDeliveryMethods = request.AllowedDeliveryMethods;
                group.IsActive = request.IsActive;
                group.UpdatedBy = request.UpdatedBy;
                group.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Updated notification group: {GroupName} (ID: {GroupId}) by {UpdatedBy}",
                    group.Name, group.Id, group.UpdatedBy);
                return FMSResponse.SuccessResponse ("Group updated successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating notification group: {GroupId}", request.Id);
                return FMSResponse.SystemError ("Failed to update group due to system error");
            }
        }

        public async Task<FMSResponse> DeleteGroupAsync (int id, CancellationToken cancellationToken = default) {
            try {
                var group = await _context.NotificationGroups
                    .Include (g => g.Members)
                    .FirstOrDefaultAsync (g => g.Id == id, cancellationToken);

                if (group == null) {
                    return FMSResponse.FailedResponse ("Group not found");
                }

                // Check if group is used in any policies
                var policyCount = await _context.NotificationPolicyGroups
                    .CountAsync (pg => pg.GroupId == id, cancellationToken);

                if (policyCount > 0) {
                    return FMSResponse.FailedResponse ($"Cannot delete group. It is used in {policyCount} notification policies");
                }

                // Remove all members first
                _context.NotificationGroupMembers.RemoveRange (group.Members);
                _context.NotificationGroups.Remove (group);

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Deleted notification group: {GroupName} (ID: {GroupId})", group.Name, group.Id);
                return FMSResponse.SuccessResponse ("Group deleted successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting notification group: {GroupId}", id);
                return FMSResponse.FailedResponse ("Failed to delete group");
            }
        }

        public async Task<FMSResponse<List<GroupMemberDto>>> GetGroupMembersAsync (int groupId, CancellationToken cancellationToken = default) {
            try {
                List<NotificationGroupMember> members = await _context.NotificationGroupMembers
                    .Where (m => m.GroupId == groupId)
                    .ToListAsync (cancellationToken);

                List<GroupMemberDto> memberDtos = members.Select (m => new GroupMemberDto {
                    Id = m.Id,
                        GroupId = m.GroupId,
                        MemberType = m.MemberType,
                        MemberId = m.MemberId
                }).ToList ();

                return FMSResponse<List<GroupMemberDto>>.Success (memberDtos, "Group members retrieved successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving members for group: {GroupId}", groupId);
                return FMSResponse<List<GroupMemberDto>>.SystemError ("Failed to retrieve group members due to system error");
            }
        }

        public async Task<FMSResponse<AddGroupMembersReceipt>> AddGroupMembersAsync (int groupId, List<GroupMemberCreateRequest> members, CancellationToken cancellationToken = default) {
            try {
                NotificationGroup? group = await _context.NotificationGroups
                    .FirstOrDefaultAsync (g => g.Id == groupId, cancellationToken);

                if (group == null) {
                    return FMSResponse<AddGroupMembersReceipt>.Failed ("Group not found");
                }

                AddGroupMembersReceipt receipt = new AddGroupMembersReceipt {
                    GroupId = groupId,
                    Attempted = members.Count,
                    Added = 0,
                    Duplicates = 0,
                    Invalid = 0,
                    DuplicateKeys = [],
                    InvalidEntries = []
                };

                foreach (GroupMemberCreateRequest memberRequest in members) {
                    try {
                        // Validate member data
                        if (string.IsNullOrWhiteSpace (memberRequest.MemberType) ||
                            string.IsNullOrWhiteSpace (memberRequest.MemberId)) {
                            receipt.Invalid++;
                            receipt.InvalidEntries.Add ($"MemberType: {memberRequest.MemberType}, MemberId: {memberRequest.MemberId}");
                            continue;
                        }

                        // Check if already a member
                        bool existingMember = await _context.NotificationGroupMembers
                            .AnyAsync (m => m.GroupId == groupId &&
                                m.MemberType == memberRequest.MemberType &&
                                m.MemberId == memberRequest.MemberId, cancellationToken);

                        if (existingMember) {
                            receipt.Duplicates++;
                            receipt.DuplicateKeys.Add ($"{memberRequest.MemberType}:{memberRequest.MemberId}");
                            continue;
                        }

                        NotificationGroupMember newMember = new NotificationGroupMember {
                            GroupId = groupId,
                            MemberType = memberRequest.MemberType,
                            MemberId = memberRequest.MemberId
                        };

                        _context.NotificationGroupMembers.Add (newMember);
                        receipt.Added++;
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Error adding member {MemberType}:{MemberId} to group {GroupId}",
                            memberRequest.MemberType, memberRequest.MemberId, groupId);
                        receipt.Invalid++;
                        receipt.InvalidEntries.Add ($"{memberRequest.MemberType}:{memberRequest.MemberId} - Internal error");
                    }
                }

                if (receipt.Added > 0) {
                    await _context.SaveChangesAsync (cancellationToken);
                }

                string message = $"Added {receipt.Added} members successfully";
                if (receipt.Duplicates > 0 || receipt.Invalid > 0) {
                    message += $" ({receipt.Duplicates} duplicates, {receipt.Invalid} invalid)";
                }

                _logger.LogInformation ("Added members to group {GroupId}: {Added} successful, {Duplicates} duplicates, {Invalid} invalid",
                    groupId, receipt.Added, receipt.Duplicates, receipt.Invalid);

                return FMSResponse<AddGroupMembersReceipt>.Success (receipt, message);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error adding members to group: {GroupId}", groupId);
                return FMSResponse<AddGroupMembersReceipt>.SystemError ("Failed to add group members due to system error");
            }
        }

        public async Task<FMSResponse> RemoveGroupMemberAsync (int groupId, int memberId, CancellationToken cancellationToken = default) {
            try {
                NotificationGroupMember? member = await _context.NotificationGroupMembers
                    .FirstOrDefaultAsync (m => m.Id == memberId && m.GroupId == groupId, cancellationToken);

                if (member == null) {
                    return FMSResponse.FailedResponse ("Group member not found");
                }

                _context.NotificationGroupMembers.Remove (member);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Removed member {MemberId} from group {GroupId}", memberId, groupId);
                return FMSResponse.SuccessResponse ("Member removed successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error removing member {MemberId} from group {GroupId}", memberId, groupId);
                return FMSResponse.SystemError ("Failed to remove group member due to system error");
            }
        }

        public async Task<FMSResponse> MapPolicyToGroupAsync (MapPolicyGroupRequest request, CancellationToken cancellationToken = default) {
            try {
                // Check if policy exists
                bool policyExists = await _context.NotificationPolicies
                    .AnyAsync (p => p.Id == request.PolicyId, cancellationToken);

                if (!policyExists) {
                    return FMSResponse.FailedResponse ("Notification policy not found");
                }

                // Check if group exists
                bool groupExists = await _context.NotificationGroups
                    .AnyAsync (g => g.Id == request.GroupId, cancellationToken);

                if (!groupExists) {
                    return FMSResponse.FailedResponse ("Notification group not found");
                }

                // Check if mapping already exists
                NotificationPolicyGroup? existingMapping = await _context.NotificationPolicyGroups
                    .FirstOrDefaultAsync (pg => pg.PolicyId == request.PolicyId && pg.GroupId == request.GroupId, cancellationToken);

                if (existingMapping != null) {
                    return FMSResponse.FailedResponse ("Policy is already mapped to this group");
                }

                NotificationPolicyGroup mapping = new NotificationPolicyGroup {
                    PolicyId = request.PolicyId,
                    GroupId = request.GroupId,
                    AllowedDeliveryMethods = request.AllowedDeliveryMethods
                };

                _context.NotificationPolicyGroups.Add (mapping);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Mapped policy {PolicyId} to group {GroupId}", request.PolicyId, request.GroupId);
                return FMSResponse.SuccessResponse ("Policy mapped to group successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error mapping policy {PolicyId} to group {GroupId}", request.PolicyId, request.GroupId);
                return FMSResponse.SystemError ("Failed to map policy to group due to system error");
            }
        }

        public async Task<FMSResponse> UnmapPolicyFromGroupAsync (int policyId, int groupId, CancellationToken cancellationToken = default) {
            try {
                NotificationPolicyGroup? mapping = await _context.NotificationPolicyGroups
                    .FirstOrDefaultAsync (pg => pg.PolicyId == policyId && pg.GroupId == groupId, cancellationToken);

                if (mapping == null) {
                    return FMSResponse.FailedResponse ("Policy mapping not found");
                }

                _context.NotificationPolicyGroups.Remove (mapping);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Unmapped policy {PolicyId} from group {GroupId}", policyId, groupId);
                return FMSResponse.SuccessResponse ("Policy unmapped from group successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error unmapping policy {PolicyId} from group {GroupId}", policyId, groupId);
                return FMSResponse.SystemError ("Failed to unmap policy from group due to system error");
            }
        }

        public async Task<FMSResponse<List<NotificationGroupDto>>> GetGroupsForPolicyAsync (int policyId, CancellationToken cancellationToken = default) {
            try {
                List<NotificationGroup> groups = await _context.NotificationPolicyGroups
                    .Where (pg => pg.PolicyId == policyId)
                    .Include (pg => pg.Group)
                    .ThenInclude (g => g.Members)
                    .Select (pg => pg.Group)
                    .ToListAsync (cancellationToken);

                List<NotificationGroupDto> groupDtos = groups.Select (g => new NotificationGroupDto {
                    Id = g.Id,
                        Name = g.Name,
                        Description = g.Description,
                        SiteId = g.SiteId,
                        AllowedDeliveryMethods = g.AllowedDeliveryMethods,
                        IsActive = g.IsActive,
                        CreatedBy = g.CreatedBy,
                        CreatedAt = g.CreatedAt,
                        UpdatedBy = g.UpdatedBy,
                        UpdatedAt = g.UpdatedAt,
                        MemberCount = g.Members.Count
                }).ToList ();

                return FMSResponse<List<NotificationGroupDto>>.Success (groupDtos, "Groups for policy retrieved successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving groups for policy: {PolicyId}", policyId);
                return FMSResponse<List<NotificationGroupDto>>.SystemError ("Failed to retrieve groups for policy due to system error");
            }
        }
    }
}