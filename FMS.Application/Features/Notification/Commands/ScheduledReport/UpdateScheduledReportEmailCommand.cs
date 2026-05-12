/**
 * File: UpdateScheduledReportEmailCommand.cs
 * Purpose: Command and handler to update a scheduled report email configuration.
 * Dependencies: MediatR, GpsdataContext, NotificationDataHelper, Newtonsoft.Json
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - UpdateScheduledReportEmailCommand: Wraps notification ID and update request payload.
 * - UpdateScheduledReportEmailCommandHandler: Persists schedule, filter, and recipient changes.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Notification.Commands.ScheduledReport
{
    public record UpdateScheduledReportEmailCommand(
        int NotificationId,
        UpdateScheduledReportEmailRequest Request
    ) : IRequest<FMSResponse<ScheduledReportEmailDto>>;

    public class UpdateScheduledReportEmailCommandHandler
        : IRequestHandler<UpdateScheduledReportEmailCommand, FMSResponse<ScheduledReportEmailDto>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateScheduledReportEmailCommandHandler> _logger;

        public UpdateScheduledReportEmailCommandHandler(
            GpsdataContext context,
            ILogger<UpdateScheduledReportEmailCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<ScheduledReportEmailDto>> Handle(
            UpdateScheduledReportEmailCommand command,
            CancellationToken cancellationToken)
        {
            var request = command.Request;
            if (request == null)
            {
                return FMSResponse<ScheduledReportEmailDto>.Failed("Request payload is required");
            }

            var notification = await _context.Notifications
                .Include(n => n.Recipients)
                .FirstOrDefaultAsync(n => n.Id == command.NotificationId, cancellationToken);

            if (notification == null)
            {
                return FMSResponse<ScheduledReportEmailDto>.Failed("Scheduled report notification not found");
            }

            if (string.Equals(notification.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<ScheduledReportEmailDto>.Failed("Cancelled schedules cannot be updated");
            }

            var root = NotificationDataHelper.ParseNotificationData(notification.Data);
            var recurringSchedule = root["recurringSchedule"] as JObject ?? new JObject();

            // Normalize and apply schedule days
            var normalizedDays = NotificationDataHelper.NormalizeScheduleDays(request.DaysOfWeek);
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
                recurringSchedule["timeOfDay"] = NotificationDataHelper.NormalizeScheduleTime(request.ScheduleTimeOfDay);
            }

            var normalizedWeeks = NotificationDataHelper.NormalizeScheduleWeeks(request.WeeksOfMonth);
            if (normalizedWeeks.Any())
            {
                recurringSchedule["weeksOfMonth"] = JArray.FromObject(normalizedWeeks);
                recurringSchedule["weekOfMonth"] = normalizedWeeks[0];
            }

            if (!string.IsNullOrWhiteSpace(request.WeekOfMonth))
            {
                var normalizedSingleWeek = NotificationDataHelper.NormalizeScheduleWeeks(new[] { request.WeekOfMonth });
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

            // Persist offsetDays and windowDays if provided
            if (request.OffsetDays.HasValue)
            {
                root["offsetDays"] = Math.Max(1, request.OffsetDays.Value);
            }
            if (request.WindowDays.HasValue)
            {
                root["windowDays"] = Math.Max(1, request.WindowDays.Value);
            }

            // Persist format if provided
            if (!string.IsNullOrWhiteSpace(request.Format))
            {
                root["format"] = request.Format.Trim().ToUpperInvariant();
            }

            // Persist sourceId if provided
            if (!string.IsNullOrWhiteSpace(request.SourceId))
            {
                root["sourceId"] = request.SourceId.Trim();
            }

            // Persist schedule display name if provided
            if (!string.IsNullOrWhiteSpace(request.ScheduleName))
            {
                var scheduleName = request.ScheduleName.Trim();
                notification.Title = scheduleName;
                root["reportName"] = scheduleName;
            }

            // Persist filter changes if provided — sync siteIds/tankIds/names
            if (request.Filters != null)
            {
                var filtersToken = NotificationDataHelper.ConvertToJToken(request.Filters);
                root["filters"] = filtersToken;

                var filtersObj = filtersToken as JObject;
                if (filtersObj == null && filtersToken is JValue filterStr)
                {
                    try { filtersObj = JObject.Parse(filterStr.ToString()); } catch { }
                }

                if (filtersObj != null)
                {
                    var filterSiteIds = filtersObj["siteId"]?.ToObject<List<int>>() ?? new List<int>();
                    var filterTankIds = filtersObj["tankId"]?.ToObject<List<int>>() ?? new List<int>();

                    root["siteIds"] = JArray.FromObject(filterSiteIds);
                    root["tankIds"] = JArray.FromObject(filterTankIds);

                    // Resolve site names from DB
                    if (filterSiteIds.Any())
                    {
                        var siteNames = await _context.Sites
                            .Where(s => filterSiteIds.Contains(s.Id))
                            .Select(s => s.Name)
                            .ToListAsync(cancellationToken);
                        root["siteNames"] = JArray.FromObject(siteNames);
                    }
                    else
                    {
                        root["siteNames"] = new JArray();
                    }

                    // Resolve tank names from DB
                    if (filterTankIds.Any())
                    {
                        var tankNames = await _context.Tanks
                            .Where(t => filterTankIds.Contains(t.Id))
                            .Select(t => t.Name)
                            .ToListAsync(cancellationToken);
                        root["tankNames"] = JArray.FromObject(tankNames);
                    }
                    else
                    {
                        root["tankNames"] = new JArray();
                    }
                }
            }

            // Persist day-of-month for monthly schedules
            if (request.DayOfMonth.HasValue)
            {
                recurringSchedule["dayOfMonth"] = request.DayOfMonth.Value;
                root["recurringSchedule"] = recurringSchedule;
            }

            var scheduledAtUtc = request.ScheduledAtUtc;
            if (!scheduledAtUtc.HasValue)
            {
                var dataNextRun = root["recurringSchedule"]?["nextRunAtUtc"]?.Value<DateTime?>();
                if (dataNextRun.HasValue)
                {
                    scheduledAtUtc = NotificationDataHelper.NormalizeToUtc(dataNextRun.Value);
                }
            }

            if (!scheduledAtUtc.HasValue)
            {
                return FMSResponse<ScheduledReportEmailDto>.Failed("ScheduledAtUtc is required to update schedule timing");
            }

            var normalizedScheduledAtUtc = NotificationDataHelper.NormalizeToUtc(scheduledAtUtc.Value);
            recurringSchedule["nextRunAtUtc"] = normalizedScheduledAtUtc.ToString("o");
            recurringSchedule["lastUpdatedAtUtc"] = DateTime.UtcNow.ToString("o");
            root["recurringSchedule"] = recurringSchedule;

            notification.ScheduledAt = normalizedScheduledAtUtc;
            notification.Status = "Scheduled";
            notification.ErrorMessage = null;
            notification.Data = root.ToString(Formatting.None);

            // Reconcile recipients if email list was provided
            if (request.RecipientEmails != null)
            {
                var existingRecipients = notification.Recipients?.ToList()
                    ?? new List<global::FMS.Domain.Entities.Features.Notifications.NotificationRecipient>();

                // Remove recipients no longer in the list
                var toRemove = existingRecipients
                    .Where(r => !request.RecipientEmails.Contains(r.RecipientAddress, StringComparer.OrdinalIgnoreCase))
                    .ToList();
                if (toRemove.Any())
                {
                    _context.NotificationRecipients.RemoveRange(toRemove);
                }

                // Add new recipients that don't already exist
                var existingAddresses = existingRecipients
                    .Select(r => r.RecipientAddress.ToLowerInvariant())
                    .ToHashSet();

                foreach (var email in request.RecipientEmails)
                {
                    if (!existingAddresses.Contains(email.ToLowerInvariant()))
                    {
                        var user = await _context.Users
                            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

                        notification.Recipients ??= new List<global::FMS.Domain.Entities.Features.Notifications.NotificationRecipient>();
                        notification.Recipients.Add(
                            new global::FMS.Domain.Entities.Features.Notifications.NotificationRecipient
                            {
                                NotificationId = notification.Id,
                                UserId = user?.Id ?? "unknown",
                                DeliveryMethod = "Email",
                                RecipientAddress = email,
                                DeliveryStatus = "Pending"
                            });
                    }
                }

                // Update recipientNames in Data JSON
                root["recipientNames"] = JArray.FromObject(
                    request.RecipientEmails.Select(e => e).ToList());
                notification.Data = root.ToString(Formatting.None);
            }

            await _context.SaveChangesAsync(cancellationToken);

            var dto = NotificationDataHelper.MapScheduledReportEmail(notification);
            return FMSResponse<ScheduledReportEmailDto>.Success(dto, "Scheduled report email updated successfully");
        }
    }
}
