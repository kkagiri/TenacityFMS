using System;
using System.Collections.Generic;
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

namespace FMS.Application.Features.Notification.Queries {
    /// <summary>
    /// Query to get user notification preferences
    /// </summary>
    public class GetUserNotificationPreferencesQuery : IRequest<FMSResponse<List<UserNotificationPreferenceDto>>> {
        public GetUserNotificationPreferencesRequest Request { get; set; } = null!;
    }

    public class GetUserNotificationPreferencesQueryHandler : IRequestHandler<GetUserNotificationPreferencesQuery, FMSResponse<List<UserNotificationPreferenceDto>>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetUserNotificationPreferencesQueryHandler> _logger;

        public GetUserNotificationPreferencesQueryHandler (
            GpsdataContext context,
            ILogger<GetUserNotificationPreferencesQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<UserNotificationPreferenceDto>>> Handle (GetUserNotificationPreferencesQuery query, CancellationToken cancellationToken) {
            try {
                var request = query.Request;

                var queryable = _context.UserNotificationPreferences
                    .Where (p => p.UserId == request.UserId);

                if (request.Category > 0) {
                    queryable = queryable.Where (p => p.NotificationCategoryId == request.Category);
                }

                if (request.IsEnabled.HasValue) {
                    queryable = queryable.Where (p => p.IsEnabled == request.IsEnabled.Value);
                }

                var preferences = await queryable
                    .OrderBy (p => p.NotificationCategory)
                    .ToListAsync (cancellationToken);

                var result = preferences.Select (p => new UserNotificationPreferenceDto {
                    Id = p.Id,
                        UserId = p.UserId,
                        NotificationCategoryId = p.NotificationCategoryId,
                        DeliveryMethods = p.DeliveryMethods.Split (',', StringSplitOptions.RemoveEmptyEntries).ToList (),
                        IsEnabled = p.IsEnabled,
                        Priority = p.Priority,
                        QuietHoursStart = p.QuietHoursStart?.ToString (@"hh\:mm\:ss"),
                        QuietHoursEnd = p.QuietHoursEnd?.ToString (@"hh\:mm\:ss"),
                        MaxNotificationsPerHour = p.MaxNotificationsPerHour,
                        MaxNotificationsPerDay = p.MaxNotificationsPerDay,
                        RequireAcknowledgment = p.RequireAcknowledgment,
                        CreatedAt = p.CreatedAt,
                        UpdatedAt = p.UpdatedAt,
                        CreatedBy = p.CreatedBy,
                        UpdatedBy = p.UpdatedBy
                }).ToList ();

                return FMSResponse<List<UserNotificationPreferenceDto>>.Success (result,
                    $"Retrieved {result.Count} notification preferences for user {request.UserId}");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving user notification preferences for user {UserId}",
                    query.Request.UserId);
                return FMSResponse<List<UserNotificationPreferenceDto>>.Failed ("Failed to retrieve user notification preferences");
            }
        }
    }
}