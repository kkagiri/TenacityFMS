using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Infrastructure.Communication.SignalR;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Threading;

namespace FMS.Application.Services
{
    /// <summary>
    /// Core notification service for creating, sending, and managing notifications
    /// </summary>
    public interface INotificationService
    {
        Task<FMSResponse<int>> CreateNotificationAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> SendNotificationAsync(int notificationId, CancellationToken cancellationToken = default);
        Task<FMSResponse> SendScheduledNotificationsAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse> MarkAsReadAsync(int notificationId, string userId, CancellationToken cancellationToken = default);
        Task<FMSResponse> AcknowledgeNotificationAsync(int notificationId, string userId, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<NotificationDto>>> GetNotificationsAsync(GetNotificationsRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> CreateAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse> CreateIssueTrackerNotificationAsync(int issueTrackerId, string triggeredBy, CancellationToken cancellationToken = default);
        Task<FMSResponse<object>> GetNotificationStatisticsAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<object>>> GetNotificationPoliciesAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse<int>> CreateNotificationPolicyAsync(CreateNotificationPolicyRequest request, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<object>>> GetAlertRecordsAsync(DateTime? fromDate, DateTime? toDate, int skip, int take, CancellationToken cancellationToken = default);
        Task<FMSResponse> SendTestNotificationAsync(TestNotificationRequest request, CancellationToken cancellationToken = default);
    }

    public class NotificationService : INotificationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<NotificationService> _logger;
        private readonly ISignalRNotificationService _signalRService;
        private readonly IEmailService _emailService;
        private readonly ISmsService _smsService;
        private readonly ISystemUserService _systemUserService;

        public NotificationService(
            GpsdataContext context,
            ILogger<NotificationService> logger,
            ISignalRNotificationService signalRService,
            IEmailService emailService,
            ISmsService smsService,
            ISystemUserService systemUserService)
        {
            _context = context;
            _logger = logger;
            _signalRService = signalRService;
            _emailService = emailService;
            _smsService = smsService;
            _systemUserService = systemUserService;
        }

        public async Task<FMSResponse<int>> CreateNotificationAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                //Cursor: Validation
                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(request.Type))
                    validationErrors.Add("Notification type is required");

                if (string.IsNullOrWhiteSpace(request.Category))
                    validationErrors.Add("Notification category is required");

                if (string.IsNullOrWhiteSpace(request.Title))
                    validationErrors.Add("Notification title is required");

                if (string.IsNullOrWhiteSpace(request.Message))
                    validationErrors.Add("Notification message is required");

                if (string.IsNullOrWhiteSpace(request.TriggerSource))
                    validationErrors.Add("Trigger source is required");

                if (request.Recipients == null || !request.Recipients.Any())
                    validationErrors.Add("At least one recipient is required");

                if (validationErrors.Any())
                    return FMSResponse<int>.ValidationFailed(validationErrors);

                // Check if policy limits are exceeded
                if (request.NotificationPolicyId.HasValue)
                {
                    var policy = await _context.NotificationPolicies
                        .FirstOrDefaultAsync(p => p.Id == request.NotificationPolicyId.Value, cancellationToken);

                    if (policy != null)
                    {
                        var limitCheck = await CheckPolicyLimitsAsync(policy, cancellationToken);
                        if (!limitCheck.IsSuccess)
                            return FMSResponse<int>.Failed(limitCheck.Message);
                    }
                }

                // Create notification
                var notification = new Notification
                {
                    NotificationId = request.NotificationId ?? Guid.NewGuid().ToString(),
                    Type = request.Type,
                    Category = request.Category,
                    Priority = request.Priority ?? "Medium",
                    Title = request.Title,
                    Message = request.Message,
                    Data = request.Data != null ? JsonConvert.SerializeObject(request.Data) : null,
                    TriggerSource = request.TriggerSource,
                    TriggeredBy = request.TriggeredBy,
                    ScheduledAt = request.ScheduledAt,
                    SiteId = request.SiteId,
                    DeviceId = request.DeviceId,
                    TankId = request.TankId,
                    VehicleId = request.VehicleId,
                    IssueTrackerId = request.IssueTrackerId,
                    AlarmId = request.AlarmId,
                    NotificationPolicyId = request.NotificationPolicyId,
                    Status = request.ScheduledAt.HasValue ? "Scheduled" : "Pending"
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync(cancellationToken);

                // Create recipients
                foreach (var recipientRequest in request.Recipients)
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == recipientRequest.UserId, cancellationToken);
                    if (user == null)
                    {
                        _logger.LogWarning("User {UserId} not found for notification recipient", recipientRequest.UserId);
                        continue;
                    }

                    foreach (var deliveryMethod in recipientRequest.DeliveryMethods)
                    {
                        var recipientAddress = GetRecipientAddress(user, deliveryMethod);
                        if (string.IsNullOrEmpty(recipientAddress))
                        {
                            _logger.LogWarning("No {DeliveryMethod} address found for user {UserId}", deliveryMethod, user.Id);
                            continue;
                        }

                        var recipient = new NotificationRecipient
                        {
                            NotificationId = notification.Id,
                            UserId = recipientRequest.UserId,
                            DeliveryMethod = deliveryMethod,
                            RecipientAddress = recipientAddress,
                            PriorityOverride = recipientRequest.PriorityOverride
                        };

                        _context.NotificationRecipients.Add(recipient);
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Send immediately if not scheduled
                if (!request.ScheduledAt.HasValue)
                {
                    await SendNotificationAsync(notification.Id, cancellationToken);
                }

                _logger.LogInformation("Notification {NotificationId} created successfully", notification.NotificationId);
                return FMSResponse<int>.Success(notification.Id, "Notification created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                return FMSResponse<int>.Failed($"Error creating notification: {ex.Message}");
            }
        }

        public async Task<FMSResponse> SendNotificationAsync(int notificationId, CancellationToken cancellationToken = default)
        {
            try
            {
                var notification = await _context.Notifications
                    .Include(n => n.Recipients)
                    .ThenInclude(r => r.User)
                    .FirstOrDefaultAsync(n => n.Id == notificationId, cancellationToken);

                if (notification == null)
                    return FMSResponse.FailedResponse("Notification not found");

                if (notification.Status == "Sent")
                    return FMSResponse.SuccessResponse("Notification already sent");

                var successCount = 0;
                var failureCount = 0;

                foreach (var recipient in notification.Recipients)
                {
                    try
                    {
                        var success = await SendToRecipientAsync(notification, recipient, cancellationToken);
                        if (success)
                        {
                            successCount++;
                            recipient.DeliveryStatus = "Sent";
                            recipient.SentAt = DateTime.UtcNow;
                        }
                        else
                        {
                            failureCount++;
                            recipient.DeliveryStatus = "Failed";
                            recipient.DeliveryError = "Failed to send notification";
                        }

                        recipient.DeliveryAttempts++;
                    }
                    catch (Exception ex)
                    {
                        failureCount++;
                        recipient.DeliveryStatus = "Failed";
                        recipient.DeliveryError = ex.Message;
                        recipient.DeliveryAttempts++;
                        _logger.LogError(ex, "Error sending notification to recipient {UserId}", recipient.UserId);
                    }
                }

                // Update notification status
                notification.Status = failureCount == 0 ? "Sent" : (successCount > 0 ? "PartiallyFailed" : "Failed");
                notification.SentAt = DateTime.UtcNow;
                notification.SendAttempts++;

                if (failureCount > 0)
                    notification.ErrorMessage = $"Failed to send to {failureCount} recipients";

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Notification {NotificationId} sent. Success: {SuccessCount}, Failed: {FailureCount}",
                    notification.NotificationId, successCount, failureCount);

                return FMSResponse.SuccessResponse($"Notification sent. Success: {successCount}, Failed: {failureCount}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification {NotificationId}", notificationId);
                return FMSResponse.FailedResponse($"Error sending notification: {ex.Message}");
            }
        }

        public async Task<FMSResponse> SendScheduledNotificationsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var now = DateTime.UtcNow;
                var scheduledNotifications = await _context.Notifications
                    .Where(n => n.Status == "Scheduled" && n.ScheduledAt <= now)
                    .ToListAsync(cancellationToken);

                var processedCount = 0;
                var errorCount = 0;

                foreach (var notification in scheduledNotifications)
                {
                    try
                    {
                        var result = await SendNotificationAsync(notification.Id, cancellationToken);
                        if (result.IsSuccess)
                            processedCount++;
                        else
                            errorCount++;
                    }
                    catch (Exception ex)
                    {
                        errorCount++;
                        _logger.LogError(ex, "Error processing scheduled notification {NotificationId}", notification.NotificationId);
                    }
                }

                _logger.LogInformation("Processed {ProcessedCount} scheduled notifications, {ErrorCount} errors", processedCount, errorCount);
                return FMSResponse.SuccessResponse($"Processed {processedCount} scheduled notifications");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing scheduled notifications");
                return FMSResponse.FailedResponse($"Error processing scheduled notifications: {ex.Message}");
            }
        }

        public async Task<FMSResponse> CreateAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                // Find applicable alarm handlers
                var handlers = await _context.AlarmHandlers
                    .Include(h => h.NotificationPolicy)
                    .ThenInclude(p => p.PolicyRecipients)
                    .Where(h => h.IsActive &&
                               (h.AlarmType == request.AlarmType || h.AlarmId == request.AlarmId) &&
                               (!h.SiteId.HasValue || h.SiteId == request.SiteId) &&
                               (!h.TankId.HasValue || h.TankId == request.TankId) &&
                               (!h.DeviceId.HasValue || h.DeviceId == request.DeviceId))
                    .ToListAsync(cancellationToken);

                var notificationsCreated = 0;

                foreach (var handler in handlers)
                {
                    // Check cooldown
                    if (handler.CooldownMinutes > 0 && handler.LastTriggeredAt.HasValue)
                    {
                        var cooldownExpiry = handler.LastTriggeredAt.Value.AddMinutes(handler.CooldownMinutes);
                        if (DateTime.UtcNow < cooldownExpiry)
                        {
                            _logger.LogDebug("Alarm handler {HandlerId} is in cooldown period", handler.Id);
                            continue;
                        }
                    }

                    // Check daily limit
                    if (handler.MaxNotificationsPerDay > 0)
                    {
                        var today = DateTime.UtcNow.Date;
                        var todayCount = await _context.AlarmHandlerExecutions
                            .CountAsync(e => e.AlarmHandlerId == handler.Id && e.ExecutedAt.Date == today, cancellationToken);

                        if (todayCount >= handler.MaxNotificationsPerDay)
                        {
                            _logger.LogDebug("Alarm handler {HandlerId} has reached daily limit", handler.Id);
                            continue;
                        }
                    }

                    // Create notification using policy
                    var policy = handler.NotificationPolicy;
                    var recipients = policy.PolicyRecipients
                        .Where(pr => pr.IsActive)
                        .Select(pr => new CreateNotificationRecipientRequest
                        {
                            UserId = pr.UserId,
                            DeliveryMethods = pr.DeliveryMethods.Split(',').Select(dm => dm.Trim()).ToList(),
                            PriorityOverride = pr.PriorityOverride
                        }).ToList();

                    var notificationRequest = new CreateNotificationRequest
                    {
                        Type = "Alert",
                        Category = request.Category ?? "Alarm",
                        Priority = handler.Priority,
                        Title = FormatTemplate(handler.MessageTemplate ?? policy.TitleTemplate ?? "Alarm: {AlarmType}", request),
                        Message = FormatTemplate(handler.MessageTemplate ?? policy.MessageTemplate ?? "Alarm triggered: {AlarmType}", request),
                        Data = request.Data,
                        TriggerSource = "Alarm",
                        TriggeredBy = request.TriggeredBy,
                        SiteId = request.SiteId,
                        DeviceId = request.DeviceId,
                        TankId = request.TankId,
                        AlarmId = request.AlarmId,
                        NotificationPolicyId = policy.Id,
                        Recipients = recipients
                    };

                    var result = await CreateNotificationAsync(notificationRequest, cancellationToken);
                    if (result.IsSuccess)
                    {
                        notificationsCreated++;

                        // Update handler statistics
                        handler.TriggerCount++;
                        handler.LastTriggeredAt = DateTime.UtcNow;

                        // Create execution record
                        var execution = new AlarmHandlerExecution
                        {
                            AlarmHandlerId = handler.Id,
                            NotificationId = result.Data,
                            Success = true,
                            TriggerData = JsonConvert.SerializeObject(request),
                            ExecutionDetails = JsonConvert.SerializeObject(new { NotificationId = result.Data })
                        };

                        _context.AlarmHandlerExecutions.Add(execution);

                        // Create issue tracker if configured
                        if (handler.CreateIssueTracker && handler.IssueCategory.HasValue)
                        {
                            await CreateIssueFromAlarmAsync(handler, request, cancellationToken);
                        }
                    }
                    else
                    {
                        // Create failed execution record
                        var execution = new AlarmHandlerExecution
                        {
                            AlarmHandlerId = handler.Id,
                            Success = false,
                            ErrorMessage = result.Message,
                            TriggerData = JsonConvert.SerializeObject(request)
                        };

                        _context.AlarmHandlerExecutions.Add(execution);
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created {Count} alarm notifications for {AlarmType}", notificationsCreated, request.AlarmType);
                return FMSResponse.SuccessResponse($"Created {notificationsCreated} alarm notifications");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating alarm notification for {AlarmType}", request.AlarmType);
                return FMSResponse.FailedResponse($"Error creating alarm notification: {ex.Message}");
            }
        }

        public async Task<FMSResponse> CreateIssueTrackerNotificationAsync(int issueTrackerId, string triggeredBy, CancellationToken cancellationToken = default)
        {
            try
            {
                var issue = await _context.Issuetrackers
                    .Include(i => i.IssueCategory)
                    .Include(i => i.PriorityNavigation)
                    .Include(i => i.Site)
                    .FirstOrDefaultAsync(i => i.Id == issueTrackerId, cancellationToken);

                if (issue == null)
                    return FMSResponse.FailedResponse("Issue tracker not found");

                // Find notification policy for issue tracker notifications
                var policy = await _context.NotificationPolicies
                    .Include(p => p.PolicyRecipients)
                    .FirstOrDefaultAsync(p => p.IsActive && p.Category == "Issue" && p.NotificationType == "Alert", cancellationToken);

                if (policy == null)
                {
                    _logger.LogWarning("No notification policy found for issue tracker notifications");
                    return FMSResponse.FailedResponse("No notification policy configured for issue tracker notifications");
                }

                var recipients = policy.PolicyRecipients
                    .Where(pr => pr.IsActive)
                    .Select(pr => new CreateNotificationRecipientRequest
                    {
                        UserId = pr.UserId,
                        DeliveryMethods = pr.DeliveryMethods.Split(',').Select(dm => dm.Trim()).ToList(),
                        PriorityOverride = pr.PriorityOverride
                    }).ToList();

                var notificationRequest = new CreateNotificationRequest
                {
                    Type = "Alert",
                    Category = "Issue",
                    Priority = issue.PriorityNavigation?.Name ?? "Medium",
                    Title = $"New Issue: {issue.ProblemTitle}",
                    Message = $"A new issue has been created: {issue.ProblemDescription}",
                    Data = new { IssueId = issueTrackerId, Category = issue.IssueCategory?.Name },
                    TriggerSource = "IssueTracker",
                    TriggeredBy = triggeredBy,
                    SiteId = issue.SiteId,
                    IssueTrackerId = issueTrackerId,
                    NotificationPolicyId = policy.Id,
                    Recipients = recipients
                };

                var result = await CreateNotificationAsync(notificationRequest, cancellationToken);

                _logger.LogInformation("Created issue tracker notification for issue {IssueId}", issueTrackerId);
                return result.IsSuccess ? FMSResponse.SuccessResponse("Issue tracker notification created") : FMSResponse.FailedResponse(result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating issue tracker notification for issue {IssueId}", issueTrackerId);
                return FMSResponse.FailedResponse($"Error creating issue tracker notification: {ex.Message}");
            }
        }

        // Additional methods continued in next part...

        private async Task<bool> SendToRecipientAsync(Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                switch (recipient.DeliveryMethod.ToLower())
                {
                    case var method when method == SystemConstants.Notifications.SystemDeliveryMethod.ToLower():
                        return await SendSystemNotificationAsync(notification, recipient, cancellationToken);
                    case "email":
                        return await SendEmailNotificationAsync(notification, recipient, cancellationToken);
                    case "sms":
                        return await SendSmsNotificationAsync(notification, recipient, cancellationToken);
                    default:
                        _logger.LogWarning("Unknown delivery method: {DeliveryMethod}", recipient.DeliveryMethod);
                        return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification via {DeliveryMethod} to {UserId}",
                    recipient.DeliveryMethod, recipient.UserId);
                return false;
            }
        }

        private async Task<bool> SendSystemNotificationAsync(Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                await _signalRService.SendUserNotificationAsync(
                    recipient.UserId,
                    SystemConstants.Notifications.SystemNotificationType,
                    notification.Message,
                    new
                    {
                        id = notification.NotificationId,
                        title = notification.Title,
                        message = notification.Message,
                        type = notification.Type.ToLower(),
                        priority = notification.Priority,
                        timestamp = notification.CreatedAt,
                        data = notification.Data != null ? JsonConvert.DeserializeObject(notification.Data) : null
                    });

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending system notification to {UserId}", recipient.UserId);
                return false;
            }
        }

        private async Task<bool> SendEmailNotificationAsync(Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                var policy = notification.NotificationPolicy;
                var emailTemplate = policy?.EmailTemplate ?? GetDefaultEmailTemplate();

                var emailContent = FormatEmailTemplate(emailTemplate, notification, recipient);

                return await _emailService.SendEmailAsync(
                    recipient.RecipientAddress,
                    notification.Title,
                    emailContent,
                    isHtml: true,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email notification to {Email}", recipient.RecipientAddress);
                return false;
            }
        }

        private async Task<bool> SendSmsNotificationAsync(Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                var policy = notification.NotificationPolicy;
                var smsTemplate = policy?.SmsTemplate ?? "{Title}: {Message}";

                var smsContent = FormatTemplate(smsTemplate, new
                {
                    Title = notification.Title,
                    Message = notification.Message,
                    Priority = notification.Priority,
                    Category = notification.Category
                });

                return await _smsService.SendSmsAsync(
                    recipient.RecipientAddress,
                    smsContent,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending SMS notification to {Phone}", recipient.RecipientAddress);
                return false;
            }
        }

        private string? GetRecipientAddress(User user, string deliveryMethod)
        {
            return deliveryMethod.ToLower() switch
            {
                "email" => user.Email,
                "sms" => user.PhoneNumber,
                "system" => user.Id,
                _ => null
            };
        }

        private async Task<FMSResponse> CheckPolicyLimitsAsync(NotificationPolicy policy, CancellationToken cancellationToken)
        {
            try
            {
                var now = DateTime.UtcNow;

                // Check hourly limit
                if (policy.MaxNotificationsPerHour > 0)
                {
                    var hourAgo = now.AddHours(-1);
                    var hourlyCount = await _context.Notifications
                        .CountAsync(n => n.NotificationPolicyId == policy.Id && n.CreatedAt >= hourAgo, cancellationToken);

                    if (hourlyCount >= policy.MaxNotificationsPerHour)
                        return FMSResponse.FailedResponse($"Hourly notification limit ({policy.MaxNotificationsPerHour}) exceeded for policy {policy.Name}");
                }

                // Check daily limit
                if (policy.MaxNotificationsPerDay > 0)
                {
                    var dayAgo = now.AddDays(-1);
                    var dailyCount = await _context.Notifications
                        .CountAsync(n => n.NotificationPolicyId == policy.Id && n.CreatedAt >= dayAgo, cancellationToken);

                    if (dailyCount >= policy.MaxNotificationsPerDay)
                        return FMSResponse.FailedResponse($"Daily notification limit ({policy.MaxNotificationsPerDay}) exceeded for policy {policy.Name}");
                }

                return FMSResponse.SuccessResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking policy limits for policy {PolicyId}", policy.Id);
                return FMSResponse.FailedResponse("Error checking policy limits");
            }
        }

        private string FormatTemplate(string template, object data)
        {
            if (string.IsNullOrEmpty(template) || data == null)
                return template;

            var result = template;
            var properties = data.GetType().GetProperties();

            foreach (var prop in properties)
            {
                var value = prop.GetValue(data)?.ToString() ?? "";
                result = result.Replace($"{{{prop.Name}}}", value);
            }

            return result;
        }

        private string GetDefaultEmailTemplate()
        {
            return @"
                <html>
                <body>
                    <h2>{Title}</h2>
                    <p>{Message}</p>
                    <p><strong>Priority:</strong> {Priority}</p>
                    <p><strong>Category:</strong> {Category}</p>
                    <p><strong>Time:</strong> {CreatedAt}</p>
                </body>
                </html>";
        }

        private string FormatEmailTemplate(string template, Notification notification, NotificationRecipient recipient)
        {
            return FormatTemplate(template, new
            {
                notification.Title,
                notification.Message,
                notification.Priority,
                notification.Category,
                notification.CreatedAt,
                RecipientName = recipient.User?.UserName ?? "User"
            });
        }

        private async Task CreateIssueFromAlarmAsync(AlarmHandler handler, CreateAlarmNotificationRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var issue = new Issuetracker
                {
                    IssueCategoryId = handler.IssueCategory.Value,
                    SiteId = request.SiteId ?? 1, // Default site if not specified
                    Openby = request.TriggeredBy ?? SystemConstants.Defaults.SystemTriggeredBy,
                    ProblemTitle = $"Alarm: {request.AlarmType}",
                    ProblemDescription = request.Message ?? $"Alarm triggered: {request.AlarmType}",
                    Status = 1, // Open
                    Priority = handler.IssuePriority ?? 1,
                    OpenDate = DateTime.UtcNow,
                    VehicleId = request.VehicleId ?? 1, // Default vehicle
                    DeviceId = request.DeviceId,
                    AssignTo = handler.AssignIssueTo ?? request.TriggeredBy ?? SystemConstants.Defaults.SystemTriggeredBy
                };

                _context.Issuetrackers.Add(issue);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created issue tracker entry {IssueId} for alarm {AlarmType}", issue.Id, request.AlarmType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating issue tracker entry for alarm {AlarmType}", request.AlarmType);
            }
        }

        // Implement remaining interface methods...
        public async Task<FMSResponse> MarkAsReadAsync(int notificationId, string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                var recipient = await _context.NotificationRecipients
                    .FirstOrDefaultAsync(r => r.NotificationId == notificationId && r.UserId == userId, cancellationToken);

                if (recipient == null)
                    return FMSResponse.FailedResponse("Notification recipient not found");

                recipient.IsRead = true;
                recipient.ReadAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);
                return FMSResponse.SuccessResponse("Notification marked as read");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return FMSResponse.FailedResponse($"Error marking notification as read: {ex.Message}");
            }
        }

        public async Task<FMSResponse> AcknowledgeNotificationAsync(int notificationId, string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                var recipient = await _context.NotificationRecipients
                    .FirstOrDefaultAsync(r => r.NotificationId == notificationId && r.UserId == userId, cancellationToken);

                if (recipient == null)
                    return FMSResponse.FailedResponse("Notification recipient not found");

                recipient.IsAcknowledged = true;
                recipient.AcknowledgedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);
                return FMSResponse.SuccessResponse("Notification acknowledged");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging notification");
                return FMSResponse.FailedResponse($"Error acknowledging notification: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<NotificationDto>>> GetNotificationsAsync(GetNotificationsRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                var query = _context.Notifications
                    .Include(n => n.Recipients.Where(r => r.UserId == request.UserId))
                    .Include(n => n.Site)
                    .Include(n => n.Tank)
                    .Include(n => n.Device)
                    .Include(n => n.Vehicle)
                    .Where(n => n.Recipients.Any(r => r.UserId == request.UserId));

                if (!string.IsNullOrEmpty(request.Type))
                    query = query.Where(n => n.Type == request.Type);

                if (!string.IsNullOrEmpty(request.Category))
                    query = query.Where(n => n.Category == request.Category);

                if (!string.IsNullOrEmpty(request.Priority))
                    query = query.Where(n => n.Priority == request.Priority);

                if (request.IsRead.HasValue)
                    query = query.Where(n => n.Recipients.Any(r => r.UserId == request.UserId && r.IsRead == request.IsRead.Value));

                if (request.SiteId.HasValue)
                    query = query.Where(n => n.SiteId == request.SiteId.Value);

                if (request.FromDate.HasValue)
                    query = query.Where(n => n.CreatedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(n => n.CreatedAt <= request.ToDate.Value);

                var totalCount = await query.CountAsync(cancellationToken);

                var notifications = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .Skip(request.Skip ?? 0)
                    .Take(request.Take ?? 50)
                    .Select(n => new NotificationDto
                    {
                        Id = n.Id,
                        NotificationId = n.NotificationId,
                        Type = n.Type,
                        Category = n.Category,
                        Priority = n.Priority,
                        Title = n.Title,
                        Message = n.Message,
                        CreatedAt = n.CreatedAt,
                        SentAt = n.SentAt,
                        Status = n.Status,
                        SiteName = n.Site != null ? n.Site.Name : null,
                        TankName = n.Tank != null ? $"Tank {n.Tank.Name}" : null,
                        DeviceName = n.Device != null ? n.Device.DeviceImei.ToString() : null,
                        VehicleName = n.Vehicle != null ? n.Vehicle.HyoungNo : null,
                        IsRead = n.Recipients.First(r => r.UserId == request.UserId).IsRead,
                        IsAcknowledged = n.Recipients.First(r => r.UserId == request.UserId).IsAcknowledged,
                        ReadAt = n.Recipients.First(r => r.UserId == request.UserId).ReadAt,
                        AcknowledgedAt = n.Recipients.First(r => r.UserId == request.UserId).AcknowledgedAt
                    })
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<NotificationDto>>.Success(notifications, $"Retrieved {notifications.Count} of {totalCount} notifications");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications for user {UserId}", request.UserId);
                return FMSResponse<List<NotificationDto>>.Failed($"Error getting notifications: {ex.Message}");
            }
        }

        public async Task<FMSResponse<object>> GetNotificationStatisticsAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
        {
            try
            {
                // Skip policy check for statistics as it's an informational query
                var startDate = fromDate ?? DateTime.UtcNow.AddDays(-30);
                var endDate = toDate ?? DateTime.UtcNow;

                // Total notifications
                var totalNotifications = await _context.Notifications
                    .Where(n => n.CreatedAt >= startDate && n.CreatedAt <= endDate)
                    .CountAsync(cancellationToken);

                // Delivery statistics
                var deliveryStats = await _context.NotificationRecipients
                    .Where(nr => nr.Notification.CreatedAt >= startDate && nr.Notification.CreatedAt <= endDate)
                    .GroupBy(nr => nr.DeliveryStatus)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync(cancellationToken);

                var sentCount = deliveryStats.FirstOrDefault(d => d.Status == "Sent")?.Count ?? 0;
                var pendingCount = deliveryStats.FirstOrDefault(d => d.Status == "Pending")?.Count ?? 0;
                var failedCount = deliveryStats.FirstOrDefault(d => d.Status == "Failed")?.Count ?? 0;

                var deliveryRate = totalNotifications > 0 ? (double)sentCount / totalNotifications * 100 : 0;

                // Delivery methods
                var deliveryMethods = await _context.NotificationRecipients
                    .Where(nr => nr.Notification.CreatedAt >= startDate && nr.Notification.CreatedAt <= endDate)
                    .GroupBy(nr => nr.DeliveryMethod)
                    .Select(g => new { method = g.Key, count = g.Count() })
                    .ToListAsync(cancellationToken);

                // Priority distribution
                var priorities = await _context.Notifications
                    .Where(n => n.CreatedAt >= startDate && n.CreatedAt <= endDate)
                    .GroupBy(n => n.Priority)
                    .Select(g => new { priority = g.Key, count = g.Count() })
                    .ToListAsync(cancellationToken);

                // Daily volume (last 7 days)
                var dailyVolume = await _context.Notifications
                    .Where(n => n.CreatedAt >= DateTime.UtcNow.AddDays(-7))
                    .GroupBy(n => n.CreatedAt.Date)
                    .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), count = g.Count() })
                    .OrderBy(d => d.date)
                    .ToListAsync(cancellationToken);

                var statistics = new
                {
                    totalNotifications,
                    deliveryRate = Math.Round(deliveryRate, 1),
                    pendingCount,
                    failedCount,
                    deliveryMethods,
                    priorities,
                    dailyVolume
                };

                return FMSResponse<object>.Success(statistics, "Statistics retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification statistics");
                return FMSResponse<object>.Failed($"Error getting notification statistics: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<object>>> GetNotificationPoliciesAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var policies = await _context.NotificationPolicies
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Category,
                        p.NotificationType,
                        p.Priority,
                        p.EnableEmail,
                        p.EnableSms,
                        p.EnableSystem,
                        p.MaxNotificationsPerHour,
                        p.MaxNotificationsPerDay,
                        p.CooldownMinutes,
                        p.TitleTemplate,
                        p.MessageTemplate,
                        p.RequireAcknowledgment,
                        p.IsActive,
                        p.CreatedAt,
                        p.ModifiedAt
                    })
                    .ToListAsync(cancellationToken);

                var result = policies.Cast<object>().ToList();
                return FMSResponse<List<object>>.Success(result, "Notification policies retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification policies");
                return FMSResponse<List<object>>.Failed("Error retrieving notification policies");
            }
        }

        public async Task<FMSResponse<int>> CreateNotificationPolicyAsync(CreateNotificationPolicyRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                //Cursor: Validation
                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(request.Name))
                    validationErrors.Add("Policy name is required");

                if (string.IsNullOrWhiteSpace(request.Category))
                    validationErrors.Add("Category is required");

                if (validationErrors.Any())
                {
                    return FMSResponse<int>.ValidationFailed(validationErrors);
                }

                var policy = new NotificationPolicy
                {
                    Name = request.Name,
                    Category = request.Category,
                    NotificationType = request.NotificationType ?? "Alert",
                    Priority = request.Priority ?? "Medium",
                    EnableEmail = request.EnableEmail,
                    EnableSms = request.EnableSms,
                    EnableSystem = request.EnableSystem,
                    MaxNotificationsPerHour = request.MaxNotificationsPerHour ?? 10,
                    MaxNotificationsPerDay = request.MaxNotificationsPerDay ?? 50,
                    CooldownMinutes = request.CooldownMinutes ?? 30,
                    TitleTemplate = request.TitleTemplate,
                    MessageTemplate = request.MessageTemplate,
                    RequireAcknowledgment = request.RequireAcknowledgment,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.NotificationPolicies.Add(policy);
                await _context.SaveChangesAsync(cancellationToken);

                return FMSResponse<int>.Success(policy.Id, "Notification policy created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification policy");
                return FMSResponse<int>.Failed("Error creating notification policy");
            }
        }

        public async Task<FMSResponse<List<object>>> GetAlertRecordsAsync(DateTime? fromDate, DateTime? toDate, int skip, int take, CancellationToken cancellationToken = default)
        {
            try
            {
                var startDate = fromDate ?? DateTime.UtcNow.AddDays(-7);
                var endDate = toDate ?? DateTime.UtcNow;

                var alertRecords = await _context.AlertRecords
                    .Where(ar => ar.DateTime >= startDate && ar.DateTime <= endDate)
                    .OrderByDescending(ar => ar.DateTime)
                    .Skip(skip)
                    .Take(take)
                    .Select(ar => new
                    {
                        ar.Id,
                        ar.PtsId,
                        ar.DeviceType,
                        ar.DeviceNumber,
                        ar.AlertCode,
                        ar.State,
                        ar.DateTime,
                        ar.ProcessedAt,
                        ar.ConfigurationId,
                        ar.AlarmId
                    })
                    .ToListAsync(cancellationToken);

                var result = alertRecords.Cast<object>().ToList();
                return FMSResponse<List<object>>.Success(result, "Alert records retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alert records");
                return FMSResponse<List<object>>.Failed("Error retrieving alert records");
            }
        }

        public async Task<FMSResponse> SendTestNotificationAsync(TestNotificationRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                //Cursor: Get system user ID instead of hardcoded value
                var systemUserResult = await _systemUserService.GetSystemUserIdAsync(cancellationToken);
                if (!systemUserResult.IsSuccess)
                {
                    return FMSResponse.FailedResponse($"Failed to get system user: {systemUserResult.Message}");
                }

                var testUserId = systemUserResult.Data;

                var createRequest = new CreateNotificationRequest
                {
                    Type = "Info",
                    Category = "Test",
                    Priority = "Low",
                    Title = request.Title,
                    Message = request.Message,
                    TriggerSource = "Manual",
                    TriggeredBy = testUserId,
                    Recipients = new List<CreateNotificationRecipientRequest>
                    {
                        new CreateNotificationRecipientRequest
                        {
                            UserId = testUserId,
                            DeliveryMethods = request.DeliveryMethods
                        }
                    }
                };

                var result = await CreateNotificationAsync(createRequest, cancellationToken);

                if (result.IsSuccess)
                {
                    return FMSResponse.SuccessResponse("Test notification sent successfully");
                }

                return FMSResponse.FailedResponse($"Failed to send test notification: {result.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test notification");
                return FMSResponse.FailedResponse("Error sending test notification");
            }
        }
    }

    // Supporting interfaces and classes
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = false, CancellationToken cancellationToken = default);
    }

    public interface ISmsService
    {
        Task<bool> SendSmsAsync(string to, string message, CancellationToken cancellationToken = default);
    }

    //Cursor - Implementation of IEmailService
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;

        public EmailService(ILogger<EmailService> logger)
        {
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = false, CancellationToken cancellationToken = default)
        {
            try
            {
                // TODO: Implement actual email sending logic (SMTP, SendGrid, etc.)
                _logger.LogInformation("Sending email to {To} with subject: {Subject}", to, subject);

                // Simulate email sending
                await Task.Delay(100, cancellationToken);

                _logger.LogInformation("Email sent successfully to {To}", to);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}", to);
                return false;
            }
        }
    }

    //Cursor - Implementation of ISmsService
    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;

        public SmsService(ILogger<SmsService> logger)
        {
            _logger = logger;
        }

        public async Task<bool> SendSmsAsync(string to, string message, CancellationToken cancellationToken = default)
        {
            try
            {
                // TODO: Implement actual SMS sending logic (Twilio, AWS SNS, etc.)
                _logger.LogInformation("Sending SMS to {To} with message: {Message}", to, message);

                // Simulate SMS sending
                await Task.Delay(100, cancellationToken);

                _logger.LogInformation("SMS sent successfully to {To}", to);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SMS to {To}", to);
                return false;
            }
        }
    }

    // DTOs and Request classes
    public class CreateNotificationRequest
    {
        public string? NotificationId { get; set; }
        public string Type { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string? Priority { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public object? Data { get; set; }
        public string TriggerSource { get; set; } = null!;
        public string? TriggeredBy { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public int? SiteId { get; set; }
        public int? DeviceId { get; set; }
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
        public int? IssueTrackerId { get; set; }
        public int? AlarmId { get; set; }
        public int? NotificationPolicyId { get; set; }
        public List<CreateNotificationRecipientRequest> Recipients { get; set; } = new();
    }

    public class CreateNotificationRecipientRequest
    {
        public string UserId { get; set; } = null!;
        public List<string> DeliveryMethods { get; set; } = new();
        public string? PriorityOverride { get; set; }
    }

    public class CreateAlarmNotificationRequest
    {
        public string AlarmType { get; set; } = null!;
        public int? AlarmId { get; set; }
        public string? Category { get; set; }
        public string? Priority { get; set; } = "Medium"; //Cursor: Add Priority property
        public string? Message { get; set; }
        public object? Data { get; set; }
        public string? TriggeredBy { get; set; }
        public int? SiteId { get; set; }
        public int? DeviceId { get; set; }
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
    }

    public class GetNotificationsRequest
    {
        public string UserId { get; set; } = null!;
        public string? Type { get; set; }
        public string? Category { get; set; }
        public string? Priority { get; set; }
        public bool? IsRead { get; set; }
        public int? SiteId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? Skip { get; set; }
        public int? Take { get; set; }
    }

    public class NotificationDto
    {
        public int Id { get; set; }
        public string NotificationId { get; set; } = null!;
        public string Type { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public string Status { get; set; } = null!;
        public string? SiteName { get; set; }
        public string? TankName { get; set; }
        public string? DeviceName { get; set; }
        public string? VehicleName { get; set; }
        public bool IsRead { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
    }

    public class CreateNotificationPolicyRequest
    {
        public string Name { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string? NotificationType { get; set; }
        public string? Priority { get; set; }
        public bool EnableEmail { get; set; } = true;
        public bool EnableSms { get; set; } = false;
        public bool EnableSystem { get; set; } = true;
        public int? MaxNotificationsPerHour { get; set; }
        public int? MaxNotificationsPerDay { get; set; }
        public int? CooldownMinutes { get; set; }
        public string? TitleTemplate { get; set; }
        public string? MessageTemplate { get; set; }
        public bool RequireAcknowledgment { get; set; } = false;
    }

    public class TestNotificationRequest
    {
        public string Title { get; set; } = "Test Notification";
        public string Message { get; set; } = "This is a test notification";
        public List<string> DeliveryMethods { get; set; } = new() { "System" };
    }
}