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

                // Get all active notification categories (keyed by Id for quick validation)
                var categories = await _context.NotificationCategories
                    .Where (c => c.IsActive)
                    .ToDictionaryAsync (c => c.Id, c => c, cancellationToken);

                var updatedCount = 0;
                var createdCount = 0;
                var skippedCategories = new List<int> ();

                foreach (var preferenceDto in request.Preferences) {
                    // Validate category exists
                    if (!categories.ContainsKey (preferenceDto.NotificationCategoryId)) {
                        skippedCategories.Add (preferenceDto.NotificationCategoryId);
                        _logger.LogWarning ("Skipping preference update: category id {CategoryId} not found or inactive (User {UserId})",
                            preferenceDto.NotificationCategoryId, request.UserId);
                        continue;
                    }
                    _logger.LogDebug ("Processing preference for user {UserId} category {CategoryId} (IsEnabled={IsEnabled})",
                        request.UserId, preferenceDto.NotificationCategoryId, preferenceDto.IsEnabled);
                    var existing = existingPreferences.FirstOrDefault (p => p.NotificationCategoryId == preferenceDto.NotificationCategoryId);

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
                        _logger.LogTrace ("Updated existing preference: User={UserId}, Category={CategoryId}, Methods={Methods}",
                            request.UserId, preferenceDto.NotificationCategoryId, existing.DeliveryMethods);
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
                            NotificationCategoryId = preferenceDto.NotificationCategoryId,
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
                        _logger.LogTrace ("Created new preference: User={UserId}, Category={CategoryId}, Methods={Methods}",
                            request.UserId, preferenceDto.NotificationCategoryId, newPreference.DeliveryMethods);
                    }
                }

                try {
                    await _context.SaveChangesAsync (cancellationToken);
                } catch (DbUpdateException dbEx) {
                    _logger.LogError (dbEx, "Database error while saving bulk user notification preferences for user {UserId}", request.UserId);
                    return FMSResponse<bool>.Failed ("Database error while saving notification preferences");
                }

                _logger.LogInformation ("Bulk updated user notification preferences for user {UserId}. Created: {Created}, Updated: {Updated}, Skipped: {Skipped}", request.UserId, createdCount, updatedCount, skippedCategories.Count);

                if (updatedCount == 0 && createdCount == 0 && skippedCategories.Count > 0) {
                    return FMSResponse<bool>.Failed ($"All {skippedCategories.Count} preferences skipped (invalid category ids). No changes saved.");
                }

                var successMessage = $"Updated {updatedCount}, created {createdCount}, skipped {skippedCategories.Count}";
                if (skippedCategories.Count > 0) successMessage += $". Skipped category ids: {string.Join(',', skippedCategories)}";
                return FMSResponse<bool>.Success (true, successMessage);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error bulk updating user notification preferences for user {UserId}",
                    command.Request.UserId);
                return FMSResponse<bool>.Failed ("Failed to bulk update user notification preferences");
            }
        }
    }
}