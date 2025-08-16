using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs.Groups;

namespace FMS.Application.Features.Notification.Services.Groups {
    public interface INotificationGroupService {
        Task<FMSResponse<List<NotificationGroupDto>>> GetGroupsAsync (int? siteId, CancellationToken cancellationToken = default);
        Task<FMSResponse<int>> CreateGroupAsync (CreateNotificationGroupRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> UpdateGroupAsync (UpdateNotificationGroupRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> DeleteGroupAsync (int id, CancellationToken cancellationToken = default);

        Task<FMSResponse<List<GroupMemberDto>>> GetGroupMembersAsync (int groupId, CancellationToken cancellationToken = default);
        Task<FMSResponse<AddGroupMembersReceipt>> AddGroupMembersAsync (int groupId, List<GroupMemberCreateRequest> members, CancellationToken cancellationToken = default);
        Task<FMSResponse> RemoveGroupMemberAsync (int groupId, int memberId, CancellationToken cancellationToken = default);

        Task<FMSResponse> MapPolicyToGroupAsync (MapPolicyGroupRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> UnmapPolicyFromGroupAsync (int policyId, int groupId, CancellationToken cancellationToken = default);

        Task<FMSResponse<List<NotificationGroupDto>>> GetGroupsForPolicyAsync (int policyId, CancellationToken cancellationToken = default);
    }
}