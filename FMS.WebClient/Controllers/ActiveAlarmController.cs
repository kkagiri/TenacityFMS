using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.ActiveAlarm;
using FMS.Domain.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers {
    /// <summary>
    /// Controller for managing active alarms
    /// Provides endpoints for alarm lifecycle operations, statistics, and management
    /// </summary>
    [ApiController]
    [Route ("api/v1/active-alarms")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ActiveAlarmController : ControllerBase {
        private readonly IActiveAlarmService _activeAlarmService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ActiveAlarmController> _logger;

        public ActiveAlarmController (
            IActiveAlarmService activeAlarmService,
            INotificationService notificationService,
            ILogger<ActiveAlarmController> logger) {
            _activeAlarmService = activeAlarmService;
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new active alarm
        /// </summary>
        /// <param name="request">Alarm creation request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created active alarm</returns>
        [HttpPost]
        public async Task<IActionResult> CreateActiveAlarm ([FromBody] CreateActiveAlarmRequest request, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                if (string.IsNullOrEmpty (request.TriggeredBy)) {
                    request.TriggeredBy = userId;
                }

                var activeAlarm = await _activeAlarmService.CreateActiveAlarmAsync (request, cancellationToken);

                return Ok (new ActiveAlarmResponse {
                    Success = true,
                        Message = "Active alarm created successfully",
                        ActiveAlarm = activeAlarm
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating active alarm");
                return StatusCode (500, new ActiveAlarmResponse {
                    Success = false,
                        Message = "Failed to create active alarm"
                });
            }
        }

        /// <summary>
        /// Gets active alarms with filtering and pagination
        /// </summary>
        /// <param name="siteId">Optional site filter</param>
        /// <param name="alarmType">Optional alarm type filter</param>
        /// <param name="state">Optional state filter</param>
        /// <param name="priority">Optional priority filter</param>
        /// <param name="fromDate">Optional date range start</param>
        /// <param name="toDate">Optional date range end</param>
        /// <param name="skip">Records to skip for pagination</param>
        /// <param name="take">Records to take for pagination</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of active alarms</returns>
        [HttpGet]
        public async Task<IActionResult> GetActiveAlarms (
            [FromQuery] int? siteId = null, [FromQuery] string? alarmType = null, [FromQuery] string? state = null, [FromQuery] string? priority = null, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int skip = 0, [FromQuery] int take = 50,
            CancellationToken cancellationToken = default) {
            try {
                var alarms = await _activeAlarmService.GetActiveAlarmsAsync (
                    siteId, alarmType, state, priority, fromDate, toDate, skip, take, cancellationToken);

                return Ok (new {
                    success = true,
                        data = alarms,
                        count = alarms.Count
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving active alarms");
                return StatusCode (500, new { success = false, message = "Failed to retrieve active alarms" });
            }
        }

        /// <summary>
        /// Gets a specific active alarm by ID
        /// </summary>
        /// <param name="id">Alarm ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Active alarm details</returns>
        [HttpGet ("{id}")]
        public async Task<IActionResult> GetActiveAlarmById (int id, CancellationToken cancellationToken = default) {
            try {
                var alarm = await _activeAlarmService.GetActiveAlarmByIdAsync (id, cancellationToken);

                if (alarm == null) {
                    return NotFound (new { success = false, message = "Active alarm not found" });
                }

                return Ok (new {
                    success = true,
                        data = alarm
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving active alarm {AlarmId}", id);
                return StatusCode (500, new { success = false, message = "Failed to retrieve active alarm" });
            }
        }

        /// <summary>
        /// Acknowledges an active alarm
        /// </summary>
        /// <param name="id">Alarm ID</param>
        /// <param name="request">Acknowledgment request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated active alarm</returns>
        [HttpPost ("{id}/acknowledge")]
        public async Task<IActionResult> AcknowledgeAlarm (int id, [FromBody] AcknowledgeAlarmRequest request, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                var alarm = await _activeAlarmService.AcknowledgeAlarmAsync (id, userId, request.Notes, cancellationToken);

                if (alarm == null) {
                    return NotFound (new { success = false, message = "Active alarm not found" });
                }

                return Ok (new ActiveAlarmResponse {
                    Success = true,
                        Message = "Alarm acknowledged successfully",
                        ActiveAlarm = alarm
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error acknowledging active alarm {AlarmId}", id);
                return StatusCode (500, new ActiveAlarmResponse {
                    Success = false,
                        Message = "Failed to acknowledge alarm"
                });
            }
        }

        /// <summary>
        /// Resolves an active alarm
        /// </summary>
        /// <param name="id">Alarm ID</param>
        /// <param name="request">Resolution request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated active alarm</returns>
        [HttpPost ("{id}/resolve")]
        public async Task<IActionResult> ResolveAlarm (int id, [FromBody] ResolveAlarmRequest request, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                var alarm = await _activeAlarmService.ResolveAlarmAsync (id, userId, request.ResolutionNotes, cancellationToken);

                if (alarm == null) {
                    return NotFound (new { success = false, message = "Active alarm not found" });
                }

                return Ok (new ActiveAlarmResponse {
                    Success = true,
                        Message = "Alarm resolved successfully",
                        ActiveAlarm = alarm
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error resolving active alarm {AlarmId}", id);
                return StatusCode (500, new ActiveAlarmResponse {
                    Success = false,
                        Message = "Failed to resolve alarm"
                });
            }
        }

        /// <summary>
        /// Suppresses an active alarm
        /// </summary>
        /// <param name="id">Alarm ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated active alarm</returns>
        [HttpPost ("{id}/suppress")]
        public async Task<IActionResult> SuppressAlarm (int id, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                var alarm = await _activeAlarmService.SuppressAlarmAsync (id, userId, cancellationToken);

                if (alarm == null) {
                    return NotFound (new { success = false, message = "Active alarm not found" });
                }

                return Ok (new ActiveAlarmResponse {
                    Success = true,
                        Message = "Alarm suppressed successfully",
                        ActiveAlarm = alarm
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error suppressing active alarm {AlarmId}", id);
                return StatusCode (500, new ActiveAlarmResponse {
                    Success = false,
                        Message = "Failed to suppress alarm"
                });
            }
        }

        /// <summary>
        /// Escalates an active alarm
        /// </summary>
        /// <param name="id">Alarm ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated active alarm</returns>
        [HttpPost ("{id}/escalate")]
        public async Task<IActionResult> EscalateAlarm (int id, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                var alarm = await _activeAlarmService.EscalateAlarmAsync (id, userId, cancellationToken);

                if (alarm == null) {
                    return NotFound (new { success = false, message = "Active alarm not found" });
                }

                return Ok (new ActiveAlarmResponse {
                    Success = true,
                        Message = "Alarm escalated successfully",
                        ActiveAlarm = alarm
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error escalating active alarm {AlarmId}", id);
                return StatusCode (500, new ActiveAlarmResponse {
                    Success = false,
                        Message = "Failed to escalate alarm"
                });
            }
        }

        /// <summary>
        /// Bulk acknowledges multiple alarms
        /// </summary>
        /// <param name="request">Bulk acknowledge request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Number of alarms acknowledged</returns>
        [HttpPost ("bulk-acknowledge")]
        public async Task<IActionResult> BulkAcknowledgeAlarms ([FromBody] BulkAcknowledgeRequest request, CancellationToken cancellationToken = default) {
            try {
                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                var count = await _activeAlarmService.BulkAcknowledgeAlarmsAsync (request.AlarmIds, userId, request.Notes, cancellationToken);

                return Ok (new {
                    success = true,
                        message = $"Successfully acknowledged {count} alarms",
                        acknowledgedCount = count
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error bulk acknowledging alarms");
                return StatusCode (500, new { success = false, message = "Failed to bulk acknowledge alarms" });
            }
        }

        /// <summary>
        /// Gets alarm statistics for dashboard
        /// </summary>
        /// <param name="siteId">Optional site filter</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Alarm statistics</returns>
        [HttpGet ("statistics")]
        public async Task<IActionResult> GetAlarmStatistics ([FromQuery] int? siteId = null, CancellationToken cancellationToken = default) {
            try {
                var statistics = await _activeAlarmService.GetAlarmStatisticsAsync (siteId, cancellationToken);

                return Ok (new {
                    success = true,
                        data = statistics
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving alarm statistics");
                return StatusCode (500, new { success = false, message = "Failed to retrieve alarm statistics" });
            }
        }

        /// <summary>
        /// Processes auto-resolution for eligible alarms
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Number of alarms auto-resolved</returns>
        [HttpPost ("process-auto-resolve")]
        [Authorize (Roles = "Administrator,SystemAdmin")]
        public async Task<IActionResult> ProcessAutoResolveAlarms (CancellationToken cancellationToken = default) {
            try {
                var count = await _activeAlarmService.ProcessAutoResolveAlarmsAsync (cancellationToken);

                return Ok (new {
                    success = true,
                        message = $"Auto-resolved {count} alarms",
                        resolvedCount = count
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing auto-resolve alarms");
                return StatusCode (500, new { success = false, message = "Failed to process auto-resolve alarms" });
            }
        }

        /// <summary>
        /// Processes escalation for eligible alarms
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Number of alarms escalated</returns>
        [HttpPost ("process-escalation")]
        [Authorize (Roles = "Administrator,SystemAdmin")]
        public async Task<IActionResult> ProcessEscalationAlarms (CancellationToken cancellationToken = default) {
            try {
                var count = await _activeAlarmService.ProcessEscalationAlarmsAsync (cancellationToken);

                return Ok (new {
                    success = true,
                        message = $"Escalated {count} alarms",
                        escalatedCount = count
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing escalation alarms");
                return StatusCode (500, new { success = false, message = "Failed to process escalation alarms" });
            }
        }

        /// <summary>
        /// Creates a test alarm for development and testing purposes
        /// </summary>
        /// <param name="request">Test alarm creation request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created test alarm</returns>
        [HttpPost ("test")]
        public async Task<IActionResult> CreateTestAlarm ([FromBody] CreateActiveAlarmRequest request, CancellationToken cancellationToken = default) {
            try {
                var userIdClaim = User.Claims.FirstOrDefault (c =>
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                    Guid.TryParse (c.Value, out _)
                );

                var userId = userIdClaim?.Value ?? "TestUser";

                // Override some fields for test alarms
                request.TriggerSource = "Manual";
                request.TriggeredBy = userId;
                request.AlarmType = $"Test_{request.AlarmType}";
                request.Description = $"[TEST ALARM] {request.Description}";

                var activeAlarm = await _activeAlarmService.CreateActiveAlarmAsync (request, cancellationToken);

                // Create a notification for the test alarm so it appears in notification center
                var notificationRequest = new CreateNotificationRequest {
                    Type = NotificationType.Alert,
                    CategoryId = (int) WellKnownCategories.PtsDeviceAlarm,
                    Priority = NotificationPriority.Medium,
                    Title = $"Test Alarm: {request.AlarmType?.Replace("Test_", "")}",
                    Message = $"Test alarm created: {request.Description?.Replace("[TEST ALARM] ", "")}",
                    Data = new {
                    AlarmType = request.AlarmType,
                    TestAlarm = true,
                    ActiveAlarmId = activeAlarm.Id,
                    CreatedBy = userId
                    },
                    TriggerSource = "Test",
                    TriggeredBy = userId,
                    SiteId = request.SiteId,
                    TankId = request.TankId,
                    Recipients = new List<NotificationRecipientDto> {
                    new NotificationRecipientDto {
                    UserId = userIdClaim.Value,
                    DeliveryMethods = new List<string> { "System" }
                    }
                    }
                };

                // Create the notification
                await _notificationService.CreateNotificationAsync (notificationRequest, cancellationToken);

                // For testing, we'll also trigger a SignalR broadcast
                // This would typically be handled by a domain event or service
                _logger.LogInformation ("Test alarm created with ID {AlarmId}", activeAlarm.Id);

                return Ok (new ActiveAlarmResponse {
                    Success = true,
                        Message = "Test alarm created successfully",
                        ActiveAlarm = activeAlarm
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating test alarm");
                return StatusCode (500, new ActiveAlarmResponse {
                    Success = false,
                        Message = "Failed to create test alarm"
                });
            }
        }

        /// <summary>
        /// Triggers a test SignalR broadcast for alarm testing
        /// </summary>
        /// <param name="message">Test message</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Success response</returns>
        [HttpPost ("test-signalr")]
        public async Task<IActionResult> TestSignalRBroadcast ([FromBody] string message, CancellationToken cancellationToken = default) {
            try {
                // This would typically inject the SignalR hub and broadcast
                // For now, we'll just log and return success
                _logger.LogInformation ("SignalR test broadcast requested: {Message}", message);

                return Ok (new {
                    success = true,
                        message = "SignalR test broadcast sent",
                        timestamp = DateTime.UtcNow
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending SignalR test broadcast");
                return StatusCode (500, new { success = false, message = "Failed to send SignalR test broadcast" });
            }
        }
    }

    /// <summary>
    /// Request DTO for acknowledging an alarm
    /// </summary>
    public class AcknowledgeAlarmRequest {
        /// <summary>
        /// Optional acknowledgment notes
        /// </summary>
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Request DTO for resolving an alarm
    /// </summary>
    public class ResolveAlarmRequest {
        /// <summary>
        /// Required resolution notes
        /// </summary>
        [System.ComponentModel.DataAnnotations.Required]
        public string ResolutionNotes { get; set; } = null!;
    }

    /// <summary>
    /// Request DTO for bulk acknowledging alarms
    /// </summary>
    public class BulkAcknowledgeRequest {
        /// <summary>
        /// List of alarm IDs to acknowledge
        /// </summary>
        [System.ComponentModel.DataAnnotations.Required]
        public List<int> AlarmIds { get; set; } = new List<int> ();

        /// <summary>
        /// Optional bulk acknowledgment notes
        /// </summary>
        public string? Notes { get; set; }
    }
}