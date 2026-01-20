/**
 * File: NotificationService.cs
 * Purpose: Handles notification creation, routing, and delivery across channels.
 * Dependencies: GpsdataContext, ILogger, ISignalRNotificationService, INotificationRecipientResolver
 * Last Modified: 2026-01-19
 *
 * Key Functions:
 * - CreateNotificationAsync(): Creates a notification and dispatches it to recipients.
 * - CreateAlarmNotificationAsync(): Creates notifications from alarm handler events.
 * - CreatePTSAlarmNotificationAsync(): Convenience wrapper for PTS alarms.
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using System;
using FMS.Application.Common.Constants;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Infrastructure.Communication.SignalR; // Category metadata provider
using AutoMapper;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Services.RecipientResolver;
using FMS.Application.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using FMS.Domain.Entities.Features.Notifications;
using Noti = FMS.Domain.Entities.Features.Notifications;


namespace FMS.Application.Features.Notification.Services
{
    public class NotificationService : INotificationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<NotificationService> _logger;
        private readonly ISignalRNotificationService _signalRService;
        private readonly IEmailService _emailService;
        private readonly ISmsService _smsService;
        private readonly ISystemUserService _systemUserService;
        private readonly INotificationRecipientResolver _recipientResolver;
        private readonly ICategoryMetadataProvider _categoryMetadata;
        private readonly INotificationChannelRegistry? _channelRegistry;
        private readonly IMapper _mapper;
        private readonly IPolicyRulesProcessor _policyRulesProcessor;

        public NotificationService(
            IMapper mapper,
            GpsdataContext context,
            ILogger<NotificationService> logger,
            ISignalRNotificationService signalRService,
            IEmailService emailService,
            ISmsService smsService,
            ISystemUserService systemUserService,
            INotificationRecipientResolver recipientResolver,
            ICategoryMetadataProvider? categoryMetadata = null,
            INotificationChannelRegistry? channelRegistry = null,
            IPolicyRulesProcessor? policyRulesProcessor = null)
        {
            _mapper = mapper;
            _context = context;
            _logger = logger;
            _signalRService = signalRService;
            _emailService = emailService;
            _smsService = smsService;
            _systemUserService = systemUserService;
            _recipientResolver = recipientResolver;
            _categoryMetadata = categoryMetadata ?? new InMemoryCategoryMetadataProvider();
            _channelRegistry = channelRegistry;
            _policyRulesProcessor = policyRulesProcessor ?? new NullPolicyRulesProcessor();
        }

        // Simple null implementation that doesn't require a logger
        private class NullPolicyRulesProcessor : IPolicyRulesProcessor
        {
            public bool ShouldTriggerNotification(NotificationPolicy policy, object triggerData)
            {
                // Default behavior: always trigger if no policy processor is provided
                return true;
            }

            public Task<List<string>> ResolveRecipientsFromRules(NotificationPolicy policy, NotificationContext context)
            {
                // No recipient rule processing in null implementation
                return Task.FromResult(new List<string>());
            }

            public List<EscalationLevel> GetEscalationLevels(NotificationPolicy policy)
            {
                // No escalation levels in null implementation
                return new List<EscalationLevel>();
            }
        }

        public async Task<FMSResponse<int>> CreateNotificationAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                //Cursor: Validation (aligned to DTO enums/ids)
                var validationErrors = new List<string>();

                if (request.CategoryId <= 0)
                    validationErrors.Add("Notification categoryId is required");

                if (string.IsNullOrWhiteSpace(request.Title))
                    validationErrors.Add("Notification title is required");

                if (string.IsNullOrWhiteSpace(request.Message))
                    validationErrors.Add("Notification message is required");

                if (string.IsNullOrWhiteSpace(request.TriggerSource))
                    validationErrors.Add("Trigger source is required");

                // Recipients can be resolved dynamically, so no hard requirement here

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

                // Map incoming CategoryId (enum/int) to display name and resolve to existing DB category Id
                var categoryName = Enum.IsDefined(typeof(WellKnownCategories), request.CategoryId) ?
                    ((WellKnownCategories)request.CategoryId).ToString() :
                    request.CategoryId.ToString();

                // Resolve actual FK id in DB by Name to avoid mismatches with enum numeric values
                var resolvedCategoryId = await _context.NotificationCategories
                    .Where(c => c.Name == categoryName)
                    .Select(c => c.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (resolvedCategoryId == 0)
                {
                    // Attempt to auto-create the requested category to avoid hard failures in non-seeded environments
                    resolvedCategoryId = await EnsureCategoryExistsAsync(categoryName, cancellationToken);

                    // If still not resolved, fall back to 'System' category (auto-create if necessary)
                    if (resolvedCategoryId == 0)
                    {
                        var systemName = WellKnownCategories.System.ToString();
                        resolvedCategoryId = await EnsureCategoryExistsAsync(systemName, cancellationToken);
                        if (resolvedCategoryId == 0)
                        {
                            return FMSResponse<int>.Failed($"Notification category '{categoryName}' not found. Please create it from Admin > Notification Settings or run category seeding.");
                        }
                    }
                }

                // Create notification
                Domain.Entities.Features.Notifications.Notification notification = new Domain.Entities.Features.Notifications.Notification
                {
                    NotificationId = request.NotificationId ?? Guid.NewGuid().ToString(),
                    Type = request.Type.ToString(),
                    Category = categoryName,
                    NotificationCategoryId = resolvedCategoryId,
                    Priority = (request.Priority ?? NotificationPriority.Medium).ToString(),
                    Title = request.Title,
                    Message = request.Message,
                    Data = request.Data != null ? JsonConvert.SerializeObject(request.Data) : null,
                    TriggerSource = request.TriggerSource,
                    TriggeredBy = request.TriggeredBy,
                    ScheduledAt = request.ScheduledAt,
                    SiteId = request.SiteId,
                    TankId = request.TankId,
                    VehicleId = request.VehicleId,
                    PtsDeviceId = request.PtsDeviceId,
                    IssueTrackerId = request.IssueTrackerId,
                    ActiveAlarmId = request.AlarmId,
                    NotificationPolicyId = request.NotificationPolicyId,
                    Status = request.ScheduledAt.HasValue ? "Scheduled" : "Pending"
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync(cancellationToken);

                // ✅ Dynamic recipient resolution - no hardcoded recipients
                var resolvedRecipients = await _recipientResolver.ResolveRecipientsAsync(request, cancellationToken);

                if (resolvedRecipients.Any())
                {
                    foreach (var recipientRequest in resolvedRecipients)
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
                }
                else
                {
                    _logger.LogWarning("No recipients resolved for notification {NotificationId} category {Category} (categoryId {CategoryId})",
                        notification.NotificationId, categoryName, request.CategoryId);
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
                    .Include(n => n.NotificationPolicy)
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

                if (processedCount > 0 || errorCount > 0)
                {
                    _logger.LogInformation("Processed {ProcessedCount} scheduled notifications, {ErrorCount} errors", processedCount, errorCount);
                }
                else
                {
                    _logger.LogDebug("Processed {ProcessedCount} scheduled notifications, {ErrorCount} errors", processedCount, errorCount);
                }
                return FMSResponse.SuccessResponse($"Processed {processedCount} scheduled notifications");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing scheduled notifications");
                return FMSResponse.FailedResponse($"Error processing scheduled notifications: {ex.Message}");
            }
        }

        /// <summary>
        /// Create Notification for Alarm table
        /// </summary>
        /// <param name="request"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
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
                        (!h.TankId.HasValue || h.TankId == request.TankId))
                    //(!h.DeviceId.HasValue || h.DeviceId.ToString () == request.PtsDeviceId)) //Cursor: Add PTS device filtering
                    .ToListAsync(cancellationToken);

                var notificationsCreated = 0;

                foreach (var handler in handlers)
                {
                    // ✅ NEW: Use TriggerConditions JSON to check if alarm should be triggered
                    var triggerData = new TankLevelTriggerData
                    {
                        TankId = request.TankId ?? 0,
                        CurrentVolume = 0, // You can extract this from request.Data
                        TankCapacity = 5000, // You can get this from Tank entity
                        VolumeChange = 0 // You can calculate this
                    };

                    var notificationPolicy = handler.NotificationPolicy;
                    if (notificationPolicy != null && !_policyRulesProcessor.ShouldTriggerNotification(notificationPolicy, triggerData))
                    {
                        _logger.LogDebug("Notification suppressed by TriggerConditions for policy {PolicyId}", notificationPolicy.Id);
                        continue;
                    }

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

                    // ✅ UPDATED: Use business function approach for alarm notifications
                    // Recipients will be resolved by NotificationRecipientResolver using TriggerSource

                    var notificationRequest = new CreateNotificationRequest
                    {
                        Type = Notification.Enums.NotificationType.Alert,
                        CategoryId = request.Category != null ? (int)Enum.Parse(typeof(Notification.Enums.WellKnownCategories), request.Category) : (int)Notification.Enums.WellKnownCategories.PtsDeviceAlarm,
                        Priority = Enums.NotificationPriority.Medium,
                        Title = FormatTemplate(handler.MessageTemplate ?? policy.TitleTemplate ?? "Alarm: {AlarmType}", request),
                        Message = FormatTemplate(handler.MessageTemplate ?? policy.MessageTemplate ?? "Alarm triggered: {AlarmType}", request),
                        Data = request.Data,
                        TriggerSource = "Alarm",
                        TriggeredBy = request.TriggeredBy,
                        SiteId = request.SiteId,
                        TankId = request.TankId,
                        VehicleId = request.VehicleId,
                        PtsDeviceId = request.PtsDeviceId, //Cursor: Add PTS device reference
                        AlarmId = request.AlarmId,
                        NotificationPolicyId = policy.Id,
                        DisableFallbackAllUsers = true // ✅ Prevent spam for alarm notifications
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

                if (notificationsCreated > 0)
                {
                    _logger.LogInformation("Created {Count} alarm notifications for {AlarmType}", notificationsCreated, request.AlarmType);
                }
                return FMSResponse.SuccessResponse($"Created {notificationsCreated} alarm notifications");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating alarm notification for {AlarmType}", request.AlarmType);
                return FMSResponse.FailedResponse($"Error creating alarm notification: {ex.Message}");
            }
        }

        // Convenience wrappers for specific device types that delegate to the generic handler
        public Task<FMSResponse> CreatePTSAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default)
        {
            if (request == null) return Task.FromResult(FMSResponse.FailedResponse("Request cannot be null"));
            if (string.IsNullOrEmpty(request.Category))
                request.Category = "PTS";
            return CreateAlarmNotificationAsync(request, cancellationToken);
        }

        public Task<FMSResponse> CreatePumpAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default)
        {
            if (request == null) return Task.FromResult(FMSResponse.FailedResponse("Request cannot be null"));
            if (string.IsNullOrEmpty(request.Category))
                request.Category = "PUMP";
            return CreateAlarmNotificationAsync(request, cancellationToken);
        }

        public Task<FMSResponse> CreateProbeAlarmNotificationAsync(CreateAlarmNotificationRequest request, CancellationToken cancellationToken = default)
        {
            if (request == null) return Task.FromResult(FMSResponse.FailedResponse("Request cannot be null"));
            if (string.IsNullOrEmpty(request.Category))
                request.Category = "PROBE";
            return CreateAlarmNotificationAsync(request, cancellationToken);
        } // Add remaining interface implementations here...
        /// <summary>
        /// Creates a notification for a specific issue tracker
        /// </summary>
        /// <param name="issueTrackerId"></param>
        /// <param name="triggeredBy"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
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
                    .FirstOrDefaultAsync(p => p.IsActive && p.NotificationCategoryId == (int)Notification.Enums.WellKnownCategories.IssueTracker && p.NotificationType == "Alert", cancellationToken);

                if (policy == null)
                {
                    _logger.LogWarning("No notification policy found for issue tracker notifications");
                    return FMSResponse.FailedResponse("No notification policy configured for issue tracker notifications");
                }

                // ✅ UPDATED: Remove hardcoded recipients - use policy-based resolution
                var notificationRequest = new CreateNotificationRequest
                {
                    Type = Notification.Enums.NotificationType.Alert,
                    CategoryId = (int)Notification.Enums.WellKnownCategories.IssueTracker,
                    Priority = Enums.NotificationPriority.Medium,
                    Title = $"New Issue: {issue.ProblemTitle}",
                    Message = $"A new issue has been created: {issue.ProblemDescription}",
                    Data = new { IssueId = issueTrackerId, Category = issue.IssueCategory?.Name },
                    TriggerSource = "IssueTracker",
                    TriggeredBy = triggeredBy,
                    SiteId = issue.SiteId,
                    IssueTrackerId = issueTrackerId,
                    NotificationPolicyId = policy.Id,
                    DisableFallbackAllUsers = true // ✅ Use policy-based recipient resolution
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

        public async Task<FMSResponse<int>> MarkAllAsReadAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                    return FMSResponse<int>.Failed("User ID is required");

                var unreadRecipients = await _context.NotificationRecipients
                    .Where(r => r.UserId == userId && !r.IsRead)
                    .ToListAsync(cancellationToken);

                if (!unreadRecipients.Any())
                    return FMSResponse<int>.Success(0, "No unread notifications found");

                var now = DateTime.UtcNow;
                foreach (var recipient in unreadRecipients)
                {
                    recipient.IsRead = true;
                    recipient.ReadAt = now;
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Marked {Count} notifications as read for user {UserId}", unreadRecipients.Count, userId);
                return FMSResponse<int>.Success(unreadRecipients.Count, $"Marked {unreadRecipients.Count} notifications as read");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
                return FMSResponse<int>.Failed($"Error marking all notifications as read: {ex.Message}");
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
                // Input validation
                if (request == null)
                    return FMSResponse<List<NotificationDto>>.Failed("Request cannot be null");

                if (string.IsNullOrEmpty(request.UserId))
                    return FMSResponse<List<NotificationDto>>.Failed("User ID is required");

                var query = _context.Notifications
                    .Include(n => n.Recipients.Where(r => r.UserId == request.UserId))
                    .Include(n => n.Site)
                    .Include(n => n.Tank)
                    .Include(n => n.Vehicle)
                    .Include(n => n.PtsDevice) //Cursor: Include PTS device information
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
                        VehicleName = n.Vehicle != null ? n.Vehicle.HyoungNo : null,
                        PtsDeviceName = n.PtsDevice != null ? n.PtsDevice.Ptsid : null, //Cursor: Add PTS device name
                        IsRead = n.Recipients.Any(r => r.UserId == request.UserId) && n.Recipients.First(r => r.UserId == request.UserId).IsRead,
                        IsAcknowledged = n.Recipients.Any(r => r.UserId == request.UserId) && n.Recipients.First(r => r.UserId == request.UserId).IsAcknowledged,
                        ReadAt = n.Recipients.Any(r => r.UserId == request.UserId) ? n.Recipients.First(r => r.UserId == request.UserId).ReadAt : null,
                        AcknowledgedAt = n.Recipients.Any(r => r.UserId == request.UserId) ? n.Recipients.First(r => r.UserId == request.UserId).AcknowledgedAt : null
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

        private async Task<bool> SendToRecipientAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                // Try dynamic channel first if available
                if (_channelRegistry != null && _channelRegistry.TryGet(recipient.DeliveryMethod?.ToLower(), out var channel) && channel != null)
                {
                    return await channel.SendAsync(notification, recipient, cancellationToken);
                }

                // Fallback to legacy methods
                switch (recipient.DeliveryMethod?.ToLower())
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
                _logger.LogError(ex, "Error sending notification via {DeliveryMethod} to {UserId}", recipient.DeliveryMethod, recipient.UserId);
                return false;
            }
        }

        private async Task<bool> SendSystemNotificationAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                var notificationPayload = new
                {
                    id = notification.NotificationId,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type.ToLower(),
                    priority = notification.Priority,
                    // Ensure timestamp is in ISO 8601 UTC format with 'Z' suffix
                    timestamp = notification.CreatedAt.ToString("o"),
                    data = notification.Data != null ? JsonConvert.DeserializeObject(notification.Data) : null,
                    // Include target user for frontend filtering when broadcast is used
                    targetUserId = recipient.UserId
                };

                // Try user-targeted notification first
                await _signalRService.SendUserNotificationAsync(
                    recipient.UserId,
                    SystemConstants.Notifications.SystemNotificationType,
                    notification.Message,
                    notificationPayload);

                _logger.LogDebug("Sent targeted system notification {NotificationId} to user {UserId}",
                    notification.NotificationId, recipient.UserId);

                // Also broadcast globally as fallback (frontend will filter by targetUserId)
                // This ensures delivery even if user-targeted routing fails silently
                await _signalRService.SendGlobalNotificationAsync(
                    SystemConstants.Notifications.SystemNotificationType,
                    notification.Message,
                    notificationPayload);

                _logger.LogDebug("Broadcast system notification {NotificationId} globally (target: {UserId})",
                    notification.NotificationId, recipient.UserId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending system notification to {UserId}", recipient.UserId);
                return false;
            }
        }

        private async Task<bool> SendEmailNotificationAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                var policy = notification.NotificationPolicy;
                var emailTemplate = policy?.EmailTemplate ?? GetDefaultEmailTemplate();

                // Use display name for category
                var categoryDisplayName = GetCategoryDisplayName(notification.NotificationCategoryId);

                var emailContent = FormatTemplate(emailTemplate, new
                {
                    notification.Title,
                    notification.Message,
                    notification.Priority,
                    Category = categoryDisplayName,
                    notification.CreatedAt,
                    RecipientName = recipient.User?.UserName ?? "User"
                });

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

        private async Task<bool> SendSmsNotificationAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                var policy = notification.NotificationPolicy;
                var smsTemplate = policy?.SmsTemplate ?? "{Title}: {Message}";

                // Convert category ID back to enum name for display
                var categoryDisplayName = GetCategoryDisplayName(notification.NotificationCategoryId);

                var smsContent = FormatTemplate(smsTemplate, new
                {
                    Title = notification.Title,
                    Message = notification.Message,
                    Priority = notification.Priority,
                    Category = categoryDisplayName
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

        /// <summary>
        /// Returns a human-friendly category name from an int categoryId.
        /// </summary>
        private string GetCategoryDisplayName(int categoryId)
        {
            if (categoryId <= 0) return "Unknown";

            if (Enum.IsDefined(typeof(Notification.Enums.WellKnownCategories), categoryId))
            {
                var enumValue = (Notification.Enums.WellKnownCategories)categoryId;
                try
                {
                    return _categoryMetadata.Get(enumValue).Name;
                }
                catch
                {
                    return enumValue.ToString();
                }
            }

            return categoryId.ToString();
        }

        /// <summary>
        /// Backward-compatible helper that accepts a string and delegates to the int overload when possible.
        /// </summary>
        private string GetCategoryDisplayName(string categoryId)
        {
            if (string.IsNullOrWhiteSpace(categoryId)) return "Unknown";
            return int.TryParse(categoryId, out var id) ?
                GetCategoryDisplayName(id) :
                categoryId;
        }

        private string? GetRecipientAddress(User user, string deliveryMethod)
        {
            return deliveryMethod.ToLower() switch
            {
                "email" => user.Email,
                "sms" => user.PhoneNumber,
                "system" => user.Id,
                _ => user.Id // Pass user id for dynamic channels to resolve mapping internally
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

        /// <summary>
        /// Ensures a notification category exists by name. Creates it with safe defaults if missing.
        /// Returns the category Id or 0 on failure.
        /// </summary>
        private async Task<int> EnsureCategoryExistsAsync(string categoryName, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(categoryName)) return 0;

                var existingId = await _context.NotificationCategories
                    .Where(c => c.Name == categoryName)
                    .Select(c => c.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingId != 0) return existingId;

                // Create with reasonable defaults
                var category = new NotificationCategory
                {
                    Name = categoryName,
                    Description = $"{categoryName} notifications",
                    DefaultPriority = "Medium",
                    IsActive = true,
                    DisplayOrder = 0,
                    DefaultDeliveryMethods = SystemConstants.Notifications.SystemDeliveryMethod,
                    CreatedBy = SystemConstants.Defaults.SystemTriggeredBy,
                    CreatedAt = DateTime.UtcNow
                };

                _context.NotificationCategories.Add(category);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogWarning("Auto-created missing notification category '{CategoryName}' (Id {CategoryId})", categoryName, category.Id);
                return category.Id;
            }
            catch (DbUpdateException)
            {
                // Handle race condition where another thread created it
                var id = await _context.NotificationCategories
                    .Where(c => c.Name == categoryName)
                    .Select(c => c.Id)
                    .FirstOrDefaultAsync(cancellationToken);
                return id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to ensure notification category '{CategoryName}' exists", categoryName);
                return 0;
            }
        }

        private async Task CreateIssueFromAlarmAsync(AlarmHandler handler, CreateAlarmNotificationRequest request, CancellationToken cancellationToken)
        {
            try
            {
                if (!handler.IssueCategory.HasValue)
                {
                    _logger.LogWarning("IssueCategory not set on handler {HandlerId}; skipping issue creation", handler.Id);
                    return;
                }
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
        public async Task<FMSResponse<NotificationStatisticsDto>> GetNotificationStatisticsAsync(GetNotificationStatisticsRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                // Input validation
                if (request == null)
                    return FMSResponse<NotificationStatisticsDto>.Failed("Request cannot be null");

                if (string.IsNullOrEmpty(request.UserId))
                    return FMSResponse<NotificationStatisticsDto>.Failed("User ID is required");
                var fromDate = request.FromDate ?? DateTime.UtcNow.AddDays(-30);
                var toDate = request.ToDate ?? DateTime.UtcNow;

                if (fromDate > toDate)
                    return FMSResponse<NotificationStatisticsDto>.Failed("From date cannot be greater than to date");

                var userNotificationsQuery = _context.Notifications
                    .Include(n => n.Recipients)
                    .Where(n => n.Recipients.Any(r => r.UserId == request.UserId))
                    .Where(n => n.CreatedAt >= fromDate && n.CreatedAt <= toDate);

                // Get total counts
                var totalNotifications = await userNotificationsQuery.CountAsync(cancellationToken);
                var unreadNotifications = await userNotificationsQuery
                    .Where(n => n.Recipients.Any(r => r.UserId == request.UserId && !r.IsRead))
                    .CountAsync(cancellationToken);
                var readNotifications = totalNotifications - unreadNotifications;

                // Get count by priority
                var priorityCounts = await userNotificationsQuery
                    .GroupBy(n => n.Priority)
                    .Select(g => new { Priority = g.Key, Count = g.Count() })
                    .ToListAsync(cancellationToken);

                // Get count by category
                var categoryCounts = await userNotificationsQuery
                    .GroupBy(n => n.Category)
                    .Select(g => new { Category = g.Key, Count = g.Count() })
                    .ToListAsync(cancellationToken);

                // Get count by type
                var typeCounts = await userNotificationsQuery
                    .GroupBy(n => n.Type)
                    .Select(g => new { Type = g.Key, Count = g.Count() })
                    .ToListAsync(cancellationToken);

                // Get daily statistics - Simplified query to avoid EF Core translation issues
                // First, get the raw data with notification IDs and dates
                var notificationsForStats = await _context.Notifications
                    .Where(n => n.Recipients.Any(r => r.UserId == request.UserId))
                    .Where(n => n.CreatedAt >= fromDate && n.CreatedAt <= toDate)
                    .Select(n => new
                    {
                        n.Id,
                        n.CreatedAt,
                        IsRead = n.Recipients.Where(r => r.UserId == request.UserId).Select(r => r.IsRead).FirstOrDefault()
                    })
                    .ToListAsync(cancellationToken);

                // Compute daily stats on the client side
                var dailyStats = notificationsForStats
                    .GroupBy(n => n.CreatedAt.Date)
                    .Select(g => new DailyNotificationStatDto
                    {
                        Date = g.Key,
                        DateString = g.Key.ToString("yyyy-MM-dd"),
                        Count = g.Count(),
                        ReadCount = g.Count(n => n.IsRead),
                        UnreadCount = g.Count(n => !n.IsRead)
                    })
                    .OrderBy(d => d.Date)
                    .ToList();

                // Get recent notifications
                var recentNotifications = await userNotificationsQuery
                    .Include(n => n.Site)
                    .Include(n => n.Tank)
                    .Include(n => n.Vehicle)
                    .Include(n => n.PtsDevice) //Cursor: Include PTS device information
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(request.RecentCount ?? 10)
                    .Select(n => new RecentNotificationDto
                    {
                        Id = n.Id,
                        NotificationId = n.NotificationId,
                        Type = n.Type,
                        Category = n.Category,
                        Priority = n.Priority,
                        Title = n.Title,
                        Message = n.Message,
                        CreatedAt = n.CreatedAt,
                        Status = n.Status,
                        SiteName = n.Site != null ? n.Site.Name : null,
                        TankName = n.Tank != null ? $"Tank {n.Tank.Name}" : null,
                        VehicleName = n.Vehicle != null ? n.Vehicle.HyoungNo : null,
                        PtsDeviceName = n.PtsDevice != null ? n.PtsDevice.Ptsid : null, //Cursor: Add PTS device name
                        IsRead = n.Recipients.Any(r => r.UserId == request.UserId) &&
                            n.Recipients.First(r => r.UserId == request.UserId).IsRead
                    })
                    .ToListAsync(cancellationToken);

                var statistics = new NotificationStatisticsDto
                {
                    TotalNotifications = totalNotifications,
                    ReadNotifications = readNotifications,
                    UnreadNotifications = unreadNotifications,
                    PriorityBreakdown = priorityCounts.ToDictionary(p => p.Priority, p => p.Count),
                    CategoryBreakdown = categoryCounts.ToDictionary(c => c.Category, c => c.Count),
                    TypeBreakdown = typeCounts.ToDictionary(t => t.Type, t => t.Count),
                    DailyStatistics = dailyStats,
                    RecentNotifications = recentNotifications,
                    FromDate = fromDate,
                    ToDate = toDate,
                    GeneratedAt = DateTime.UtcNow
                };

                return FMSResponse<NotificationStatisticsDto>.Success(statistics,
                    $"Retrieved notification statistics successfully. Total: {totalNotifications}, Unread: {unreadNotifications}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification statistics for user {UserId}: {Message}",
                    request.UserId, ex.Message);

                return FMSResponse<NotificationStatisticsDto>.Failed($"Error getting notification statistics: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<NotificationPolicyDto>>> GetNotificationPoliciesAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var policies = await _context.NotificationPolicies
                    .Include(p => p.NotificationCategory)
                    .Include(p => p.PolicyRecipients)
                    .Include(p => p.PolicyGroups)
                    .Include(p => p.CreatedByNavigation)
                    .Include(p => p.ModifiedByNavigation)
                    .AsNoTracking()
                    .ToListAsync(cancellationToken);

                var dtoList = _mapper.Map<List<NotificationPolicyDto>>(policies);
                return FMSResponse<List<NotificationPolicyDto>>.Success(dtoList, "Notification policies retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification policies");
                return FMSResponse<List<NotificationPolicyDto>>.Failed("Error retrieving notification policies");
            }
        }

        public async Task<FMSResponse<NotificationPolicyDto>> GetNotificationPolicyAsync(int policyId, CancellationToken cancellationToken = default)
        {
            try
            {
                var policy = await _context.NotificationPolicies
                    .Include(p => p.NotificationCategory)
                    .Include(p => p.PolicyRecipients)
                    .Include(p => p.PolicyGroups)
                    .Include(p => p.CreatedByNavigation)
                    .Include(p => p.ModifiedByNavigation)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == policyId, cancellationToken);

                if (policy == null)
                {
                    return FMSResponse<NotificationPolicyDto>.Failed($"Policy {policyId} not found");
                }

                var dto = _mapper.Map<NotificationPolicyDto>(policy);
                return FMSResponse<NotificationPolicyDto>.Success(dto, "Notification policy retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification policy {PolicyId}", policyId);
                return FMSResponse<NotificationPolicyDto>.Failed("Error retrieving notification policy");
            }
        }

        public async Task<FMSResponse<int>> CreateNotificationPolicyAsync(CreateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default)
        {
            try
            {
                //Cursor: Validation
                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(request.Name))
                    validationErrors.Add("Policy name is required");

                if (request.NotificationCategoryId <= 0)
                    validationErrors.Add("Category is required");

                if (validationErrors.Any())
                {
                    return FMSResponse<int>.ValidationFailed(validationErrors);
                }

                var policy = new NotificationPolicy
                {
                    Name = request.Name,
                    NotificationCategoryId = request.NotificationCategoryId,
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
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = request.CreatedBy
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
            // Implementation would go here - truncated for space
            try
            {
                var startDate = fromDate ?? DateTime.UtcNow.AddDays(-7);
                var endDate = toDate ?? DateTime.UtcNow;

                var alertRecords = await _context.PTSAlertRecords
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
            // Implementation would go here - truncated for space
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
                    Type = Enums.NotificationType.Info,
                    CategoryId = (int)Enums.WellKnownCategories.System,
                    Priority = (int)Enums.NotificationPriority.Low,
                    Title = request.Title,
                    Message = request.Message,
                    TriggerSource = "TestNotification",
                    TriggeredBy = testUserId,
                    DisableFallbackAllUsers = true // ✅ Test notifications should be targeted, not broadcast
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
}