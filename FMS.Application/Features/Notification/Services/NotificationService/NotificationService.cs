/**
 * File: NotificationService.cs
 * Purpose: Handles notification creation, routing, and delivery across channels.
 * Dependencies: GpsdataContext, ILogger, ISignalRNotificationService, INotificationRecipientResolver
 * Last Modified: 2026-04-16
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
using System.IO;
using FMS.Application.Common.Constants;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.AlertConfiguration;
using FMS.Application.Infrastructure.Communication.SignalR; // Category metadata provider
using AutoMapper;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Services.RecipientResolver;
using FMS.Application.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.Reporting;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using FMS.Domain.Entities.Features.Notifications;
using Noti = FMS.Domain.Entities.Features.Notifications;


namespace FMS.Application.Features.Notification.Services
{
    public partial class NotificationService : INotificationService
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
        private readonly IScheduledReportDeliveryService? _scheduledReportDeliveryService;
        private readonly IFileHandlingService? _fileHandlingService;
        private const int MaxEventFileAttachmentBytes = 7 * 1024 * 1024;

        public NotificationService(
            IMapper mapper,
            GpsdataContext context,
            ILogger<NotificationService> logger,
            ISignalRNotificationService signalRService,
            IEmailService emailService,
            ISmsService smsService,
            ISystemUserService systemUserService,
            INotificationRecipientResolver recipientResolver,
            IFileHandlingService? fileHandlingService = null,
            ICategoryMetadataProvider? categoryMetadata = null,
            INotificationChannelRegistry? channelRegistry = null,
            IPolicyRulesProcessor? policyRulesProcessor = null,
            IScheduledReportDeliveryService? scheduledReportDeliveryService = null)
        {
            _mapper = mapper;
            _context = context;
            _logger = logger;
            _signalRService = signalRService;
            _emailService = emailService;
            _smsService = smsService;
            _systemUserService = systemUserService;
            _recipientResolver = recipientResolver;
            _fileHandlingService = fileHandlingService;
            _categoryMetadata = categoryMetadata ?? new InMemoryCategoryMetadataProvider();
            _channelRegistry = channelRegistry;
            _policyRulesProcessor = policyRulesProcessor ?? new NullPolicyRulesProcessor();
            _scheduledReportDeliveryService = scheduledReportDeliveryService;
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

                if (request.CategoryId <= 0 && string.IsNullOrWhiteSpace(request.CategoryName))
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
                var categoryName = !string.IsNullOrWhiteSpace(request.CategoryName)
                    ? request.CategoryName.Trim()
                    : Enum.IsDefined(typeof(WellKnownCategories), request.CategoryId)
                        ? ((WellKnownCategories)request.CategoryId).ToString()
                        : request.CategoryId.ToString();

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

                var serializedDataToken = request.Data != null
                    ? NotificationDataHelper.ConvertToJToken(request.Data)
                    : null;

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
                    Data = serializedDataToken == null || serializedDataToken.Type == JTokenType.Null
                        ? null
                        : serializedDataToken.ToString(Formatting.None),
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

                // âœ… Dynamic recipient resolution - no hardcoded recipients
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

                if (IsScheduledReportNotification(notification))
                {
                    await TryLogScheduledReportExecutionAsync(notification, successCount, failureCount, cancellationToken);
                }

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
                    .Where(n => n.Status == "Scheduled" && n.ScheduledAt.HasValue && n.ScheduledAt <= now)
                    .Select(n => new
                    {
                        n.Id,
                        n.NotificationId,
                        n.Data
                    })
                    .ToListAsync(cancellationToken);

                var processedCount = 0;
                var errorCount = 0;

                foreach (var notification in scheduledNotifications)
                {
                    try
                    {
                        var isRecurringSchedule = HasRecurringSchedule(notification.Data);
                        var result = await SendNotificationAsync(notification.Id, cancellationToken);

                        if (isRecurringSchedule)
                        {
                            var rescheduled = await TryRescheduleRecurringNotificationAsync(
                                notification.Id,
                                notification.NotificationId,
                                notification.Data,
                                now,
                                result.IsSuccess ? null : result.Message,
                                cancellationToken);

                            if (!rescheduled)
                            {
                                _logger.LogWarning("Recurring schedule for notification {NotificationId} could not be re-armed after processing",
                                    notification.NotificationId);
                            }
                        }

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

                // âœ… UPDATED: Remove hardcoded recipients - use policy-based resolution
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
                    DisableFallbackAllUsers = true // âœ… Use policy-based recipient resolution
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
                        Data = n.Data,
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
    }
}
