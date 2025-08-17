using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Commands {
    /// <summary>
    /// Command to update an existing user notification preference
    /// </summary>
    public class UpdateUserNotificationPreferenceCommand : IRequest<FMSResponse<bool>> {
        public UpdateUserNotificationPreferenceRequest Request { get; set; } = null!;
    }

    public class UpdateUserNotificationPreferenceCommandHandler : IRequestHandler<UpdateUserNotificationPreferenceCommand, FMSResponse<bool>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateUserNotificationPreferenceCommandHandler> _logger;

        public UpdateUserNotificationPreferenceCommandHandler (
            GpsdataContext context,
            ILogger<UpdateUserNotificationPreferenceCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle (UpdateUserNotificationPreferenceCommand command, CancellationToken cancellationToken) {
            try {
                var request = command.Request;

                var preference = await _context.UserNotificationPreferences
                    .FirstOrDefaultAsync (p => p.Id == request.Id, cancellationToken);

                if (preference == null) {
                    return FMSResponse<bool>.Failed ("User notification preference not found");
                }

                // Update only provided fields
                if (request.DeliveryMethods != null) {
                    preference.DeliveryMethods = string.Join (",", request.DeliveryMethods);
                }

                if (request.IsEnabled.HasValue) {
                    preference.IsEnabled = request.IsEnabled.Value;
                }

                if (!string.IsNullOrEmpty (request.Priority)) {
                    preference.Priority = request.Priority;
                }

                if (request.QuietHoursStart != null) {
                    if (TimeSpan.TryParse (request.QuietHoursStart, out var start)) {
                        preference.QuietHoursStart = start;
                    }
                }

                if (request.QuietHoursEnd != null) {
                    if (TimeSpan.TryParse (request.QuietHoursEnd, out var end)) {
                        preference.QuietHoursEnd = end;
                    }
                }

                if (request.MaxNotificationsPerHour.HasValue) {
                    preference.MaxNotificationsPerHour = request.MaxNotificationsPerHour.Value;
                }

                if (request.MaxNotificationsPerDay.HasValue) {
                    preference.MaxNotificationsPerDay = request.MaxNotificationsPerDay.Value;
                }

                if (request.RequireAcknowledgment.HasValue) {
                    preference.RequireAcknowledgment = request.RequireAcknowledgment.Value;
                }

                preference.UpdatedBy = request.UpdatedBy;
                preference.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Updated user notification preference {Id} for user {UserId}",
                    preference.Id, preference.UserId);

                return FMSResponse<bool>.Success (true, "User notification preference updated successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating user notification preference {Id}",
                    command.Request.Id);
                return FMSResponse<bool>.Failed ("Failed to update user notification preference");
            }
        }
    }
}