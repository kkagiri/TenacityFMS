using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Services;
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
    [Route ("api/[controller]")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    [Authorize]
    public class NotificationController : ControllerBase {
        private readonly INotificationService _notificationService;
        private readonly IAlarmHandlerService _alarmHandlerService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController (
            INotificationService notificationService,
            IAlarmHandlerService alarmHandlerService,
            ILogger<NotificationController> logger) {
            _notificationService = notificationService;
            _alarmHandlerService = alarmHandlerService;
            _logger = logger;
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
            var alarmRequest = new CreateAlarmNotificationRequest {
            AlarmType = request.AlarmType,
            Category = request.Category ?? "Custom",
            Message = request.Message,
            Data = request.Data,
            TriggeredBy = User.FindFirst (ClaimTypes.NameIdentifier)?.Value ?? "API",
            SiteId = request.SiteId,
            PtsDeviceId = request.PtsDeviceId,
            TankId = request.TankId,
            VehicleId = request.VehicleId
                };

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
    }

    // Request DTOs
    public class TriggerAlarmRequest {
        public string AlarmType { get; set; } = null!;
        public string? Category { get; set; }
        public string? Message { get; set; }
        public object? Data { get; set; }
        public int? SiteId { get; set; }
        public int? DeviceId { get; set; }
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
        public string? PtsDeviceId { get; set; }
    }

    public class TestNotificationRequest {
        public string? Title { get; set; }
        public string? Message { get; set; }
        public List<string> ? DeliveryMethods { get; set; }
    }
}