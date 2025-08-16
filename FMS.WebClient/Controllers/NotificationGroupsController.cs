using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs.Groups;
using FMS.Application.Features.Notification.Services.Groups;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/notifications/groups")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class NotificationGroupsController : ControllerBase {
        private readonly INotificationGroupService _groupService;

        public NotificationGroupsController (INotificationGroupService groupService) {
            _groupService = groupService;
        }

        [HttpGet]
        public async Task<IActionResult> GetGroups ([FromQuery] int? siteId = null, CancellationToken cancellationToken = default) {
            FMSResponse<List<NotificationGroupDto>> result = await _groupService.GetGroupsAsync (siteId, cancellationToken);
            return result.IsSuccess ? Ok (new { success = true, message = result.Message, data = result.Data }) : BadRequest (new { success = false, message = result.Message });
        }

        [HttpPost]
        [Authorize (Roles = "Admin")]
        public async Task<IActionResult> CreateGroup ([FromBody] CreateNotificationGroupRequest request, CancellationToken cancellationToken = default) {
            if (request == null) return BadRequest (new { success = false, message = "Invalid request" });
            FMSResponse<int> result = await _groupService.CreateGroupAsync (request, cancellationToken);
            return result.IsSuccess ? Ok (new { success = true, message = result.Message, groupId = result.Data }) : BadRequest (new { success = false, message = result.Message, errors = result.ValidationErrors });
        }

        [HttpPut ("{groupId}")]
        [Authorize (Roles = "Admin")]
        public async Task<IActionResult> UpdateGroup (int groupId, [FromBody] UpdateNotificationGroupRequest request, CancellationToken cancellationToken = default) {
            if (request == null) return BadRequest (new { success = false, message = "Invalid request" });
            request.Id = groupId;
            FMSResponse result = await _groupService.UpdateGroupAsync (request, cancellationToken);
            return result.IsSuccess ? Ok (new { success = true, message = result.Message }) : BadRequest (new { success = false, message = result.Message, errors = result.ValidationErrors });
        }

        [HttpDelete ("{groupId}")]
        [Authorize (Roles = "Admin")]
        public async Task<IActionResult> DeleteGroup (int groupId, CancellationToken cancellationToken = default) {
            FMSResponse result = await _groupService.DeleteGroupAsync (groupId, cancellationToken);
            return result.IsSuccess ? Ok (new { success = true, message = result.Message }) : BadRequest (new { success = false, message = result.Message });
        }

        [HttpGet ("{groupId}/members")]
        public async Task<IActionResult> GetMembers (int groupId, CancellationToken cancellationToken = default) {
            FMSResponse<List<GroupMemberDto>> result = await _groupService.GetGroupMembersAsync (groupId, cancellationToken);
            return result.IsSuccess ? Ok (new { success = true, message = result.Message, data = result.Data }) : BadRequest (new { success = false, message = result.Message });
        }

        [HttpPost ("{groupId}/members")]
        [Authorize (Roles = "Admin")]
        public async Task<IActionResult> AddMembers (int groupId, [FromBody] List<GroupMemberCreateRequest> members, CancellationToken cancellationToken = default) {
            if (members == null || members.Count == 0) {
                return BadRequest (new { success = false, message = "No members provided" });
            }
            FMSResponse<AddGroupMembersReceipt> result = await _groupService.AddGroupMembersAsync (groupId, members, cancellationToken);
            return result.IsSuccess ?
                Ok (new { success = true, message = result.Message, receipt = result.Data }) :
                BadRequest (new { success = false, message = result.Message });
        }

        [HttpDelete ("{groupId}/members/{memberId}")]
        [Authorize (Roles = "Admin")]
        public async Task<IActionResult> RemoveMember (int groupId, int memberId, CancellationToken cancellationToken = default) {
            FMSResponse result = await _groupService.RemoveGroupMemberAsync (groupId, memberId, cancellationToken);
            return result.IsSuccess ? Ok (new { success = true, message = result.Message }) : BadRequest (new { success = false, message = result.Message });
        }

        // Policy ↔ Group mapping endpoints (placed under policies route for clarity)
        [HttpPost ("/api/notifications/policies/{policyId}/groups")]
        [Authorize (Roles = "Admin")]
        public async Task<IActionResult> MapPolicyToGroup (int policyId, [FromBody] MapPolicyGroupRequest request, CancellationToken cancellationToken = default) {
            if (request == null) {
                return BadRequest (new { success = false, message = "Invalid request" });
            }
            request.PolicyId = policyId;
            FMSResponse mapResult = await _groupService.MapPolicyToGroupAsync (request, cancellationToken);
            return mapResult.IsSuccess ?
                Ok (new { success = true, message = mapResult.Message }) :
                BadRequest (new { success = false, message = mapResult.Message });
        }

        [HttpDelete ("/api/notifications/policies/{policyId}/groups/{groupId}")]
        [Authorize (Roles = "Admin")]
        public async Task<IActionResult> UnmapPolicyFromGroup (int policyId, int groupId, CancellationToken cancellationToken = default) {
            FMSResponse unmapResult = await _groupService.UnmapPolicyFromGroupAsync (policyId, groupId, cancellationToken);
            return unmapResult.IsSuccess ?
                Ok (new { success = true, message = unmapResult.Message }) :
                BadRequest (new { success = false, message = unmapResult.Message });
        }

        // Get groups mapped to a policy
        [HttpGet ("/api/notifications/policies/{policyId}/groups")]
        public async Task<IActionResult> GetGroupsForPolicy (int policyId, CancellationToken cancellationToken = default) {
            FMSResponse<List<NotificationGroupDto>> result = await _groupService.GetGroupsForPolicyAsync (policyId, cancellationToken);
            return result.IsSuccess ? Ok (new { success = true, message = result.Message, data = result.Data }) : BadRequest (new { success = false, message = result.Message });
        }
    }
}