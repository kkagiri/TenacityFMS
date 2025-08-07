using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Commands {
    /// <summary>
    /// Command to bulk update user notification preferences
    /// </summary>
    public class BulkUpdateUserNotificationPreferencesCommand : IRequest<FMSResponse<bool>> {
        public BulkUpdateUserNotificationPreferencesRequest Request { get; set; } = null!;
    }

    public class BulkUpdateUserNotificationPreferencesCommandHandler : IRequestHandler<BulkUpdateUserNotificationPreferencesCommand, FMSResponse<bool>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<BulkUpdateUserNotificationPreferencesCommandHandler> _logger;

        public BulkUpdateUserNotificationPreferencesCommandHandler (
            GpsdataContext context,
            ILogger<BulkUpdateUserNotificationPreferencesCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle (BulkUpdateUserNotificationPreferencesCommand command, CancellationToken cancellationToken) {
            try {
                var request = command.Request;

                // Get existing preferences for the user
                var existingPreferences = await _context.UserNotificationPreferences
                    .Where (p => p.UserId == request.UserId)
                    .ToListAsync (cancellationToken);

                // Get all notification categories to map names to IDs
                var categories = await _context.NotificationCategories
                    .Where (c => c.IsActive)
                    .ToListAsync (cancellationToken);

                var updatedCount = 0;
                var createdCount = 0;

                foreach (var preferenceDto in request.Preferences) {
                    // Find the category by name to get the ID
                    var category = categories.FirstOrDefault (c => c.Name == preferenceDto.NotificationCategory);
                    if (category == null) {
                        _logger.LogWarning ("Category '{CategoryName}' not found, skipping preference update", preferenceDto.NotificationCategory);
                        continue;
                    }

                    var existing = existingPreferences.FirstOrDefault (p => p.NotificationCategoryId == category.Id);

                    if (existing != null) {
                        // Update existing preference
                        existing.DeliveryMethods = string.Join (",", preferenceDto.DeliveryMethods);
                        existing.IsEnabled = preferenceDto.IsEnabled;
                        existing.Priority = preferenceDto.Priority;

                        // Parse time spans
                        if (!string.IsNullOrEmpty (preferenceDto.QuietHoursStart)) {
                            if (TimeSpan.TryParse (preferenceDto.QuietHoursStart, out var start)) {
                                existing.QuietHoursStart = start;
                            }
                        }

                        if (!string.IsNullOrEmpty (preferenceDto.QuietHoursEnd)) {
                            if (TimeSpan.TryParse (preferenceDto.QuietHoursEnd, out var end)) {
                                existing.QuietHoursEnd = end;
                            }
                        }

                        existing.MaxNotificationsPerHour = preferenceDto.MaxNotificationsPerHour;
                        existing.MaxNotificationsPerDay = preferenceDto.MaxNotificationsPerDay;
                        existing.RequireAcknowledgment = preferenceDto.RequireAcknowledgment;
                        existing.UpdatedBy = request.UpdatedBy;
                        existing.UpdatedAt = DateTime.UtcNow;

                        updatedCount++;
                    } else {
                        // Create new preference
                        TimeSpan? quietStart = null;
                        TimeSpan? quietEnd = null;

                        if (!string.IsNullOrEmpty (preferenceDto.QuietHoursStart)) {
                            TimeSpan.TryParse (preferenceDto.QuietHoursStart, out var start);
                            quietStart = start;
                        }

                        if (!string.IsNullOrEmpty (preferenceDto.QuietHoursEnd)) {
                            TimeSpan.TryParse (preferenceDto.QuietHoursEnd, out var end);
                            quietEnd = end;
                        }

                        var newPreference = new UserNotificationPreference {
                            UserId = request.UserId,
                            NotificationCategoryId = category.Id,
                            DeliveryMethods = string.Join (",", preferenceDto.DeliveryMethods),
                            IsEnabled = preferenceDto.IsEnabled,
                            Priority = preferenceDto.Priority,
                            QuietHoursStart = quietStart,
                            QuietHoursEnd = quietEnd,
                            MaxNotificationsPerHour = preferenceDto.MaxNotificationsPerHour,
                            MaxNotificationsPerDay = preferenceDto.MaxNotificationsPerDay,
                            RequireAcknowledgment = preferenceDto.RequireAcknowledgment,
                            CreatedBy = request.UpdatedBy,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.UserNotificationPreferences.Add (newPreference);
                        createdCount++;
                    }
                }

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Bulk updated user notification preferences for user {UserId}. Created: {Created}, Updated: {Updated}",
                    request.UserId, createdCount, updatedCount);

                return FMSResponse<bool>.Success (true, $"Successfully updated {updatedCount} and created {createdCount} preferences");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error bulk updating user notification preferences for user {UserId}",
                    command.Request.UserId);
                return FMSResponse<bool>.Failed ("Failed to bulk update user notification preferences");
            }
        }
    }
}