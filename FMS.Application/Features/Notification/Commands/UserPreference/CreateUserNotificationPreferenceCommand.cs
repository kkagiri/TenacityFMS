using System;
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
    /// Command to create a new user notification preference
    /// </summary>
    public class CreateUserNotificationPreferenceCommand : IRequest<FMSResponse<int>> {
        public CreateUserNotificationPreferenceRequest Request { get; set; } = null!;
    }

    public class CreateUserNotificationPreferenceCommandHandler : IRequestHandler<CreateUserNotificationPreferenceCommand, FMSResponse<int>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateUserNotificationPreferenceCommandHandler> _logger;

        public CreateUserNotificationPreferenceCommandHandler (
            GpsdataContext context,
            ILogger<CreateUserNotificationPreferenceCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<int>> Handle (CreateUserNotificationPreferenceCommand command, CancellationToken cancellationToken) {
            try {
                var request = command.Request;

                // Check if preference already exists for this user and category
                var existing = await _context.UserNotificationPreferences
                    .FirstOrDefaultAsync (p => p.UserId == request.UserId &&
                        p.NotificationCategoryId == request.NotificationCategoryId,
                        cancellationToken);

                if (existing != null) {
                    return FMSResponse<int>.Failed ("Preference for this category already exists for the user");
                }

                // Validate that the category exists
                var categoryExists = await _context.NotificationCategories
                    .AnyAsync (c => c.Id == request.NotificationCategoryId && c.IsActive, cancellationToken);

                if (!categoryExists) {
                    return FMSResponse<int>.Failed ("Invalid notification category");
                }

                // Parse time spans
                TimeSpan? quietStart = null;
                TimeSpan? quietEnd = null;

                if (!string.IsNullOrEmpty (request.QuietHoursStart)) {
                    if (!TimeSpan.TryParse (request.QuietHoursStart, out var start)) {
                        return FMSResponse<int>.Failed ("Invalid quiet hours start time format");
                    }
                    quietStart = start;
                }

                if (!string.IsNullOrEmpty (request.QuietHoursEnd)) {
                    if (!TimeSpan.TryParse (request.QuietHoursEnd, out var end)) {
                        return FMSResponse<int>.Failed ("Invalid quiet hours end time format");
                    }
                    quietEnd = end;
                }

                var preference = new UserNotificationPreference {
                    UserId = request.UserId,
                    NotificationCategoryId = request.NotificationCategoryId,
                    DeliveryMethods = string.Join (",", request.DeliveryMethods),
                    IsEnabled = request.IsEnabled,
                    Priority = request.Priority,
                    QuietHoursStart = quietStart,
                    QuietHoursEnd = quietEnd,
                    MaxNotificationsPerHour = request.MaxNotificationsPerHour,
                    MaxNotificationsPerDay = request.MaxNotificationsPerDay,
                    RequireAcknowledgment = request.RequireAcknowledgment,
                    CreatedBy = request.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserNotificationPreferences.Add (preference);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Created user notification preference {Id} for user {UserId} and category {Category}",
                    preference.Id, request.UserId, preference.NotificationCategory.Name);

                return FMSResponse<int>.Success (preference.Id, "User notification preference created successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating user notification preference for user {UserId}",
                    command.Request.UserId);
                return FMSResponse<int>.Failed ("Failed to create user notification preference");
            }
        }
    }
}