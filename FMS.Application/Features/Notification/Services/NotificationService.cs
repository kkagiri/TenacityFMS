/**
 * File: NotificationService.cs
 * Purpose: Handles notification creation, routing, and delivery across channels.
 * Dependencies: GpsdataContext, ILogger, ISignalRNotificationService, INotificationRecipientResolver
 * Last Modified: 2026-02-07
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
using FMS.Application.Features.Notification.Services.AlertConfiguration;
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
using Newtonsoft.Json.Linq;
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
        private readonly IScheduledReportDeliveryService? _scheduledReportDeliveryService;

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

        private bool HasRecurringSchedule(string? dataJson)
        {
            if (string.IsNullOrWhiteSpace(dataJson))
                return false;

            try
            {
                var root = JObject.Parse(dataJson);
                var recurringSchedule = root["recurringSchedule"] as JObject;
                return recurringSchedule?.Value<bool?>("enabled") == true;
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> TryRescheduleRecurringNotificationAsync(
            int notificationId,
            string notificationPublicId,
            string? dataJson,
            DateTime referenceUtc,
            string? lastDeliveryError,
            CancellationToken cancellationToken)
        {
            if (!TryResolveNextRecurringRunUtc(dataJson, referenceUtc, out var nextRunUtc, out var parseError))
            {
                _logger.LogWarning(
                    "Recurring schedule parse failed for notification {NotificationId}: {ParseError}",
                    notificationPublicId,
                    parseError ?? "Unknown parse error");
                return false;
            }

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId, cancellationToken);

            if (notification == null)
            {
                _logger.LogWarning("Cannot re-arm recurring notification {NotificationId}; record not found", notificationPublicId);
                return false;
            }

            notification.Status = "Scheduled";
            notification.ScheduledAt = nextRunUtc;
            notification.ErrorMessage = string.IsNullOrWhiteSpace(lastDeliveryError) ? null : lastDeliveryError;
            notification.Data = UpdateRecurringScheduleData(dataJson, nextRunUtc, referenceUtc);

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Recurring notification {NotificationId} re-armed for next run at {NextRunUtc}",
                notificationPublicId,
                nextRunUtc);

            return true;
        }

        private bool TryResolveNextRecurringRunUtc(
            string? dataJson,
            DateTime referenceUtc,
            out DateTime nextRunUtc,
            out string? parseError)
        {
            nextRunUtc = default;
            parseError = null;

            if (!TryParseRecurringScheduleData(
                    dataJson,
                    out var scheduleType,
                    out var dayOfWeeks,
                    out var weekOfMonthOrdinals,
                    out var timeOfDay,
                    out var timeZoneId,
                    out parseError))
            {
                return false;
            }

            if (string.Equals(scheduleType, "monthly", StringComparison.OrdinalIgnoreCase))
            {
                var monthlyRunUtc = ComputeNextMonthlyRunUtc(
                    dayOfWeeks,
                    weekOfMonthOrdinals,
                    timeOfDay,
                    timeZoneId,
                    referenceUtc);

                if (!monthlyRunUtc.HasValue)
                {
                    parseError = "Could not compute next monthly run date for schedule";
                    return false;
                }

                nextRunUtc = monthlyRunUtc.Value;
                return true;
            }

            nextRunUtc = ComputeNextWeeklyRunUtc(
                dayOfWeeks,
                timeOfDay,
                timeZoneId,
                referenceUtc);

            return true;
        }

        private bool TryParseRecurringScheduleData(
            string? dataJson,
            out string scheduleType,
            out IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            out IReadOnlyCollection<int> weekOfMonthOrdinals,
            out TimeSpan timeOfDay,
            out string? timeZoneId,
            out string? parseError)
        {
            scheduleType = "weekly";
            dayOfWeeks = new List<DayOfWeek> { DayOfWeek.Monday };
            weekOfMonthOrdinals = new List<int> { 1 };
            timeOfDay = TimeSpan.FromHours(8);
            timeZoneId = "UTC";
            parseError = null;

            if (string.IsNullOrWhiteSpace(dataJson))
            {
                parseError = "Notification data payload is empty";
                return false;
            }

            try
            {
                var root = JObject.Parse(dataJson);
                var recurringSchedule = root["recurringSchedule"] as JObject;

                if (recurringSchedule == null || recurringSchedule.Value<bool?>("enabled") != true)
                {
                    parseError = "Recurring schedule is missing or disabled";
                    return false;
                }

                var scheduleTypeValue = recurringSchedule.Value<string>("scheduleType");
                if (!string.IsNullOrWhiteSpace(scheduleTypeValue))
                {
                    scheduleType = scheduleTypeValue.Trim().ToLowerInvariant();
                }

                if (!TryParseDayOfWeekValues(recurringSchedule, out dayOfWeeks, out parseError))
                {
                    return false;
                }

                var timeValue = recurringSchedule.Value<string>("timeOfDay");
                if (!TryParseTimeOfDayValue(timeValue, out timeOfDay))
                {
                    parseError = $"Invalid recurring timeOfDay value '{timeValue}'";
                    return false;
                }

                timeZoneId = recurringSchedule.Value<string>("timeZone");

                if (string.Equals(scheduleType, "monthly", StringComparison.OrdinalIgnoreCase))
                {
                    if (!TryParseWeekOfMonthValues(recurringSchedule, out weekOfMonthOrdinals, out parseError))
                    {
                        return false;
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                parseError = $"Recurring schedule JSON parsing failed: {ex.Message}";
                return false;
            }
        }

        private bool TryParseDayOfWeekValues(
            JObject recurringSchedule,
            out IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            out string? parseError)
        {
            var parsedDays = new List<DayOfWeek>();
            parseError = null;

            if (recurringSchedule["daysOfWeek"] is JArray dayArray && dayArray.Count > 0)
            {
                foreach (var dayToken in dayArray)
                {
                    var rawDayValue = dayToken?.ToString();
                    if (!TryParseDayOfWeekValue(rawDayValue, out var parsedDay))
                    {
                        parseError = $"Invalid recurring daysOfWeek value '{rawDayValue}'";
                        dayOfWeeks = Array.Empty<DayOfWeek>();
                        return false;
                    }

                    parsedDays.Add(parsedDay);
                }
            }
            else
            {
                var dayValue = recurringSchedule.Value<string>("dayOfWeek");
                if (!TryParseDayOfWeekValue(dayValue, out var parsedDay))
                {
                    parseError = $"Invalid recurring dayOfWeek value '{dayValue}'";
                    dayOfWeeks = Array.Empty<DayOfWeek>();
                    return false;
                }

                parsedDays.Add(parsedDay);
            }

            dayOfWeeks = parsedDays
                .Distinct()
                .ToList();

            if (!dayOfWeeks.Any())
            {
                parseError = "Recurring schedule requires at least one day of week";
                return false;
            }

            return true;
        }

        private bool TryParseWeekOfMonthValues(
            JObject recurringSchedule,
            out IReadOnlyCollection<int> weekOfMonthOrdinals,
            out string? parseError)
        {
            var parsedWeeks = new List<int>();
            parseError = null;

            if (recurringSchedule["weeksOfMonth"] is JArray weekArray && weekArray.Count > 0)
            {
                foreach (var weekToken in weekArray)
                {
                    var rawWeekValue = weekToken?.ToString();
                    var parsedWeek = ParseWeekOfMonthOrdinal(rawWeekValue);
                    if (!parsedWeek.HasValue)
                    {
                        parseError = $"Invalid recurring weeksOfMonth value '{rawWeekValue}'";
                        weekOfMonthOrdinals = Array.Empty<int>();
                        return false;
                    }

                    parsedWeeks.Add(parsedWeek.Value);
                }
            }
            else
            {
                var weekValue = recurringSchedule.Value<string>("weekOfMonth");
                var parsedWeek = ParseWeekOfMonthOrdinal(weekValue);
                if (!parsedWeek.HasValue)
                {
                    parseError = $"Invalid recurring weekOfMonth value '{weekValue}'";
                    weekOfMonthOrdinals = Array.Empty<int>();
                    return false;
                }

                parsedWeeks.Add(parsedWeek.Value);
            }

            weekOfMonthOrdinals = parsedWeeks
                .Distinct()
                .ToList();

            if (!weekOfMonthOrdinals.Any())
            {
                parseError = "Recurring schedule requires at least one week of month selector";
                return false;
            }

            return true;
        }

        private bool TryParseDayOfWeekValue(string? rawValue, out DayOfWeek dayOfWeek)
        {
            dayOfWeek = DayOfWeek.Monday;
            if (string.IsNullOrWhiteSpace(rawValue))
                return false;

            if (int.TryParse(rawValue.Trim(), out var numericValue) &&
                numericValue >= 0 &&
                numericValue <= 6)
            {
                return SetDayOfWeek((DayOfWeek)numericValue, out dayOfWeek);
            }

            return rawValue.Trim().ToLowerInvariant() switch
            {
                "monday" or "mon" => SetDayOfWeek(DayOfWeek.Monday, out dayOfWeek),
                "tuesday" or "tue" or "tues" => SetDayOfWeek(DayOfWeek.Tuesday, out dayOfWeek),
                "wednesday" or "wed" => SetDayOfWeek(DayOfWeek.Wednesday, out dayOfWeek),
                "thursday" or "thu" or "thurs" => SetDayOfWeek(DayOfWeek.Thursday, out dayOfWeek),
                "friday" or "fri" => SetDayOfWeek(DayOfWeek.Friday, out dayOfWeek),
                "saturday" or "sat" => SetDayOfWeek(DayOfWeek.Saturday, out dayOfWeek),
                "sunday" or "sun" => SetDayOfWeek(DayOfWeek.Sunday, out dayOfWeek),
                _ => false
            };
        }

        private static bool SetDayOfWeek(DayOfWeek value, out DayOfWeek dayOfWeek)
        {
            dayOfWeek = value;
            return true;
        }

        private int? ParseWeekOfMonthOrdinal(string? rawValue)
        {
            if (string.IsNullOrWhiteSpace(rawValue))
                return null;

            return rawValue.Trim().ToLowerInvariant() switch
            {
                "first" or "1st" or "1" => 1,
                "second" or "2nd" or "2" => 2,
                "third" or "3rd" or "3" => 3,
                "fourth" or "4th" or "4" => 4,
                "last" => -1,
                _ => null
            };
        }

        private bool TryParseTimeOfDayValue(string? rawValue, out TimeSpan timeOfDay)
        {
            timeOfDay = default;
            if (string.IsNullOrWhiteSpace(rawValue))
                return false;

            if (TimeSpan.TryParse(rawValue, out timeOfDay))
            {
                return timeOfDay >= TimeSpan.Zero && timeOfDay < TimeSpan.FromDays(1);
            }

            var parts = rawValue.Split(':', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2)
                return false;

            if (!int.TryParse(parts[0], out var hours) || !int.TryParse(parts[1], out var minutes))
                return false;

            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59)
                return false;

            timeOfDay = new TimeSpan(hours, minutes, 0);
            return true;
        }

        private TimeZoneInfo ResolveTimeZoneInfo(string? timeZoneId)
        {
            if (string.IsNullOrWhiteSpace(timeZoneId))
                return TimeZoneInfo.Utc;

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
                _logger.LogWarning("Time zone '{TimeZoneId}' not found. Falling back to UTC.", timeZoneId);
                return TimeZoneInfo.Utc;
            }
            catch (InvalidTimeZoneException)
            {
                _logger.LogWarning("Time zone '{TimeZoneId}' is invalid. Falling back to UTC.", timeZoneId);
                return TimeZoneInfo.Utc;
            }
        }

        private DateTime ComputeNextWeeklyRunUtc(
            DayOfWeek dayOfWeek,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var timezone = ResolveTimeZoneInfo(timeZoneId);
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(referenceUtc, timezone);

            var candidateLocal = localNow.Date.Add(timeOfDay);
            var daysUntilTarget = ((int)dayOfWeek - (int)candidateLocal.DayOfWeek + 7) % 7;
            candidateLocal = candidateLocal.AddDays(daysUntilTarget);

            if (candidateLocal <= localNow)
            {
                candidateLocal = candidateLocal.AddDays(7);
            }

            return TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(candidateLocal, DateTimeKind.Unspecified),
                timezone);
        }

        private DateTime ComputeNextWeeklyRunUtc(
            IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var candidates = dayOfWeeks
                .Distinct()
                .Select(dayOfWeek => ComputeNextWeeklyRunUtc(dayOfWeek, timeOfDay, timeZoneId, referenceUtc))
                .OrderBy(candidate => candidate)
                .ToList();

            return candidates.Any()
                ? candidates[0]
                : ComputeNextWeeklyRunUtc(DayOfWeek.Monday, timeOfDay, timeZoneId, referenceUtc);
        }

        private DateTime? ComputeNextMonthlyRunUtc(
            DayOfWeek dayOfWeek,
            int weekOfMonthOrdinal,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var timezone = ResolveTimeZoneInfo(timeZoneId);
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(referenceUtc, timezone);

            var candidateDate = GetNthWeekdayOfMonth(localNow.Year, localNow.Month, dayOfWeek, weekOfMonthOrdinal);
            if (!candidateDate.HasValue) return null;

            var candidateLocal = candidateDate.Value.Date.Add(timeOfDay);
            if (candidateLocal <= localNow)
            {
                var nextMonth = new DateTime(localNow.Year, localNow.Month, 1).AddMonths(1);
                candidateDate = GetNthWeekdayOfMonth(nextMonth.Year, nextMonth.Month, dayOfWeek, weekOfMonthOrdinal);
                if (!candidateDate.HasValue) return null;
                candidateLocal = candidateDate.Value.Date.Add(timeOfDay);
            }

            return TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(candidateLocal, DateTimeKind.Unspecified),
                timezone);
        }

        private DateTime? ComputeNextMonthlyRunUtc(
            IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            IReadOnlyCollection<int> weekOfMonthOrdinals,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var safeWeekOrdinals = (weekOfMonthOrdinals ?? Array.Empty<int>())
                .Where(value => value == -1 || (value >= 1 && value <= 4))
                .Distinct()
                .ToList();
            if (!safeWeekOrdinals.Any())
            {
                safeWeekOrdinals.Add(1);
            }

            var candidates = safeWeekOrdinals
                .SelectMany(weekOfMonthOrdinal =>
                    dayOfWeeks
                        .Distinct()
                        .Select(dayOfWeek => ComputeNextMonthlyRunUtc(
                            dayOfWeek,
                            weekOfMonthOrdinal,
                            timeOfDay,
                            timeZoneId,
                            referenceUtc)))
                .Where(candidate => candidate.HasValue)
                .Select(candidate => candidate.Value)
                .OrderBy(candidate => candidate)
                .ToList();

            return candidates.Any() ? candidates[0] : null;
        }

        private DateTime? ComputeNextMonthlyRunUtc(
            IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            int weekOfMonthOrdinal,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var candidates = dayOfWeeks
                .Distinct()
                .Select(dayOfWeek => ComputeNextMonthlyRunUtc(
                    dayOfWeek,
                    weekOfMonthOrdinal,
                    timeOfDay,
                    timeZoneId,
                    referenceUtc))
                .Where(candidate => candidate.HasValue)
                .Select(candidate => candidate.Value)
                .OrderBy(candidate => candidate)
                .ToList();

            return candidates.Any() ? candidates[0] : null;
        }

        private DateTime? GetNthWeekdayOfMonth(int year, int month, DayOfWeek dayOfWeek, int weekOfMonthOrdinal)
        {
            if (weekOfMonthOrdinal == -1)
            {
                var lastDay = new DateTime(year, month, DateTime.DaysInMonth(year, month));
                while (lastDay.DayOfWeek != dayOfWeek)
                {
                    lastDay = lastDay.AddDays(-1);
                }

                return lastDay;
            }

            if (weekOfMonthOrdinal < 1 || weekOfMonthOrdinal > 4)
                return null;

            var firstDay = new DateTime(year, month, 1);
            var offset = ((int)dayOfWeek - (int)firstDay.DayOfWeek + 7) % 7;
            var candidate = firstDay.AddDays(offset + (weekOfMonthOrdinal - 1) * 7);

            if (candidate.Month != month)
                return null;

            return candidate;
        }

        private string? UpdateRecurringScheduleData(string? dataJson, DateTime nextRunUtc, DateTime processedAtUtc)
        {
            if (string.IsNullOrWhiteSpace(dataJson))
                return dataJson;

            try
            {
                var root = JObject.Parse(dataJson);
                if (root["recurringSchedule"] is not JObject recurringSchedule)
                    return dataJson;

                recurringSchedule["nextRunAtUtc"] = nextRunUtc.ToString("o");
                recurringSchedule["lastProcessedAtUtc"] = processedAtUtc.ToString("o");
                root["recurringSchedule"] = recurringSchedule;
                return root.ToString(Formatting.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update recurring schedule metadata in notification data payload");
                return dataJson;
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
                // Strip HTML tags — MessageTemplate may contain rich HTML designed for email;
                // system (SignalR) and push must receive clean plain text.
                var plainMessage = StripHtml(notification.Message);

                var notificationPayload = new
                {
                    id = notification.NotificationId,
                    title = notification.Title,
                    message = plainMessage,
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
                    plainMessage,
                    notificationPayload);

                _logger.LogDebug("Sent targeted system notification {NotificationId} to user {UserId}",
                    notification.NotificationId, recipient.UserId);

                // Also broadcast globally as fallback (frontend will filter by targetUserId)
                // This ensures delivery even if user-targeted routing fails silently
                await _signalRService.SendGlobalNotificationAsync(
                    SystemConstants.Notifications.SystemNotificationType,
                    plainMessage,
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
                if (IsScheduledReportNotification(notification) && _scheduledReportDeliveryService != null)
                {
                    var scheduledPayload = await _scheduledReportDeliveryService
                        .BuildEmailPayloadAsync(notification, cancellationToken);

                    if (scheduledPayload != null)
                    {
                        return await _emailService.SendEmailAsync(
                            recipient.RecipientAddress,
                            string.IsNullOrWhiteSpace(scheduledPayload.Subject) ? notification.Title : scheduledPayload.Subject,
                            scheduledPayload.Body,
                            isHtml: scheduledPayload.IsHtml,
                            cancellationToken: cancellationToken,
                            attachments: scheduledPayload.Attachments);
                    }
                }

                // Try to build event report PDF attachment (e.g., TankVolumeHistory for stock discrepancy events)
                var eventAttachments = await TryBuildEventReportAttachmentAsync(notification, cancellationToken);

                var customEmailBody = TryGetCustomEmailBodyFromData(notification.Data);
                if (!string.IsNullOrWhiteSpace(customEmailBody))
                {
                    return await _emailService.SendEmailAsync(
                        recipient.RecipientAddress,
                        notification.Title,
                        customEmailBody,
                        isHtml: true,
                        cancellationToken: cancellationToken,
                        attachments: eventAttachments);
                }

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
                    cancellationToken: cancellationToken,
                    attachments: eventAttachments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email notification to {Email}", recipient.RecipientAddress);
                return false;
            }
        }

        /// <summary>
        /// Checks the notification Data JSON for a reportAttachment metadata block
        /// and generates the PDF attachment via ScheduledReportDeliveryService.
        /// Returns an empty list when no report is requested or the service is unavailable.
        /// </summary>
        private async Task<List<EmailAttachmentDto>> TryBuildEventReportAttachmentAsync(
            Noti.Notification notification, CancellationToken cancellationToken)
        {
            if (_scheduledReportDeliveryService == null || string.IsNullOrWhiteSpace(notification.Data))
            {
                return new List<EmailAttachmentDto>();
            }

            try
            {
                var dataObject = JObject.Parse(notification.Data);
                var reportAttachment = dataObject["reportAttachment"];
                if (reportAttachment == null || reportAttachment.Type == JTokenType.Null)
                {
                    return new List<EmailAttachmentDto>();
                }

                var reportType = reportAttachment.Value<string>("reportType");
                var templateName = reportAttachment.Value<string>("templateName");
                if (string.IsNullOrWhiteSpace(reportType) || string.IsNullOrWhiteSpace(templateName))
                {
                    return new List<EmailAttachmentDto>();
                }

                var tankId = reportAttachment.Value<int?>("tankId");
                var siteId = reportAttachment.Value<int?>("siteId");
                var startDateStr = reportAttachment.Value<string>("startDate");
                var endDateStr = reportAttachment.Value<string>("endDate");
                var fileNamePrefix = reportAttachment.Value<string>("fileNamePrefix") ?? "Report";

                if (!DateTime.TryParse(startDateStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out var startDate) ||
                    !DateTime.TryParse(endDateStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out var endDate))
                {
                    _logger.LogWarning("Invalid date range in reportAttachment metadata for notification {NotificationId}",
                        notification.NotificationId);
                    return new List<EmailAttachmentDto>();
                }

                _logger.LogInformation(
                    "Generating event report attachment [{ReportType}] for notification {NotificationId}, Tank={TankId}, Site={SiteId}, Range={Start}-{End}",
                    reportType, notification.NotificationId, tankId, siteId, startDate, endDate);

                var attachments = await _scheduledReportDeliveryService.BuildReportAttachmentAsync(
                    reportType, templateName, tankId, siteId, startDate, endDate, fileNamePrefix, cancellationToken);

                _logger.LogInformation(
                    "Generated {Count} report attachment(s) for notification {NotificationId}",
                    attachments.Count, notification.NotificationId);

                return attachments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to build event report attachment for notification {NotificationId}. Email will be sent without attachment.",
                    notification.NotificationId);
                return new List<EmailAttachmentDto>();
            }
        }

        /// <summary>
        /// Strips HTML tags and collapses whitespace to produce clean plain text.
        /// Used for system (SignalR) and push channels where the MessageTemplate
        /// may contain rich HTML intended for email rendering.
        /// </summary>
        private static string StripHtml(string? html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;
            // Remove all HTML tags
            var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
            // Decode common HTML entities
            text = text.Replace("&amp;", "&")
                       .Replace("&lt;", "<")
                       .Replace("&gt;", ">")
                       .Replace("&nbsp;", " ")
                       .Replace("&quot;", "\"");
            // Collapse multiple whitespace / newlines into a single space
            text = System.Text.RegularExpressions.Regex.Replace(text, @"\s{2,}", " ");
            return text.Trim();
        }

        private string? TryGetCustomEmailBodyFromData(string? dataJson)
        {
            if (string.IsNullOrWhiteSpace(dataJson))
            {
                return null;
            }

            try
            {
                var dataObject = JObject.Parse(dataJson);
                var customEmailBody = dataObject.Value<string>("EmailBodyHtml")
                    ?? dataObject.Value<string>("emailBodyHtml");

                return string.IsNullOrWhiteSpace(customEmailBody) ? null : customEmailBody;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not parse notification Data for custom email body");
                return null;
            }
        }

        private static bool IsScheduledReportNotification(Noti.Notification notification)
        {
            if (notification == null)
            {
                return false;
            }

            if (!string.IsNullOrWhiteSpace(notification.TriggerSource) &&
                notification.TriggerSource.Contains("ReportSchedule", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (string.IsNullOrWhiteSpace(notification.Data))
            {
                return false;
            }

            try
            {
                var dataObject = JObject.Parse(notification.Data);
                var reportType = dataObject.Value<string>("reportType");
                return !string.IsNullOrWhiteSpace(reportType);
            }
            catch
            {
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
                <!DOCTYPE html>
                <html lang=""en"">
                <head>
                    <meta charset=""UTF-8"" />
                    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
                    <title>{Title}</title>
                </head>
                <body style=""margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#111827;"">
                    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background:#f1f5f9;"">
                        <tr>
                            <td align=""center"" style=""padding:24px 12px;"">
                                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:680px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;"">
                                    <tr>
                                        <td style=""padding:16px 22px;background:#0f172a;color:#ffffff;"">
                                            <div style=""font-size:18px;font-weight:700;line-height:1.2;"">Hyoung FMS</div>
                                            <div style=""font-size:12px;opacity:0.85;margin-top:2px;"">Fleet Management Notification</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding:22px;"">
                                            <h2 style=""margin:0 0 14px;font-size:22px;line-height:1.35;color:#111827;"">{Title}</h2>
                                            <div style=""padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#334155;font-size:14px;line-height:1.6;"">
                                                {Message}
                                            </div>

                                            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top:16px;font-size:13px;color:#334155;"">
                                                <tr>
                                                    <td style=""padding:6px 0;width:110px;color:#64748b;"">Priority</td>
                                                    <td style=""padding:6px 0;font-weight:600;"">{Priority}</td>
                                                </tr>
                                                <tr>
                                                    <td style=""padding:6px 0;width:110px;color:#64748b;"">Category</td>
                                                    <td style=""padding:6px 0;font-weight:600;"">{Category}</td>
                                                </tr>
                                                <tr>
                                                    <td style=""padding:6px 0;width:110px;color:#64748b;"">Time</td>
                                                    <td style=""padding:6px 0;font-weight:600;"">{CreatedAt}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding:14px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;"">
                                            This is an automated message from Hyoung FMS. Please do not reply directly to this email.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
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

        /// <summary>
        /// Resolves a user identifier (could be user ID or username) to an actual user.Id for FK fields.
        /// Returns null if the value is null/empty or no matching user is found.
        /// </summary>
        private async Task<string?> ResolveUserIdAsync(string? userIdOrName, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(userIdOrName))
                return null;

            var userId = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userIdOrName || u.UserName == userIdOrName)
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return userId;
        }

        /// <summary>
        /// Resolves a valid system user ID from the database for auto-created issue FK fields.
        /// </summary>
        private async Task<string> ResolveSystemUserIdForIssueAsync(CancellationToken cancellationToken)
        {
            var systemUserId = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == SystemConstants.SystemUser.UserId
                         || u.UserName == SystemConstants.SystemUser.UserName
                         || u.UserName == "admin")
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (!string.IsNullOrEmpty(systemUserId))
                return systemUserId;

            // Fallback: use the first user in the database
            var fallbackId = await _context.Users
                .AsNoTracking()
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return fallbackId ?? throw new InvalidOperationException("No users found in database for auto-issue creation.");
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
                foreach (var dto in dtoList)
                {
                    EnrichPolicyDtoWithAlertTypeInfo(dto, policies.FirstOrDefault(p => p.Id == dto.Id)?.TriggerConditions);
                }
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
                EnrichPolicyDtoWithAlertTypeInfo(dto, policy.TriggerConditions);
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

                // AlertTypeKey-based flow: derive category from alert type
                string? alertTypeKey = request.AlertTypeKey;
                if (!string.IsNullOrWhiteSpace(alertTypeKey))
                {
                    if (!AlertConfigurationConstants.IsValidAlertType(alertTypeKey))
                        validationErrors.Add($"Invalid alert type key: {alertTypeKey}");
                }
                else if (request.NotificationCategoryId <= 0)
                {
                    validationErrors.Add("Either AlertTypeKey or Category is required");
                }

                if (!string.IsNullOrWhiteSpace(request.ActiveAlarmFilter))
                {
                    try
                    {
                        JObject.Parse(request.ActiveAlarmFilter);
                    }
                    catch
                    {
                        validationErrors.Add("ActiveAlarmFilter must be a valid JSON object");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse<int>.ValidationFailed(validationErrors);
                }

                // Auto-build ActiveAlarmFilter from AlertTypeKey if not explicitly provided
                var activeAlarmFilter = request.ActiveAlarmFilter;
                if (!string.IsNullOrWhiteSpace(alertTypeKey) && string.IsNullOrWhiteSpace(activeAlarmFilter))
                {
                    activeAlarmFilter = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        source = "ActiveAlarm",
                        eventType = "Created",
                        alarmType = alertTypeKey
                    });
                }

                var policy = new NotificationPolicy
                {
                    Name = request.Name,
                    NotificationCategoryId = request.NotificationCategoryId > 0 ? request.NotificationCategoryId : 1,
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
                    TriggerConditions = activeAlarmFilter,
                    RequireAcknowledgment = request.RequireAcknowledgment,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = string.IsNullOrWhiteSpace(request.CreatedBy)
                        ? SystemConstants.Defaults.SystemTriggeredBy
                        : request.CreatedBy!
                };

                // Save RecipientRules JSON if provided
                if (!string.IsNullOrWhiteSpace(request.RecipientRules))
                {
                    policy.RecipientRules = request.RecipientRules;
                }

                _context.NotificationPolicies.Add(policy);
                await _context.SaveChangesAsync(cancellationToken);

                // Save static recipients to notification_policy_recipient table
                if (request.RecipientUserIds?.Any() == true)
                {
                    var createdBy = string.IsNullOrWhiteSpace(request.CreatedBy)
                        ? SystemConstants.Defaults.SystemTriggeredBy
                        : request.CreatedBy!;

                    // Build delivery methods string from policy channel flags
                    var deliveryMethods = BuildDeliveryMethodsFromPolicy(policy);

                    foreach (var userId in request.RecipientUserIds.Distinct())
                    {
                        if (string.IsNullOrWhiteSpace(userId)) continue;

                        _context.NotificationPolicyRecipients.Add(new NotificationPolicyRecipient
                        {
                            NotificationPolicyId = policy.Id,
                            UserId = userId,
                            DeliveryMethods = deliveryMethods,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow,
                            CreatedBy = createdBy
                        });
                    }
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Saved {Count} static recipients for policy {PolicyId}",
                        request.RecipientUserIds.Count, policy.Id);
                }

                return FMSResponse<int>.Success(policy.Id, "Notification policy created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification policy");
                return FMSResponse<int>.Failed("Error creating notification policy");
            }
        }

        public async Task<FMSResponse> UpdateNotificationPolicyAsync(int policyId, UpdateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (policyId <= 0)
                {
                    return FMSResponse.FailedResponse("Policy id is required");
                }

                var validationErrors = new List<string>();
                if (string.IsNullOrWhiteSpace(request?.Name))
                {
                    validationErrors.Add("Policy name is required");
                }

                // Accept AlertTypeKey OR NotificationCategoryId (AlertTypeKey takes precedence)
                bool useAlertTypeKey = !string.IsNullOrWhiteSpace(request?.AlertTypeKey);
                if (!useAlertTypeKey && (request == null || request.NotificationCategoryId <= 0))
                {
                    validationErrors.Add("AlertTypeKey or Category is required");
                }

                if (useAlertTypeKey && !AlertConfigurationConstants.IsValidAlertType(request.AlertTypeKey))
                {
                    validationErrors.Add($"Invalid alert type key: {request.AlertTypeKey}");
                }

                // Build or validate active alarm filter
                string activeAlarmFilter = request?.ActiveAlarmFilter;
                if (useAlertTypeKey && string.IsNullOrWhiteSpace(activeAlarmFilter))
                {
                    var filterObj = new JObject
                    {
                        ["source"] = "ActiveAlarm",
                        ["eventType"] = "Created",
                        ["alarmType"] = request.AlertTypeKey
                    };
                    activeAlarmFilter = filterObj.ToString(Newtonsoft.Json.Formatting.None);
                }
                else if (!string.IsNullOrWhiteSpace(activeAlarmFilter))
                {
                    try
                    {
                        JObject.Parse(activeAlarmFilter);
                    }
                    catch
                    {
                        validationErrors.Add("ActiveAlarmFilter must be a valid JSON object");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse.FailedResponse(string.Join("; ", validationErrors));
                }

                var policy = await _context.NotificationPolicies
                    .FirstOrDefaultAsync(p => p.Id == policyId, cancellationToken);

                if (policy == null)
                {
                    return FMSResponse.FailedResponse($"Policy {policyId} not found");
                }

                policy.Name = request.Name;
                policy.NotificationCategoryId = useAlertTypeKey ? 1 : request.NotificationCategoryId;
                policy.NotificationType = request.NotificationType ?? "Alert";
                policy.Priority = request.Priority ?? "Medium";
                policy.EnableEmail = request.EnableEmail;
                policy.EnableSms = request.EnableSms;
                policy.EnableSystem = request.EnableSystem;
                policy.MaxNotificationsPerHour = request.MaxNotificationsPerHour ?? 10;
                policy.MaxNotificationsPerDay = request.MaxNotificationsPerDay ?? 50;
                policy.CooldownMinutes = request.CooldownMinutes ?? 30;
                policy.TitleTemplate = request.TitleTemplate;
                policy.MessageTemplate = request.MessageTemplate;
                policy.RequireAcknowledgment = request.RequireAcknowledgment;
                policy.TriggerConditions = activeAlarmFilter;
                policy.IsActive = request.IsActive;
                policy.ModifiedAt = DateTime.UtcNow;
                policy.ModifiedBy = string.IsNullOrWhiteSpace(request.ModifiedBy)
                    ? (policy.ModifiedBy ?? SystemConstants.Defaults.SystemTriggeredBy)
                    : request.ModifiedBy;

                // Update RecipientRules JSON if provided
                if (request.RecipientRules != null)
                {
                    policy.RecipientRules = string.IsNullOrWhiteSpace(request.RecipientRules) ? null : request.RecipientRules;
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Sync static recipients if the list was provided (null = leave unchanged)
                if (request.RecipientUserIds != null)
                {
                    // Remove all existing recipients for this policy
                    var existingRecipients = await _context.NotificationPolicyRecipients
                        .Where(r => r.NotificationPolicyId == policyId)
                        .ToListAsync(cancellationToken);
                    _context.NotificationPolicyRecipients.RemoveRange(existingRecipients);

                    // Add new recipients
                    if (request.RecipientUserIds.Any())
                    {
                        var modifiedBy = string.IsNullOrWhiteSpace(request.ModifiedBy)
                            ? (policy.CreatedBy ?? SystemConstants.Defaults.SystemTriggeredBy)
                            : request.ModifiedBy;

                        var deliveryMethods = BuildDeliveryMethodsFromPolicy(policy);

                        foreach (var userId in request.RecipientUserIds.Distinct())
                        {
                            if (string.IsNullOrWhiteSpace(userId)) continue;

                            _context.NotificationPolicyRecipients.Add(new NotificationPolicyRecipient
                            {
                                NotificationPolicyId = policyId,
                                UserId = userId,
                                DeliveryMethods = deliveryMethods,
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow,
                                CreatedBy = modifiedBy
                            });
                        }
                    }

                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Synced {Count} static recipients for policy {PolicyId}",
                        request.RecipientUserIds.Count, policyId);
                }

                return FMSResponse.SuccessResponse("Notification policy updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification policy {PolicyId}", policyId);
                return FMSResponse.FailedResponse("Error updating notification policy");
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

        /// <summary>
        /// Enriches a NotificationPolicyDto with AlertTypeKey, AlertGroup, and AlertDisplayName
        /// by parsing the TriggerConditions JSON to extract the alarmType field.
        /// </summary>
        private void EnrichPolicyDtoWithAlertTypeInfo(NotificationPolicyDto dto, string? triggerConditions)
        {
            if (string.IsNullOrWhiteSpace(triggerConditions)) return;
            try
            {
                var filter = JObject.Parse(triggerConditions);
                var alarmType = filter.Value<string>("alarmType");
                if (string.IsNullOrWhiteSpace(alarmType)) return;

                dto.AlertTypeKey = alarmType;
                dto.AlertGroup = AlertConfigurationConstants.GetGroupForAlertType(alarmType);
                dto.AlertDisplayName = AlertConfigurationConstants.GetDisplayNameForAlertType(alarmType);
            }
            catch
            {
                // Non-standard JSON or missing field — leave fields null
            }
        }

        /// <summary>
        /// Builds a comma-separated delivery methods string from the policy's enabled channels.
        /// Used when creating NotificationPolicyRecipient rows.
        /// </summary>
        private static string BuildDeliveryMethodsFromPolicy(NotificationPolicy policy)
        {
            var methods = new List<string>();
            if (policy.EnableSystem) methods.Add("System");
            if (policy.EnableEmail) methods.Add("Email");
            if (policy.EnableSms) methods.Add("SMS");
            return methods.Any() ? string.Join(",", methods) : "System";
        }
    }
}
