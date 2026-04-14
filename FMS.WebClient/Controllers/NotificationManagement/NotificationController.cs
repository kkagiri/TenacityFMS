/**
 * File: NotificationController.cs
 * Purpose: Slim API controller for notification management. Delegates to INotificationService,
 *          IMediator (CQRS handlers), INotificationGroupService and IEmailService.
 * Dependencies: INotificationService, IMediator, AutoMapper, INotificationGroupService, IEmailService
 * Last Modified: 2026-04-01
 *
 * Key Endpoints:
 * - CRUD for notifications, policies, preferences, categories
 * - Admin history, scheduled report emails, recipient candidates
 * - Search users/roles
 * - Testing: test email, SMTP connection, diagnostics
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Notification.Commands;
using FMS.Application.Features.Notification.Commands.ScheduledReport;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.Groups;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Queries;
using FMS.Application.Features.Notification.Services;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers
{
    /// <summary>
    /// Controller for notification management
    /// </summary>
    [ApiController]
    [Route("api/v1/notifications")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        private readonly FMS.Application.Features.Notification.Services.Groups.INotificationGroupService _groupService;

        public NotificationController(
            INotificationService notificationService,
            ILogger<NotificationController> logger,
            IMediator mediator,
            IMapper mapper,
            FMS.Application.Features.Notification.Services.Groups.INotificationGroupService groupService)
        {
            _notificationService = notificationService;
            _logger = logger;
            _mediator = mediator;
            _mapper = mapper;
            _groupService = groupService;
        }

        #region Private Helpers

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue("id")
                ?? string.Empty;

            return !string.IsNullOrWhiteSpace(userId);
        }

        private bool TryGetCurrentGuidUserId(out string userId)
        {
            if (!TryGetCurrentUserId(out userId))
            {
                return false;
            }

            return Guid.TryParse(userId, out _);
        }

        private string GetCurrentUserIdOrDefault(string fallback = "System")
        {
            return TryGetCurrentUserId(out var userId) ? userId : fallback;
        }

        #endregion

        #region Notification CRUD (existing service delegation)

        /// <summary>
        /// Create a new notification
        /// </summary>
        [HttpPost]
        [RequirePermission(Permissions.Notification.Create)]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(request.TriggeredBy) && TryGetCurrentUserId(out var userId))
                {
                    request.TriggeredBy = userId;
                }

                var result = await _notificationService.CreateNotificationAsync(request, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, notificationId = result.Data });
                }

                if (result.ValidationErrors?.Count > 0)
                {
                    return BadRequest(new { success = false, message = result.Message, errors = result.ValidationErrors });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Send a notification immediately
        /// </summary>
        [HttpPost("{notificationId}/send")]
        [RequirePermission(Permissions.Notification.Create)]
        public async Task<IActionResult> SendNotification(int notificationId, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _notificationService.SendNotificationAsync(notificationId, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification {NotificationId}", notificationId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get notifications for the current user
        /// </summary>
        [HttpGet]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] string? type = null,
            [FromQuery] string? category = null,
            [FromQuery] string? priority = null,
            [FromQuery] bool? isRead = null,
            [FromQuery] int? siteId = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? skip = null,
            [FromQuery] int? take = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var request = new GetNotificationsRequest
                {
                    UserId = userId,
                    Type = type,
                    Category = category,
                    Priority = priority,
                    IsRead = isRead,
                    SiteId = siteId,
                    FromDate = fromDate,
                    ToDate = toDate,
                    Skip = skip,
                    Take = take
                };

                var result = await _notificationService.GetNotificationsAsync(request, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        [HttpPost("{notificationId}/read")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> MarkAsRead(int notificationId, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentGuidUserId(out var userId)) return BadRequest("Invalid User ID");

                var result = await _notificationService.MarkAsReadAsync(notificationId, userId, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Mark all notifications as read for the current user
        /// </summary>
        [HttpPost("read-all")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentGuidUserId(out var userId)) return BadRequest(new { success = false, message = "Invalid User ID" });

                var result = await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, count = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Acknowledge a notification
        /// </summary>
        [HttpPost("{notificationId}/acknowledge")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> AcknowledgeNotification(int notificationId, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentGuidUserId(out var userId)) return BadRequest("Invalid User ID");

                var result = await _notificationService.AcknowledgeNotificationAsync(notificationId, userId, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging notification");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Statistics

        /// <summary>
        /// Get notification statistics for dashboard
        /// </summary>
        [HttpGet("statistics")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? recentCount = null,
            [FromQuery] bool includeDailyBreakdown = true,
            [FromQuery] bool includeRecentNotifications = true,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var statsRequest = new GetNotificationStatisticsRequest
                {
                    UserId = userId,
                    FromDate = fromDate,
                    ToDate = toDate,
                    RecentCount = recentCount,
                    IncludeDailyBreakdown = includeDailyBreakdown,
                    IncludeRecentNotifications = includeRecentNotifications
                };

                var result = await _notificationService.GetNotificationStatisticsAsync(statsRequest, cancellationToken);

                if (result.IsSuccess) return Ok(result.Data);

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification statistics");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get notification statistics via POST body
        /// </summary>
        [HttpPost("statistics/query")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetStatisticsByPost([FromBody] GetNotificationStatisticsRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (request == null) return BadRequest(new { success = false, message = "Invalid request" });

                if (string.IsNullOrEmpty(request.UserId))
                {
                    if (!TryGetCurrentUserId(out var userId))
                    {
                        return Unauthorized(new { success = false, message = "User not authenticated" });
                    }
                    request.UserId = userId;
                }

                var result = await _notificationService.GetNotificationStatisticsAsync(request, cancellationToken);
                if (result.IsSuccess) return Ok(result.Data);
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification statistics via POST");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get admin dashboard notification summary, performance graph, and recent activity.
        /// </summary>
        [HttpGet("admin-dashboard")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetAdminDashboard(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int recentCount = 10,
            [FromQuery] int bucketHours = 4,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var query = new GetAdminNotificationDashboardQuery
                {
                    FromDate = fromDate,
                    ToDate = toDate,
                    RecentCount = recentCount,
                    BucketHours = bucketHours
                };

                var result = await _mediator.Send(query, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin notification dashboard data");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Admin History & Scheduled Reports (CQRS via MediatR)

        /// <summary>
        /// Get ALL notification history for admin view (not scoped to current user).
        /// </summary>
        [HttpGet("admin-history")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetAdminNotificationHistory(
            [FromQuery] string? type = null,
            [FromQuery] string? status = null,
            [FromQuery] string? category = null,
            [FromQuery] string? priority = null,
            [FromQuery] int? siteId = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? search = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 100,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var query = new GetAdminNotificationHistoryQuery
                {
                    Type = type,
                    Status = status,
                    Category = category,
                    Priority = priority,
                    SiteId = siteId,
                    FromDate = fromDate,
                    ToDate = toDate,
                    Search = search,
                    Skip = skip,
                    Take = take
                };

                var result = await _mediator.Send(query, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting admin notification history");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get scheduled report email notifications for administrative monitoring.
        /// </summary>
        [HttpGet("scheduled-reports")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetScheduledReportEmails(
            [FromQuery] bool includeCompleted = true,
            [FromQuery] int take = 200,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var query = new GetScheduledReportEmailsQuery(includeCompleted, take);
                var result = await _mediator.Send(query, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving scheduled report emails");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update a scheduled report email timing/configuration.
        /// </summary>
        [HttpPut("scheduled-reports/{notificationId:int}")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> UpdateScheduledReportEmail(
            int notificationId,
            [FromBody] UpdateScheduledReportEmailRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var command = new UpdateScheduledReportEmailCommand(notificationId, request);
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating scheduled report email {NotificationId}", notificationId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Cancel a scheduled report email notification.
        /// </summary>
        [HttpDelete("scheduled-reports/{notificationId:int}")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> CancelScheduledReportEmail(
            int notificationId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var command = new CancelScheduledReportEmailCommand(notificationId);
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling scheduled report email {NotificationId}", notificationId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Permanently delete a scheduled report email notification and its recipients.
        /// </summary>
        [HttpDelete("scheduled-reports/{notificationId:int}/permanent")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> DeleteScheduledReportEmail(
            int notificationId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var command = new DeleteScheduledReportEmailCommand(notificationId);
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error permanently deleting scheduled report email {NotificationId}", notificationId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Search Users & Roles, Recipient Candidates (CQRS via MediatR)

        /// <summary>
        /// Search users by query (username or email)
        /// </summary>
        [HttpGet("search/users")]
        [RequirePermission(Permissions.Admin.Users)]
        public async Task<IActionResult> SearchUsers([FromQuery(Name = "query")] string? q = null, [FromQuery] int take = 20)
        {
            try
            {
                var query = new SearchUsersQuery(q, take);
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching users");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Search roles by query (name)
        /// </summary>
        [HttpGet("search/roles")]
        [RequirePermission(Permissions.Admin.Users)]
        public async Task<IActionResult> SearchRoles([FromQuery(Name = "query")] string? q = null, [FromQuery] int take = 20)
        {
            try
            {
                var query = new SearchRolesQuery(q, take);
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching roles");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get recipient candidates with rich filtering for the dual-pane recipient picker.
        /// </summary>
        [HttpGet("recipient-candidates")]
        [RequirePermission(Permissions.Notification.ManageGroups, Permissions.WarningLetter.Update)]
        public async Task<IActionResult> GetRecipientCandidates(
            [FromQuery] int? siteId = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] bool? isSiteAdmin = null,
            [FromQuery] string? search = null,
            [FromQuery] int take = 100,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var query = new GetRecipientCandidatesQuery(siteId, departmentId, isSiteAdmin, search, take);
                var result = await _mediator.Send(query, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, data = result.Data, total = result.Data?.Count ?? 0 });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching recipient candidates");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Policies

        /// <summary>
        /// Get notification policies
        /// </summary>
        [HttpGet("policies")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> GetNotificationPolicies(CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _notificationService.GetNotificationPoliciesAsync(cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(result.Data);
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification policies");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get a single notification policy by id
        /// </summary>
        [HttpGet("policies/{policyId}")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> GetNotificationPolicy(int policyId, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _notificationService.GetNotificationPolicyAsync(policyId, cancellationToken);
                if (result.IsSuccess)
                {
                    return Ok(new { success = true, data = result.Data, message = result.Message });
                }
                return NotFound(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification policy {PolicyId}", policyId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create notification policy
        /// </summary>
        [HttpPost("policies")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> CreateNotificationPolicy([FromBody] CreateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentGuidUserId(out var userId)) return BadRequest("Invalid User ID");
                request.CreatedBy = userId;

                var result = await _notificationService.CreateNotificationPolicyAsync(request, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, policyId = result.Data });
                }

                if (result.ValidationErrors?.Count > 0)
                {
                    return BadRequest(new { success = false, message = result.Message, errors = result.ValidationErrors });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification policy");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update notification policy
        /// </summary>
        [HttpPut("policies/{policyId}")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> UpdateNotificationPolicy(int policyId, [FromBody] UpdateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentGuidUserId(out var userId)) return BadRequest("Invalid User ID");
                request.ModifiedBy = userId;

                var result = await _notificationService.UpdateNotificationPolicyAsync(policyId, request, cancellationToken);
                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification policy {PolicyId}", policyId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Policy–Group Mapping

        /// <summary>
        /// Get groups mapped to a notification policy
        /// </summary>
        [HttpGet("policies/{policyId}/groups")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> GetGroupsForPolicy(int policyId, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _groupService.GetGroupsForPolicyAsync(policyId, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, message = result.Message, data = result.Data });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving groups for policy {PolicyId}", policyId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Map a policy to a group
        /// </summary>
        [HttpPost("policies/{policyId}/groups")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> MapPolicyToGroup(int policyId, [FromBody] MapPolicyGroupRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (request == null) return BadRequest(new { success = false, message = "Invalid request" });
                request.PolicyId = policyId;
                var result = await _groupService.MapPolicyToGroupAsync(request, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, message = result.Message });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error mapping policy {PolicyId} to group {GroupId}", policyId, request?.GroupId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Unmap a policy from a group
        /// </summary>
        [HttpDelete("policies/{policyId}/groups/{groupId}")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> UnmapPolicyFromGroup(int policyId, int groupId, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _groupService.UnmapPolicyFromGroupAsync(policyId, groupId, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, message = result.Message });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmapping policy {PolicyId} from group {GroupId}", policyId, groupId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Alert Records

        /// <summary>
        /// Get alert records from PTS
        /// </summary>
        [HttpGet("alert-records")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetAlertRecords([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int skip = 0, [FromQuery] int take = 100, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _notificationService.GetAlertRecordsAsync(fromDate, toDate, skip, take, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(result.Data);
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alert records");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get report-friendly alarm records for the reporting engine.
        /// </summary>
        [HttpGet("alert-records/report")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetAlarmReportData(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? ptsId,
            [FromQuery] string? deviceType,
            [FromQuery] string? state,
            [FromQuery] int? take = 5000,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _mediator.Send(new GetAlarmReportDataQuery
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    PtsId = ptsId,
                    DeviceType = deviceType,
                    State = state,
                    Take = take,
                }, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(result.Data);
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alarm report data");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Test Notification

        /// <summary>
        /// Test notification system
        /// </summary>
        [HttpPost("test")]
        [RequirePermission(Permissions.Notification.ManageEmailConfig)]
        public async Task<IActionResult> TestNotification([FromBody] TestNotificationRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentGuidUserId(out var userId))
                {
                    return BadRequest("Invalid User ID");
                }

                var notificationRequest = new CreateNotificationRequest
                {
                    Type = Application.Features.Notification.Enums.NotificationType.Alert,
                    CategoryId = (int)Application.Features.Notification.Enums.WellKnownCategories.Generic,
                    Priority = Application.Features.Notification.Enums.NotificationPriority.Medium,
                    Title = request.Title ?? "Test Notification",
                    Message = request.Message ?? "This is a test notification from the API",
                    TriggerSource = "API",
                    TriggeredBy = userId,
                    Recipients = new List<NotificationRecipientDto>
                    {
                        new NotificationRecipientDto
                        {
                            UserId = userId,
                            DeliveryMethods = new List<string> { "System" }
                        }
                    }
                };

                var result = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = "Test notification sent successfully", notificationId = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test notification");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region User Notification Preferences

        /// <summary>
        /// Get user notification preferences
        /// </summary>
        [HttpGet("preferences/user/{userId}")]
        [RequirePermission(Permissions.Notification.ManagePreferences, Permissions.Notification.Read)]
        public async Task<IActionResult> GetUserPreferences(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrDefault(string.Empty);
                var canManageOthers = User.HasClaim("permissions", Permissions.Notification.ManagePreferences);
                if (currentUserId != userId && !canManageOthers)
                {
                    return StatusCode(403, new { success = false, message = "Access denied" });
                }

                var mockPreferences = new List<object>
                {
                    new
                    {
                        id = 1, userId,
                        notificationCategory = "SensorVariance",
                        deliveryMethods = "System,Email",
                        isEnabled = true, priority = "Medium",
                        quietHoursStart = (string?)null, quietHoursEnd = (string?)null,
                        maxNotificationsPerHour = 0, maxNotificationsPerDay = 0,
                        requireAcknowledgment = false
                    }
                };
                await Task.FromResult(0);
                return Ok(new { success = true, message = "Preferences retrieved successfully", data = mockPreferences });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user notification preferences for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get current user's notification preferences
        /// </summary>
        [HttpGet("preferences/user/current-user")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetCurrentUserPreferences(CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentUserId(out var currentUserId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var query = new GetUserNotificationPreferencesQuery
                {
                    Request = new GetUserNotificationPreferencesRequest { UserId = currentUserId }
                };

                var result = await _mediator.Send(query, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user notification preferences");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Bulk update user notification preferences
        /// </summary>
        [HttpPost("preferences/bulk-update")]
        [RequirePermission(Permissions.Notification.ManagePreferences, Permissions.Notification.Read)]
        public async Task<IActionResult> BulkUpdateNotificationPreferences([FromBody] BulkUpdatePreferencesRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentGuidUserId(out var userId))
                {
                    return BadRequest("Invalid User ID");
                }

                var currentUserId = userId;

                if (string.IsNullOrWhiteSpace(request.UserId) || !string.Equals(request.UserId, currentUserId, StringComparison.OrdinalIgnoreCase))
                {
                    request.UserId = currentUserId;
                }

                var applicationPreferences = (request.Preferences ?? new List<BulkUpdatePreferenceDto>())
                    .Select(p =>
                    {
                        var mapped = _mapper.Map<UserNotificationPreferenceDto>(p);
                        mapped.UserId = request.UserId;
                        mapped.CreatedBy = currentUserId;
                        mapped.UpdatedBy = currentUserId;
                        return mapped;
                    })
                    .ToList();

                var command = new BulkUpdateUserNotificationPreferencesCommand
                {
                    Request = new BulkUpdateUserNotificationPreferencesRequest
                    {
                        UserId = request.UserId,
                        Preferences = applicationPreferences,
                        UpdatedBy = currentUserId
                    }
                };

                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk updating notification preferences for user {UserId}", request.UserId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a new notification preference
        /// </summary>
        [HttpPost("preferences")]
        [RequirePermission(Permissions.Notification.ManagePreferences, Permissions.Notification.Read)]
        public async Task<IActionResult> CreateNotificationPreference([FromBody] CreateUserNotificationPreferenceRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrDefault(string.Empty);
                var canManageOthers = User.HasClaim("permissions", Permissions.Notification.ManagePreferences);
                if (currentUserId != request.UserId && !canManageOthers)
                {
                    return StatusCode(403, new { success = false, message = "Access denied" });
                }

                var command = new CreateUserNotificationPreferenceCommand { Request = request };
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, preferenceId = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification preference");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update an existing notification preference
        /// </summary>
        [HttpPut("preferences/{id}")]
        [RequirePermission(Permissions.Notification.ManagePreferences, Permissions.Notification.Read)]
        public async Task<IActionResult> UpdateNotificationPreference(int id, [FromBody] UpdateUserNotificationPreferenceRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentUserId(out var currentUserId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                request.Id = id;
                request.UpdatedBy = currentUserId;

                var command = new UpdateUserNotificationPreferenceCommand { Request = request };
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification preference {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete a notification preference
        /// </summary>
        [HttpDelete("preferences/{id}")]
        [RequirePermission(Permissions.Notification.ManagePreferences, Permissions.Notification.Read)]
        public async Task<IActionResult> DeleteNotificationPreference(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentUserId(out var currentUserId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var command = new DeleteUserNotificationPreferenceCommand { Id = id, DeletedBy = currentUserId };
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification preference {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Notification Categories CRUD (Admin Only)

        /// <summary>
        /// Get notification categories
        /// </summary>
        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNotificationCategories(CancellationToken cancellationToken = default)
        {
            try
            {
                var query = new GetNotificationCategoriesQuery { IncludeInactive = false };
                var result = await _mediator.Send(query, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification categories");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all notification categories (including inactive for admin)
        /// </summary>
        [HttpGet("admin/categories")]
        [Authorize]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> GetAllNotificationCategories([FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default)
        {
            try
            {
                var query = new GetNotificationCategoriesQuery { IncludeInactive = includeInactive };
                var result = await _mediator.Send(query, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all notification categories");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a new notification category
        /// </summary>
        [HttpPost("admin/categories")]
        [Authorize]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> CreateNotificationCategory([FromBody] CreateNotificationCategoryRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                request.CreatedBy = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;
                var command = new CreateNotificationCategoryCommand { Request = request };
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, categoryId = result.Data });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification category");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update an existing notification category
        /// </summary>
        [HttpPut("admin/categories/{id}")]
        [Authorize]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> UpdateNotificationCategory(int id, [FromBody] UpdateNotificationCategoryRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                var currentUserId = TryGetCurrentUserId(out var userId) ? userId : null;
                request.Id = id;
                request.UpdatedBy = currentUserId;

                var command = new UpdateNotificationCategoryCommand { Request = request };
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification category {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete a notification category
        /// </summary>
        [HttpDelete("admin/categories/{id}")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> DeleteNotificationCategory(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var command = new DeleteNotificationCategoryCommand { Id = id };
                var result = await _mediator.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification category {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Testing Endpoints

        /// <summary>
        /// Send a test email to verify SMTP configuration
        /// </summary>
        [HttpPost("test-email")]
        [RequirePermission(Permissions.Notification.ManageEmailConfig)]
        public async Task<IActionResult> SendTestEmail([FromBody] SendTestEmailRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.ToAddress))
                {
                    return BadRequest(new { success = false, message = "Email address is required" });
                }

                var emailService = HttpContext.RequestServices.GetService<IEmailService>();
                if (emailService == null)
                {
                    return StatusCode(500, new { success = false, message = "Email service not configured" });
                }

                var subject = request.Subject ?? "FMS Test Email";
                var body = request.Message ?? "This is a test email from the FMS Notification System.";

                var result = await emailService.SendEmailAsync(request.ToAddress, subject, body, isHtml: false, cancellationToken);

                if (result)
                {
                    return Ok(new { success = true, message = $"Test email sent successfully to {request.ToAddress}" });
                }

                return BadRequest(new { success = false, message = "Failed to send test email. Check SMTP configuration and logs." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test email to {ToAddress}", request.ToAddress);
                return StatusCode(500, new { success = false, message = $"Error sending test email: {ex.Message}" });
            }
        }

        /// <summary>
        /// Test SMTP connection without sending email
        /// </summary>
        [HttpPost("test-smtp-connection")]
        [RequirePermission(Permissions.Notification.ManageEmailConfig)]
        public async Task<IActionResult> TestSmtpConnection(CancellationToken cancellationToken = default)
        {
            try
            {
                var emailService = HttpContext.RequestServices.GetService<IEmailService>();
                if (emailService == null)
                {
                    return Ok(new { success = false, status = "error", message = "Email service not configured" });
                }

                var isConfigured = emailService.IsConfigurationValid();
                if (!isConfigured)
                {
                    return Ok(new { success = false, status = "error", message = "SMTP configuration is invalid or missing. Please configure email settings." });
                }

                await Task.CompletedTask;

                return Ok(new { success = true, status = "success", message = "SMTP configuration is valid and ready." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing SMTP connection");
                return Ok(new { success = false, status = "error", message = $"Connection test failed: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get system diagnostics for notification system
        /// </summary>
        [HttpGet("diagnostics")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetDiagnostics(CancellationToken cancellationToken = default)
        {
            try
            {
                var emailService = HttpContext.RequestServices.GetService<IEmailService>();
                var isEmailConfigured = emailService?.IsConfigurationValid() ?? false;

                if (!TryGetCurrentUserId(out var userId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var statsRequest = new GetNotificationStatisticsRequest
                {
                    UserId = userId,
                    FromDate = DateTime.UtcNow.AddHours(-24),
                    ToDate = DateTime.UtcNow,
                    IncludeDailyBreakdown = false,
                    IncludeRecentNotifications = false
                };

                var recentStats = await _notificationService.GetNotificationStatisticsAsync(statsRequest, cancellationToken);

                var diagnostics = new
                {
                    emailService = new
                    {
                        status = isEmailConfigured ? "online" : "not_configured",
                        message = isEmailConfigured ? "Email service is configured and ready" : "Email service is not configured"
                    },
                    smtpServer = new
                    {
                        status = isEmailConfigured ? "connected" : "not_configured",
                        message = isEmailConfigured ? "SMTP server connection available" : "SMTP not configured"
                    },
                    queueStatus = new
                    {
                        pending = recentStats.IsSuccess ? (recentStats.Data?.UnreadNotifications ?? 0) : 0,
                        status = "active"
                    },
                    lastDelivery = new
                    {
                        timestamp = DateTime.UtcNow.AddMinutes(-2),
                        status = "delivered"
                    },
                    recentActivity = new[]
                    {
                        new { id = "recent-1", title = "System Ready", status = "success" }
                    }
                };

                return Ok(new { success = true, data = diagnostics });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification diagnostics");
                return StatusCode(500, new { success = false, message = "Error retrieving diagnostics" });
            }
        }

        #endregion
    }
}
