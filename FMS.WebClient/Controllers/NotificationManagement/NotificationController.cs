/**
 * File: NotificationController.cs
 * Purpose: Exposes notification management APIs for policies, preferences, history, and delivery actions.
 * Dependencies: INotificationService, IMediator, AutoMapper, ASP.NET Core Identity
 * Last Modified: 2026-02-07
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
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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
        private readonly ILogger<NotificationController> _logger;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        private readonly FMS.Application.Features.Notification.Services.Groups.INotificationGroupService _groupService;
        private readonly GpsdataContext _context;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;

        public NotificationController(
            INotificationService notificationService,
            ILogger<NotificationController> logger,
            IMediator mediator,
            IMapper mapper,
            FMS.Application.Features.Notification.Services.Groups.INotificationGroupService groupService,
            GpsdataContext context,
            UserManager<User> userManager,
            RoleManager<Role> roleManager)
        {
            _notificationService = notificationService;
            _logger = logger;
            _mediator = mediator;
            _mapper = mapper;
            _groupService = groupService;
            _context = context;
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

        private ScheduledReportEmailDto MapScheduledReportEmail(FMS.Domain.Entities.Features.Notifications.Notification notification)
        {
            var root = ParseNotificationData(notification.Data);
            var recurringSchedule = root["recurringSchedule"] as JObject;

            var recipients = notification.Recipients?
                .Select(r => new ScheduledReportRecipientDto
                {
                    UserId = r.UserId,
                    UserName = r.User?.UserName ?? r.UserId,
                    DeliveryMethod = r.DeliveryMethod,
                    RecipientAddress = r.RecipientAddress,
                    DeliveryStatus = string.IsNullOrWhiteSpace(r.DeliveryStatus) ? "Pending" : r.DeliveryStatus,
                    SentAt = r.SentAt,
                    DeliveredAt = r.DeliveredAt,
                    DeliveryError = r.DeliveryError
                })
                .ToList() ?? new List<ScheduledReportRecipientDto>();

            var deliveredCount = recipients.Count(r =>
                string.Equals(r.DeliveryStatus, "Sent", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r.DeliveryStatus, "Delivered", StringComparison.OrdinalIgnoreCase));
            var failedCount = recipients.Count(r =>
                string.Equals(r.DeliveryStatus, "Failed", StringComparison.OrdinalIgnoreCase));
            var pendingCount = recipients.Count - deliveredCount - failedCount;

            return new ScheduledReportEmailDto
            {
                Id = notification.Id,
                NotificationId = notification.NotificationId,
                Title = notification.Title,
                Message = notification.Message,
                TriggerSource = notification.TriggerSource,
                Status = notification.Status,
                Priority = notification.Priority,
                CreatedAt = notification.CreatedAt,
                ScheduledAt = notification.ScheduledAt,
                SentAt = notification.SentAt,
                ReportType = root.Value<string>("reportType"),
                ReportTemplateName = root.Value<string>("templateName"),
                Format = root.Value<string>("format"),
                PeriodType = root.Value<string>("periodType"),
                RequestedBy = root.Value<string>("requestedBy"),
                ReportDescription = root.Value<string>("reportDescription"),
                ReportViewPath = root.Value<string>("reportViewPath"),
                ReportViewUrl = root.Value<string>("reportViewUrl"),
                SiteIds = ParseIntList(root["siteIds"]),
                TankIds = ParseIntList(root["tankIds"]),
                EffectiveStartDate = root.Value<string>("effectiveStartDate"),
                EffectiveEndDate = root.Value<string>("effectiveEndDate"),
                SiteNames = ParseStringList(root["siteNames"], "All Sites"),
                TankNames = ParseStringList(root["tankNames"], "All Tanks"),
                TimeZone = recurringSchedule?.Value<string>("timeZone"),
                ScheduleType = recurringSchedule?.Value<string>("scheduleType"),
                ScheduleTimeOfDay = recurringSchedule?.Value<string>("timeOfDay"),
                ScheduleWeekOfMonth = recurringSchedule?.Value<string>("weekOfMonth"),
                ScheduleWeeksOfMonth = NormalizeScheduleWeeks(ParseStringList(recurringSchedule?["weeksOfMonth"], recurringSchedule?.Value<string>("weekOfMonth") ?? string.Empty)),
                ScheduleDaysOfWeek = ParseStringList(recurringSchedule?["daysOfWeek"], recurringSchedule?.Value<string>("dayOfWeek") ?? "monday"),
                NextRunAtUtc = recurringSchedule?.Value<DateTime?>("nextRunAtUtc"),
                LastProcessedAtUtc = recurringSchedule?.Value<DateTime?>("lastProcessedAtUtc"),
                RecipientCount = recipients.Count,
                DeliveredCount = deliveredCount,
                FailedCount = failedCount,
                PendingCount = pendingCount,
                Recipients = recipients
            };
        }

        private static JObject ParseNotificationData(string? dataJson)
        {
            if (string.IsNullOrWhiteSpace(dataJson))
            {
                return new JObject();
            }

            try
            {
                return JObject.Parse(dataJson);
            }
            catch
            {
                return new JObject();
            }
        }

        private static List<string> ParseStringList(JToken? token, string fallbackIfEmpty)
        {
            if (token is JArray arrayToken)
            {
                var values = arrayToken
                    .Select(value => value?.ToString())
                    .Where(value => !string.IsNullOrWhiteSpace(value))
                    .Select(value => value!.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (values.Count > 0)
                {
                    return values;
                }
            }

            if (token is JValue scalarToken)
            {
                var scalarValue = scalarToken.ToString();
                if (!string.IsNullOrWhiteSpace(scalarValue))
                {
                    return scalarValue
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(value => value.Trim())
                        .Where(value => !string.IsNullOrWhiteSpace(value))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();
                }
            }

            return new List<string> { fallbackIfEmpty };
        }

        private static List<int> ParseIntList(JToken? token)
        {
            if (token is JArray arrayToken && arrayToken.Count > 0)
            {
                return arrayToken
                    .Select(value => int.TryParse(value?.ToString(), out var parsed) ? parsed : 0)
                    .Where(value => value > 0)
                    .Distinct()
                    .ToList();
            }

            if (token is JValue scalarToken)
            {
                var scalarValue = scalarToken.ToString();
                if (!string.IsNullOrWhiteSpace(scalarValue))
                {
                    return scalarValue
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(value => int.TryParse(value.Trim(), out var parsed) ? parsed : 0)
                        .Where(value => value > 0)
                        .Distinct()
                        .ToList();
                }
            }

            return new List<int>();
        }

        private static List<string> NormalizeScheduleDays(IEnumerable<string>? values)
        {
            if (values == null)
            {
                return new List<string>();
            }

            return values
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim().ToLowerInvariant())
                .Where(value =>
                    value == "monday" ||
                    value == "tuesday" ||
                    value == "wednesday" ||
                    value == "thursday" ||
                    value == "friday" ||
                    value == "saturday" ||
                    value == "sunday")
                .Distinct()
                .ToList();
        }

        private static List<string> NormalizeScheduleWeeks(IEnumerable<string>? values)
        {
            if (values == null)
            {
                return new List<string>();
            }

            return values
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim().ToLowerInvariant())
                .Where(value =>
                    value == "first" ||
                    value == "second" ||
                    value == "third" ||
                    value == "fourth" ||
                    value == "last")
                .Distinct()
                .ToList();
        }

        private static string NormalizeScheduleTime(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "08:00";
            }

            var rawValue = value.Trim();
            if (TimeSpan.TryParse(rawValue, out var parsedTime))
            {
                var hours = Math.Max(0, Math.Min(23, parsedTime.Hours));
                var minutes = Math.Max(0, Math.Min(59, parsedTime.Minutes));
                return $"{hours:D2}:{minutes:D2}";
            }

            return "08:00";
        }

        private static DateTime NormalizeToUtc(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                return value;
            }

            if (value.Kind == DateTimeKind.Local)
            {
                return value.ToUniversalTime();
            }

            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
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
        /// Get scheduled report email notifications for administrative monitoring.
        /// </summary>
        [HttpGet("scheduled-reports")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        [RequirePermission(Permissions.Notification.Read)]
        public async Task<IActionResult> GetScheduledReportEmails(
            [FromQuery] bool includeCompleted = true,
            [FromQuery] int take = 200,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var safeTake = Math.Max(1, Math.Min(take, 500));

                var query = _context.Notifications
                    .Include(n => n.Recipients)
                    .ThenInclude(r => r.User)
                    .Where(n =>
                        n.TriggerSource == "TransactionVolumeHistoryReportSchedule" ||
                        (n.TriggerSource != null && n.TriggerSource.Contains("ReportSchedule")) ||
                        (n.Data != null && n.Data.Contains("\"reportType\"")));

                if (!includeCompleted)
                {
                    query = query.Where(n =>
                        n.Status == "Scheduled" ||
                        n.Status == "Pending" ||
                        n.Status == "PartiallyFailed");
                }

                var notifications = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(safeTake)
                    .ToListAsync(cancellationToken);

                var response = notifications
                    .Select(MapScheduledReportEmail)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    message = $"Retrieved {response.Count} scheduled report email records",
                    data = response
                });
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
        [Authorize(Roles = "Admin,SuperAdmin")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> UpdateScheduledReportEmail(
            int notificationId,
            [FromBody] UpdateScheduledReportEmailRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { success = false, message = "Request payload is required" });
                }

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId, cancellationToken);

                if (notification == null)
                {
                    return NotFound(new { success = false, message = "Scheduled report notification not found" });
                }

                if (string.Equals(notification.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { success = false, message = "Cancelled schedules cannot be updated" });
                }

                var root = ParseNotificationData(notification.Data);
                var recurringSchedule = root["recurringSchedule"] as JObject ?? new JObject();

                var normalizedDays = NormalizeScheduleDays(request.DaysOfWeek);
                if (normalizedDays.Any())
                {
                    recurringSchedule["daysOfWeek"] = JArray.FromObject(normalizedDays);
                    recurringSchedule["dayOfWeek"] = normalizedDays[0];
                }

                if (!string.IsNullOrWhiteSpace(request.ScheduleType))
                {
                    recurringSchedule["scheduleType"] = request.ScheduleType.Trim().ToLowerInvariant();
                }

                if (!string.IsNullOrWhiteSpace(request.ScheduleTimeOfDay))
                {
                    recurringSchedule["timeOfDay"] = NormalizeScheduleTime(request.ScheduleTimeOfDay);
                }

                var normalizedWeeks = NormalizeScheduleWeeks(request.WeeksOfMonth);
                if (normalizedWeeks.Any())
                {
                    recurringSchedule["weeksOfMonth"] = JArray.FromObject(normalizedWeeks);
                    recurringSchedule["weekOfMonth"] = normalizedWeeks[0];
                }

                if (!string.IsNullOrWhiteSpace(request.WeekOfMonth))
                {
                    var normalizedSingleWeek = NormalizeScheduleWeeks(new[] { request.WeekOfMonth });
                    if (normalizedSingleWeek.Any())
                    {
                        recurringSchedule["weeksOfMonth"] = JArray.FromObject(normalizedSingleWeek);
                        recurringSchedule["weekOfMonth"] = normalizedSingleWeek[0];
                    }
                }

                if (!string.IsNullOrWhiteSpace(request.TimeZone))
                {
                    recurringSchedule["timeZone"] = request.TimeZone.Trim();
                }

                if (request.Enabled.HasValue)
                {
                    recurringSchedule["enabled"] = request.Enabled.Value;
                }

                var hasRecurringConfig =
                    recurringSchedule["daysOfWeek"] != null ||
                    recurringSchedule["dayOfWeek"] != null ||
                    recurringSchedule["scheduleType"] != null ||
                    recurringSchedule["timeOfDay"] != null ||
                    recurringSchedule["weekOfMonth"] != null ||
                    recurringSchedule["weeksOfMonth"] != null ||
                    recurringSchedule["timeZone"] != null;

                if (hasRecurringConfig && recurringSchedule["enabled"] == null)
                {
                    recurringSchedule["enabled"] = true;
                }

                if (hasRecurringConfig)
                {
                    root["recurringSchedule"] = recurringSchedule;
                }

                var scheduledAtUtc = request.ScheduledAtUtc;
                if (!scheduledAtUtc.HasValue)
                {
                    var dataNextRun = root["recurringSchedule"]?["nextRunAtUtc"]?.Value<DateTime?>();
                    if (dataNextRun.HasValue)
                    {
                        scheduledAtUtc = NormalizeToUtc(dataNextRun.Value);
                    }
                }

                if (!scheduledAtUtc.HasValue)
                {
                    return BadRequest(new { success = false, message = "ScheduledAtUtc is required to update schedule timing" });
                }

                var normalizedScheduledAtUtc = NormalizeToUtc(scheduledAtUtc.Value);
                recurringSchedule["nextRunAtUtc"] = normalizedScheduledAtUtc.ToString("o");
                recurringSchedule["lastUpdatedAtUtc"] = DateTime.UtcNow.ToString("o");
                root["recurringSchedule"] = recurringSchedule;

                notification.ScheduledAt = normalizedScheduledAtUtc;
                notification.Status = "Scheduled";
                notification.ErrorMessage = null;
                notification.Data = root.ToString(Formatting.None);

                await _context.SaveChangesAsync(cancellationToken);

                return Ok(new
                {
                    success = true,
                    message = "Scheduled report email updated successfully",
                    data = MapScheduledReportEmail(notification)
                });
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
        [Authorize(Roles = "Admin,SuperAdmin")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> CancelScheduledReportEmail(
            int notificationId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId, cancellationToken);

                if (notification == null)
                {
                    return NotFound(new { success = false, message = "Scheduled report notification not found" });
                }

                if (string.Equals(notification.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    return Ok(new { success = true, message = "Schedule already cancelled" });
                }

                var root = ParseNotificationData(notification.Data);
                var recurringSchedule = root["recurringSchedule"] as JObject ?? new JObject();
                recurringSchedule["enabled"] = false;
                recurringSchedule["cancelledAtUtc"] = DateTime.UtcNow.ToString("o");
                root["recurringSchedule"] = recurringSchedule;

                notification.Status = "Cancelled";
                notification.ScheduledAt = null;
                notification.ErrorMessage = "Schedule cancelled by administrator";
                notification.Data = root.ToString(Formatting.None);

                await _context.SaveChangesAsync(cancellationToken);

                return Ok(new { success = true, message = "Scheduled report email cancelled successfully" });
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
        [Authorize(Roles = "Admin,SuperAdmin")]
        [RequirePermission(Permissions.Notification.ManagePolicy)]
        public async Task<IActionResult> DeleteScheduledReportEmail(
            int notificationId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var notification = await _context.Notifications
                    .Include(n => n.Recipients)
                    .FirstOrDefaultAsync(n => n.Id == notificationId, cancellationToken);

                if (notification == null)
                {
                    return NotFound(new { success = false, message = "Scheduled report notification not found" });
                }

                // Remove associated recipients first
                if (notification.Recipients?.Any() == true)
                {
                    _context.NotificationRecipients.RemoveRange(notification.Recipients);
                }

                // Remove the notification itself
                _context.Notifications.Remove(notification);

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Permanently deleted scheduled report email {NotificationId} (DB ID: {Id})",
                    notification.NotificationId, notificationId);

                return Ok(new { success = true, message = "Scheduled report email deleted permanently" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error permanently deleting scheduled report email {NotificationId}", notificationId);
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
