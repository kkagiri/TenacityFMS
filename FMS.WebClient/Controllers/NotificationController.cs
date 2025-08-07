using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.Notification.Commands;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Queries;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers {
    /// <summary>
    /// Controller for notification management
    /// </summary>
    [ApiController]
    [Route ("api/notifications")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    [Authorize]
    public class NotificationController : ControllerBase {
        private readonly INotificationService _notificationService;
        private readonly IAlarmHandlerService _alarmHandlerService;
        private readonly ILogger<NotificationController> _logger;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public NotificationController (
            INotificationService notificationService,
            IAlarmHandlerService alarmHandlerService,
            ILogger<NotificationController> logger,
            IMediator mediator,
            IMapper mapper) {
            _notificationService = notificationService;
            _alarmHandlerService = alarmHandlerService;
            _logger = logger;
            _mediator = mediator;
            _mapper = mapper;
        }

        /// <summary>
        /// Create a new notification
        /// </summary>
        /// <param name="request">Notification creation request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created notification ID</returns>
        [HttpPost]
        public async Task<IActionResult> CreateNotification ([FromBody] CreateNotificationRequest request, CancellationToken cancellationToken = default) {
            try {
                // Set triggered by from current user if not specified
                if (string.IsNullOrEmpty (request.TriggeredBy)) {
                    request.TriggeredBy = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                }

                var result = await _notificationService.CreateNotificationAsync (request, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message, notificationId = result.Data });
                }

                if (result.ValidationErrors?.Count > 0) {
                    return BadRequest (new { success = false, message = result.Message, errors = result.ValidationErrors });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating notification");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Send a notification immediately
        /// </summary>
        /// <param name="notificationId">Notification ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Send result</returns>
        [HttpPost ("{notificationId}/send")]
        public async Task<IActionResult> SendNotification (int notificationId, CancellationToken cancellationToken = default) {
            try {
                var result = await _notificationService.SendNotificationAsync (notificationId, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending notification {NotificationId}", notificationId);
                return StatusCode (500, new { success = false, message = "Internal server error" });
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
        public async Task<IActionResult> GetNotifications (
            [FromQuery] string? type = null, [FromQuery] string? category = null, [FromQuery] string? priority = null, [FromQuery] bool? isRead = null, [FromQuery] int? siteId = null, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? skip = null, [FromQuery] int? take = null,
            CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty (userId)) {
                    return Unauthorized (new { success = false, message = "User not authenticated" });
                }

                var request = new GetNotificationsRequest {
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

                var result = await _notificationService.GetNotificationsAsync (request, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting notifications");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        /// <param name="notificationId">Notification ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPost ("{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead (int notificationId, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty (userId)) {
                    return Unauthorized (new { success = false, message = "User not authenticated" });
                }

                var result = await _notificationService.MarkAsReadAsync (notificationId, userId, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error marking notification as read");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Acknowledge a notification
        /// </summary>
        /// <param name="notificationId">Notification ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPost ("{notificationId}/acknowledge")]
        public async Task<IActionResult> AcknowledgeNotification (int notificationId, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty (userId)) {
                    return Unauthorized (new { success = false, message = "User not authenticated" });
                }

                var result = await _notificationService.AcknowledgeNotificationAsync (notificationId, userId, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error acknowledging notification");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Trigger a custom alarm
        /// </summary>
        /// <param name="request">Alarm request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPost ("alarm")]
        public async Task<IActionResult> TriggerAlarm ([FromBody] TriggerAlarmRequest request, CancellationToken cancellationToken = default) {
            try {
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value ?? "API";

                // Use AutoMapper to map TriggerAlarmRequest to CreateAlarmNotificationRequest
                var alarmRequest = _mapper.Map<CreateAlarmNotificationRequest> (request);
                alarmRequest.TriggeredBy = currentUserId;

                var result = await _notificationService.CreateAlarmNotificationAsync (alarmRequest, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error triggering alarm");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Trigger device disconnection alarm
        /// </summary>
        /// <param name="deviceId">Device ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPost ("alarm/device-disconnection/{deviceId}")]
        public async Task<IActionResult> TriggerDeviceDisconnectionAlarm (string deviceId, CancellationToken cancellationToken = default) {
            try {
                var result = await _alarmHandlerService.ProcessDeviceDisconnectionAlarmAsync (deviceId, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error triggering device disconnection alarm for device {DeviceId}", deviceId);
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get notification statistics for dashboard
        /// </summary>
        /// <param name="fromDate">Start date for statistics</param>
        /// <param name="toDate">End date for statistics</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Statistics data</returns>
        [HttpGet ("statistics")]
        public async Task<IActionResult> GetStatistics ([FromBody] GetNotificationStatisticsRequest request, CancellationToken cancellationToken = default) {
            try {
                var result = await _notificationService.GetNotificationStatisticsAsync (request, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (result.Data);
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving notification statistics");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get notification policies
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of notification policies</returns>
        [HttpGet ("policies")]
        public async Task<IActionResult> GetNotificationPolicies (CancellationToken cancellationToken = default) {
            try {
                var result = await _notificationService.GetNotificationPoliciesAsync (cancellationToken);

                if (result.IsSuccess) {
                    return Ok (result.Data);
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving notification policies");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create notification policy
        /// </summary>
        /// <param name="request">Policy creation request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created policy</returns>
        [HttpPost ("policies")]
        public async Task<IActionResult> CreateNotificationPolicy ([FromBody] CreateNotificationPolicyRequest request, CancellationToken cancellationToken = default) {
            try {
                var result = await _notificationService.CreateNotificationPolicyAsync (request, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message, policyId = result.Data });
                }

                if (result.ValidationErrors?.Count > 0) {
                    return BadRequest (new { success = false, message = result.Message, errors = result.ValidationErrors });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating notification policy");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get alarm handlers
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of alarm handlers</returns>
        [HttpGet ("alarm-handlers")]
        public async Task<IActionResult> GetAlarmHandlers (CancellationToken cancellationToken = default) {
            try {
                var result = await _alarmHandlerService.GetAlarmHandlersAsync (cancellationToken);

                if (result.IsSuccess) {
                    return Ok (result.Data);
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving alarm handlers");
                return StatusCode (500, new { success = false, message = "Internal server error" });
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
        [HttpGet ("alert-records")]
        public async Task<IActionResult> GetAlertRecords ([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int skip = 0, [FromQuery] int take = 100, CancellationToken cancellationToken = default) {
            try {
                var result = await _notificationService.GetAlertRecordsAsync (fromDate, toDate, skip, take, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (result.Data);
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving alert records");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Test notification system
        /// </summary>
        /// <param name="request">Test request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPost ("test")]
        public async Task<IActionResult> TestNotification ([FromBody] TestNotificationRequest request, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty (userId)) {
                    return Unauthorized (new { success = false, message = "User not authenticated" });
                }

                var notificationRequest = new CreateNotificationRequest {
                    Type = "Info",
                    Category = "Test",
                    Priority = "Low",
                    Title = request.Title ?? "Test Notification",
                    Message = request.Message ?? "This is a test notification from the API",
                    TriggerSource = "API",
                    TriggeredBy = userId,
                    Recipients = new List<CreateNotificationRecipientRequest> {
                    new CreateNotificationRecipientRequest {
                    UserId = userId,
                    DeliveryMethods = request.DeliveryMethods ?? new List<string> { "System" }
                    }
                    }
                };

                var result = await _notificationService.CreateNotificationAsync (notificationRequest, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = "Test notification sent successfully", notificationId = result.Data });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending test notification");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get user notification preferences
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>User notification preferences</returns>
        [HttpGet ("preferences/user/{userId}")]
        public async Task<IActionResult> GetUserPreferences (string userId, CancellationToken cancellationToken = default) {
            try {
                // Ensure user can only access their own preferences or is admin
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId != userId && !User.IsInRole ("Admin")) {
                    return StatusCode (403, new { success = false, message = "Access denied" });
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

                return Ok (new { success = true, message = "Preferences retrieved successfully", data = mockPreferences });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting user notification preferences for user {UserId}", userId);
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get current user's notification preferences
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Current user's notification preferences</returns>
        [HttpGet ("preferences/user/current-user")]
        public async Task<IActionResult> GetCurrentUserPreferences (CancellationToken cancellationToken = default) {
            try {
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty (currentUserId)) {
                    return Unauthorized (new { success = false, message = "User not authenticated" });
                }

                var query = new GetUserNotificationPreferencesQuery {
                    Request = new GetUserNotificationPreferencesRequest {
                    UserId = currentUserId
                    }
                };

                var result = await _mediator.Send (query, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting current user notification preferences");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Bulk update user notification preferences
        /// </summary>
        /// <param name="request">Bulk update request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPost ("preferences/bulk-update")]
        public async Task<IActionResult> BulkUpdateNotificationPreferences ([FromBody] BulkUpdatePreferencesRequest request, CancellationToken cancellationToken = default) {
            try {
                // Ensure user can only update their own preferences or is admin
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId != request.UserId && !User.IsInRole ("Admin")) {
                    return StatusCode (403, new { success = false, message = "Access denied" });
                }

                // Use AutoMapper to map controller DTOs to application DTOs
                var applicationPreferences = (request.Preferences ?? new List<BulkUpdatePreferenceDto> ())
                    .Select (p => {
                        var mapped = _mapper.Map<UserNotificationPreferenceDto> (p);
                        mapped.UserId = request.UserId;
                        mapped.CreatedBy = currentUserId ?? request.UserId;
                        mapped.UpdatedBy = currentUserId ?? request.UserId;
                        return mapped;
                    })
                    .ToList ();

                var command = new BulkUpdateUserNotificationPreferencesCommand {
                    Request = new BulkUpdateUserNotificationPreferencesRequest {
                    UserId = request.UserId,
                    Preferences = applicationPreferences,
                    UpdatedBy = currentUserId ?? request.UserId
                    }
                };

                var result = await _mediator.Send (command, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error bulk updating notification preferences for user {UserId}", request.UserId);
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get notification categories
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of notification categories</returns>
        [HttpGet ("categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNotificationCategories (CancellationToken cancellationToken = default) {
            try {
            var query = new GetNotificationCategoriesQuery {
            IncludeInactive = false
                };

                var result = await _mediator.Send (query, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting notification categories");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        #region Notification Preferences CRUD

        /// <summary>
        /// Create a new notification preference
        /// </summary>
        /// <param name="request">Create preference request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created preference ID</returns>
        [HttpPost ("preferences")]
        public async Task<IActionResult> CreateNotificationPreference ([FromBody] CreateUserNotificationPreferenceRequest request, CancellationToken cancellationToken = default) {
            try {
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId != request.UserId && !User.IsInRole ("Admin")) {
                    return StatusCode (403, new { success = false, message = "Access denied" });
                }

                var command = new CreateUserNotificationPreferenceCommand {
                    Request = request
                };

                var result = await _mediator.Send (command, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message, preferenceId = result.Data });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating notification preference");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update an existing notification preference
        /// </summary>
        /// <param name="id">Preference ID</param>
        /// <param name="request">Update preference request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPut ("preferences/{id}")]
        public async Task<IActionResult> UpdateNotificationPreference (int id, [FromBody] UpdateUserNotificationPreferenceRequest request, CancellationToken cancellationToken = default) {
            try {
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty (currentUserId)) {
                    return Unauthorized (new { success = false, message = "User not authenticated" });
                }

                request.Id = id;
                request.UpdatedBy = currentUserId;

                var command = new UpdateUserNotificationPreferenceCommand {
                    Request = request
                };

                var result = await _mediator.Send (command, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating notification preference {Id}", id);
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete a notification preference
        /// </summary>
        /// <param name="id">Preference ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpDelete ("preferences/{id}")]
        public async Task<IActionResult> DeleteNotificationPreference (int id, CancellationToken cancellationToken = default) {
            try {
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty (currentUserId)) {
                    return Unauthorized (new { success = false, message = "User not authenticated" });
                }

                var command = new DeleteUserNotificationPreferenceCommand {
                    Id = id,
                    DeletedBy = currentUserId
                };

                var result = await _mediator.Send (command, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting notification preference {Id}", id);
                return StatusCode (500, new { success = false, message = "Internal server error" });
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
        [HttpGet ("admin/categories")]
        [Authorize]
        public async Task<IActionResult> GetAllNotificationCategories ([FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default) {
            try {
            var query = new GetNotificationCategoriesQuery {
            IncludeInactive = includeInactive
                };

                var result = await _mediator.Send (query, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message, data = result.Data });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting all notification categories");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a new notification category
        /// </summary>
        /// <param name="request">Create category request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created category</returns>
        [HttpPost ("admin/categories")]
        [Authorize]
        public async Task<IActionResult> CreateNotificationCategory ([FromBody] CreateNotificationCategoryRequest request, CancellationToken cancellationToken = default) {
            try {
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                request.CreatedBy = currentUserId;

                var command = new CreateNotificationCategoryCommand {
                    Request = request
                };

                var result = await _mediator.Send (command, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message, categoryId = result.Data });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating notification category");
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update an existing notification category
        /// </summary>
        /// <param name="id">Category ID</param>
        /// <param name="request">Update category request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpPut ("admin/categories/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateNotificationCategory (int id, [FromBody] UpdateNotificationCategoryRequest request, CancellationToken cancellationToken = default) {
            try {
                var currentUserId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                request.Id = id;
                request.UpdatedBy = currentUserId;

                var command = new UpdateNotificationCategoryCommand {
                    Request = request
                };

                var result = await _mediator.Send (command, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating notification category {Id}", id);
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete a notification category
        /// </summary>
        /// <param name="id">Category ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Result</returns>
        [HttpDelete ("admin/categories/{id}")]
        [Authorize (Roles = "Admin")]
        public async Task<IActionResult> DeleteNotificationCategory (int id, CancellationToken cancellationToken = default) {
            try {
            var command = new DeleteNotificationCategoryCommand {
            Id = id
                };

                var result = await _mediator.Send (command, cancellationToken);

                if (result.IsSuccess) {
                    return Ok (new { success = true, message = result.Message });
                }

                return BadRequest (new { success = false, message = result.Message });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting notification category {Id}", id);
                return StatusCode (500, new { success = false, message = "Internal server error" });
            }
        }

        #endregion
    }
}