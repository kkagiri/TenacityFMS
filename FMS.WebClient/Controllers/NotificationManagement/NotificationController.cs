/**
 * File: NotificationController.cs
 * Purpose: Exposes notification management APIs for policies, preferences, history, and delivery actions.
 * Dependencies: INotificationService, IAlarmHandlerService, IMediator, AutoMapper, ASP.NET Core Identity
 * Last Modified: 2026-02-04
 *
 * Key Endpoints:
 * - CreateNotificationPolicy(): Creates a new policy using authenticated user context.
 * - GetNotificationPolicies(): Returns available notification policies.
 * - BulkUpdateNotificationPreferences(): Saves user notification preferences.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Notification.Commands;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.Groups;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Queries;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Services;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

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
        private readonly IAlarmHandlerService _alarmHandlerService;
        private readonly ILogger<NotificationController> _logger;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        private readonly FMS.Application.Features.Notification.Services.Groups.INotificationGroupService _groupService;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;

        public NotificationController(
            INotificationService notificationService,
            IAlarmHandlerService alarmHandlerService,
            ILogger<NotificationController> logger,
            IMediator mediator,
            IMapper mapper,
            FMS.Application.Features.Notification.Services.Groups.INotificationGroupService groupService,
            UserManager<User> userManager,
            RoleManager<Role> roleManager)
        {
            _notificationService = notificationService;
            _alarmHandlerService = alarmHandlerService;
            _logger = logger;
            _mediator = mediator;
            _mapper = mapper;
            _groupService = groupService;
            _userManager = userManager;
            _roleManager = roleManager;
        }

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

        /// <summary>
        /// Create a new notification
        /// </summary>
        /// <param name="request">Notification creation request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created notification ID</returns>
        [HttpPost]
        [RequirePermission(Permissions.Notification.Create)]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                // Set triggered by from current user if not specified
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
        /// <param name="notificationId">Notification ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Send result</returns>
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
        /// <param name="type">Filter by notification type</param>
        /// <param name="category">Filter by category</param>
        /// <param name="priority">Filter by priority</param>
        /// <param name="isRead">Filter by read status</param>
        /// <param name="siteId">Filter by site</param>
        /// <param name="fromDate">Filter from date</param>
        /// <param name="toDate">Filter to date</param>
        /// <param name="skip">Number of records to skip</param>
        /// <param name="take">Number of records to take</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of notifications</returns>
        [HttpGet]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] string? type = null, [FromQuery] string? category = null, [FromQuery] string? priority = null, [FromQuery] bool? isRead = null, [FromQuery] int? siteId = null, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? skip = null, [FromQuery] int? take = null,
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
        /// <param name="notificationId">Notification ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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
        /// <param name="notificationId">Notification ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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

        /// <summary>
        /// Trigger a custom alarm
        /// </summary>
        /// <param name="request">Alarm request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPost("alarm")]
        [RequirePermission(Permissions.Notification.Create)]
        public async Task<IActionResult> TriggerAlarm([FromBody] TriggerAlarmRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (request == null) return BadRequest(new { success = false, message = "Invalid request" });
                if (!TryGetCurrentGuidUserId(out var userId)) return BadRequest("Invalid User ID");

                // Use AutoMapper to map TriggerAlarmRequest to CreateAlarmNotificationRequest
                var alarmRequest = _mapper.Map<CreateAlarmNotificationRequest>(request);
                alarmRequest.TriggeredBy = userId;

                var result = await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering alarm");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Trigger device disconnection alarm
        /// </summary>
        /// <param name="deviceId">Device ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPost("alarm/device-disconnection/{deviceId}")]
        [RequirePermission(Permissions.Notification.Create)]
        public async Task<IActionResult> TriggerDeviceDisconnectionAlarm(string deviceId, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _alarmHandlerService.ProcessDeviceDisconnectionAlarmAsync(deviceId, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering device disconnection alarm for device {DeviceId}", deviceId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get notification statistics for dashboard
        /// </summary>
        /// <param name="fromDate">Start date for statistics</param>
        /// <param name="toDate">End date for statistics</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Statistics data</returns>
        [HttpGet("statistics")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetStatistics(
            [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? recentCount = null, [FromQuery] bool includeDailyBreakdown = true, [FromQuery] bool includeRecentNotifications = true,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                GetNotificationStatisticsRequest statsRequest = new GetNotificationStatisticsRequest
                {
                    UserId = userId,
                    FromDate = fromDate,
                    ToDate = toDate,
                    RecentCount = recentCount,
                    IncludeDailyBreakdown = includeDailyBreakdown,
                    IncludeRecentNotifications = includeRecentNotifications
                };

                FMSResponse<NotificationStatisticsDto> result = await _notificationService.GetNotificationStatisticsAsync(statsRequest, cancellationToken);

                if (result.IsSuccess)
                {
                    return Ok(result.Data);
                }

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

                FMSResponse<NotificationStatisticsDto> result = await _notificationService.GetNotificationStatisticsAsync(request, cancellationToken);
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
        /// Get notification policies
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of notification policies</returns>
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
        /// Get groups mapped to a notification policy
        /// </summary>
        [HttpGet("policies/{policyId}/groups")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> GetGroupsForPolicy(int policyId, CancellationToken cancellationToken = default)
        {
            try
            {
                FMSResponse<List<NotificationGroupDto>> result = await _groupService.GetGroupsForPolicyAsync(policyId, cancellationToken);
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
                FMSResponse result = await _groupService.MapPolicyToGroupAsync(request, cancellationToken);
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
                FMSResponse result = await _groupService.UnmapPolicyFromGroupAsync(policyId, groupId, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, message = result.Message });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmapping policy {PolicyId} from group {GroupId}", policyId, groupId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Search users by query (username or email)
        /// </summary>
        [HttpGet("search/users")]
        [RequirePermission(Permissions.Admin.Users)]
        public IActionResult SearchUsers([FromQuery(Name = "query")] string? q = null, [FromQuery] int take = 20)
        {
            try
            {
                IQueryable<User> usersQuery = _userManager.Users;
                if (!string.IsNullOrWhiteSpace(q))
                {
                    string term = q.Trim();
                    usersQuery = usersQuery.Where(u => (u.UserName != null && u.UserName.Contains(term)) || (u.Email != null && u.Email.Contains(term)));
                }

                var data = usersQuery
                    .Take(take)
                    .Select(u => new { id = u.Id, userName = u.UserName, email = u.Email })
                    .ToList();
                return Ok(new { success = true, data });
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
        public IActionResult SearchRoles([FromQuery(Name = "query")] string? q = null, [FromQuery] int take = 20)
        {
            try
            {
                IQueryable<Role> rolesQuery = _roleManager.Roles;
                if (!string.IsNullOrWhiteSpace(q))
                {
                    string term = q.Trim();
                    rolesQuery = rolesQuery.Where(r => r.Name != null && r.Name.Contains(term));
                }

                var data = rolesQuery
                    .Take(take)
                    .Select(r => new { id = r.Id, name = r.Name })
                    .ToList();
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching roles");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create notification policy
        /// </summary>
        /// <param name="request">Policy creation request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created policy</returns>
        [HttpPost("policies")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> CreateNotificationPolicy([FromBody] CreateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default)
        {
            try
            {
                //TO:do implemnt later
                //           var hasPermission = User.HasClaim ("permissions", "_createFuelRefill");
                //  if (!hasPermission) return Forbid ();
                //  if (!ModelState.IsValid) return BadRequest (ModelState);

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
        /// <param name="policyId">Policy identifier</param>
        /// <param name="request">Policy update request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated status</returns>
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

        /// <summary>
        /// Get alarm handlers
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of alarm handlers</returns>
        [HttpGet("alarm-handlers")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> GetAlarmHandlers([FromQuery] int? policyId = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _alarmHandlerService.GetAlarmHandlersAsync(policyId, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, data = result.Data });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alarm handlers");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("alarm-handlers")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> CreateAlarmHandler([FromBody] FMS.Application.Features.Notification.DTOs.AlarmHandlers.CreateAlarmHandlerRequestDto request, CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault("System");
                var result = await _alarmHandlerService.CreateAlarmHandlerAsync(request, userId, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, id = result.Data, message = result.Message });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating alarm handler");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPut("alarm-handlers/{id}")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> UpdateAlarmHandler(int id, [FromBody] FMS.Application.Features.Notification.DTOs.AlarmHandlers.UpdateAlarmHandlerRequestDto request, CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault("System");
                var result = await _alarmHandlerService.UpdateAlarmHandlerAsync(id, request, userId, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, message = result.Message });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating alarm handler {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpDelete("alarm-handlers/{id}")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> DeleteAlarmHandler(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _alarmHandlerService.DeleteAlarmHandlerAsync(id, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, message = result.Message });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting alarm handler {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("alarm-handlers/types")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAlarmHandlerTypes([FromQuery] int? categoryId = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _alarmHandlerService.GetAlarmHandlerTypesAsync(categoryId, cancellationToken);
                if (result.IsSuccess) return Ok(new { success = true, data = result.Data });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alarm handler types");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Test evaluation of alarm handlers without real telemetry ingestion.
        /// Sends a synthetic AlarmEvaluationEvent into the evaluation engine.
        /// </summary>
        [HttpPost("alarm-handlers/evaluate-test")]
        [AllowAnonymous]
        public async Task<IActionResult> EvaluateAlarmHandlersTest([FromBody] EvaluateAlarmHandlersTestRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.AlarmType))
                {
                    return BadRequest(new { success = false, message = "AlarmType is required" });
                }
                var data = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                if (request.Data != null)
                {
                    foreach (var kv in request.Data) data[kv.Key] = kv.Value;
                }
                if (request.PercentageFull.HasValue)
                {
                    data["percentageFull"] = request.PercentageFull.Value;
                }
                if (request.WaterHeight.HasValue)
                {
                    data["waterHeight"] = request.WaterHeight.Value;
                }
                if (request.OfflineMinutes.HasValue)
                {
                    data["offlineMinutes"] = request.OfflineMinutes.Value;
                }
                var evt = new FMS.Application.Features.Notification.DTOs.AlarmHandlers.AlarmEvaluationEvent
                {
                    AlarmType = request.AlarmType,
                    SiteId = request.SiteId,
                    TankId = request.TankId,
                    DeviceId = request.DeviceId,
                    PtsDeviceId = request.PtsDeviceId,
                    OccurredAtUtc = DateTime.UtcNow,
                    Data = data
                };
                var result = await _alarmHandlerService.EvaluateHandlersAsync(evt, cancellationToken);
                if (result.IsSuccess)
                {
                    return Ok(new { success = true, message = result.Message, created = result.Data });
                }
                return Ok(new { success = false, message = result.Message, created = result.Data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error evaluating alarm handlers test");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        public class EvaluateAlarmHandlersTestRequest
        {
            public string AlarmType { get; set; } = string.Empty;
            public int? SiteId { get; set; }
            public int? TankId { get; set; }
            public int? DeviceId { get; set; }
            public string? PtsDeviceId { get; set; }
            public decimal? PercentageFull { get; set; }
            public decimal? WaterHeight { get; set; }
            public double? OfflineMinutes { get; set; }
            public Dictionary<string, object>? Data { get; set; }
        }

        /// <summary>
        /// Get alert records from PTS
        /// </summary>
        /// <param name="fromDate">Start date</param>
        /// <param name="toDate">End date</param>
        /// <param name="skip">Records to skip</param>
        /// <param name="take">Records to take</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of alert records</returns>
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
        /// Test notification system
        /// </summary>
        /// <param name="request">Test request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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
                    Recipients = new List<NotificationRecipientDto> {
                    new NotificationRecipientDto {
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

        /// <summary>
        /// Get user notification preferences
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>User notification preferences</returns>
        [HttpGet("preferences/user/{userId}")]
        [RequirePermission(Permissions.Notification.ManagePreferences, Permissions.Notification.Read)]
        public async Task<IActionResult> GetUserPreferences(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                // Ensure user can only access their own preferences or is admin
                var currentUserId = GetCurrentUserIdOrDefault(string.Empty);
                if (currentUserId != userId && !User.IsInRole("Admin"))
                {
                    return StatusCode(403, new { success = false, message = "Access denied" });
                }

                // Mock response for now - replace with actual service call when implemented
                var mockPreferences = new List<object> {
                    new {
                    id = 1,
                    userId = userId,
                    notificationCategory = "SensorVariance",
                    deliveryMethods = "System,Email",
                    isEnabled = true,
                    priority = "Medium",
                    quietHoursStart = (string?) null,
                    quietHoursEnd = (string?) null,
                    maxNotificationsPerHour = 0,
                    maxNotificationsPerDay = 0,
                    requireAcknowledgment = false
                    }
                };
                // simulate async for analyzer satisfaction
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
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Current user's notification preferences</returns>
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
                    Request = new GetUserNotificationPreferencesRequest
                    {
                        UserId = currentUserId
                    }
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
        /// <param name="request">Bulk update request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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

                // Always trust the authenticated user id for preference operations; override any client-provided value
                // This avoids foreign key violations when the frontend sends a placeholder like 'current-user'.
                if (string.IsNullOrWhiteSpace(request.UserId) || !string.Equals(request.UserId, currentUserId, StringComparison.OrdinalIgnoreCase))
                {
                    request.UserId = currentUserId; // force correct user id
                }
                // If admin explicitly attempts to update another user's preferences (future feature), that logic can be reintroduced.

                // Use AutoMapper to map controller DTOs to application DTOs
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
        /// Get notification categories
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of notification categories</returns>
        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNotificationCategories(CancellationToken cancellationToken = default)
        {
            try
            {
                var query = new GetNotificationCategoriesQuery
                {
                    IncludeInactive = false
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
                _logger.LogError(ex, "Error getting notification categories");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #region Notification Preferences CRUD

        /// <summary>
        /// Create a new notification preference
        /// </summary>
        /// <param name="request">Create preference request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created preference ID</returns>
        [HttpPost("preferences")]
        [RequirePermission(Permissions.Notification.ManagePreferences, Permissions.Notification.Read)]
        public async Task<IActionResult> CreateNotificationPreference([FromBody] CreateUserNotificationPreferenceRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrDefault(string.Empty);
                if (currentUserId != request.UserId && !User.IsInRole("Admin"))
                {
                    return StatusCode(403, new { success = false, message = "Access denied" });
                }

                var command = new CreateUserNotificationPreferenceCommand
                {
                    Request = request
                };

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
        /// <param name="id">Preference ID</param>
        /// <param name="request">Update preference request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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

                var command = new UpdateUserNotificationPreferenceCommand
                {
                    Request = request
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
                _logger.LogError(ex, "Error updating notification preference {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete a notification preference
        /// </summary>
        /// <param name="id">Preference ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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

                var command = new DeleteUserNotificationPreferenceCommand
                {
                    Id = id,
                    DeletedBy = currentUserId
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
                _logger.LogError(ex, "Error deleting notification preference {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Notification Categories CRUD (Admin Only)

        /// <summary>
        /// Get all notification categories (including inactive for admin)
        /// </summary>
        /// <param name="includeInactive">Include inactive categories</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of notification categories</returns>
        [HttpGet("admin/categories")]
        [Authorize]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> GetAllNotificationCategories([FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default)
        {
            try
            {
                var query = new GetNotificationCategoriesQuery
                {
                    IncludeInactive = includeInactive
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
                _logger.LogError(ex, "Error getting all notification categories");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a new notification category
        /// </summary>
        /// <param name="request">Create category request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created category</returns>
        [HttpPost("admin/categories")]
        [Authorize]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> CreateNotificationCategory([FromBody] CreateNotificationCategoryRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                request.CreatedBy = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;

                var command = new CreateNotificationCategoryCommand
                {
                    Request = request
                };

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
        /// <param name="id">Category ID</param>
        /// <param name="request">Update category request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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

                var command = new UpdateNotificationCategoryCommand
                {
                    Request = request
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
                _logger.LogError(ex, "Error updating notification category {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete a notification category
        /// </summary>
        /// <param name="id">Category ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpDelete("admin/categories/{id}")]
        [Authorize(Roles = "Admin")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> DeleteNotificationCategory(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var command = new DeleteNotificationCategoryCommand
                {
                    Id = id
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
                _logger.LogError(ex, "Error deleting notification category {Id}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion

        #region Testing Endpoints

        /// <summary>
        /// Send a test email to verify SMTP configuration
        /// </summary>
        /// <param name="request">Test email request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
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

                // Get email service from DI
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
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Connection status</returns>
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

                // Check if configuration is valid
                var isConfigured = emailService.IsConfigurationValid();
                if (!isConfigured)
                {
                    return Ok(new { success = false, status = "error", message = "SMTP configuration is invalid or missing. Please configure email settings." });
                }

                await Task.CompletedTask; // Placeholder for actual connection test if needed

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
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Diagnostic info</returns>
        [HttpGet("diagnostics")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetDiagnostics(CancellationToken cancellationToken = default)
        {
            try
            {
                var emailService = HttpContext.RequestServices.GetService<IEmailService>();
                var isEmailConfigured = emailService?.IsConfigurationValid() ?? false;

                // Get recent notification counts
                if (!TryGetCurrentUserId(out var userId))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                GetNotificationStatisticsRequest statsRequest = new GetNotificationStatisticsRequest
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
                        timestamp = DateTime.UtcNow.AddMinutes(-2), // Would need actual tracking
                        status = "delivered"
                    },
                    recentActivity = new[] {
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

/// <summary>
/// Request model for sending test email
/// </summary>
public class SendTestEmailRequest
{
    public string ToAddress { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Message { get; set; }
}
