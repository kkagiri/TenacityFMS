using System;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Infrastructure.Communication.SignalR {
    /// <summary>
    /// Concrete implementation of ISignalRNotificationService for sending notifications via SignalR
    /// </summary>
    public class SignalRNotificationService : ISignalRNotificationService {
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly ILogger<SignalRNotificationService> _logger;

        public SignalRNotificationService (
            IHubContext<FrontEndHub> hubContext,
            ILogger<SignalRNotificationService> logger) {
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>
        /// Sends a notification to a specific user
        /// </summary>
        public async Task SendUserNotificationAsync (string userId, string notificationType, string message, object data = null) {
            try {
            var notificationData = new {
            id = Guid.NewGuid ().ToString (),
            type = notificationType,
            message = message,
            data = data,
            timestamp = DateTime.UtcNow
                };

                await _hubContext.Clients.User (userId).SendAsync ("SystemNotification", notificationData);
                _logger.LogDebug ("Sent {NotificationType} notification to user {UserId}", notificationType, userId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending notification to user {UserId}: {Message}", userId, ex.Message);
                throw;
            }
        }

        /// <summary>
        /// Sends a notification to all users in a group
        /// </summary>
        public async Task SendGroupNotificationAsync (string groupName, string notificationType, string message, object data = null) {
            try {
            var notificationData = new {
            id = Guid.NewGuid ().ToString (),
            type = notificationType,
            message = message,
            data = data,
            timestamp = DateTime.UtcNow
                };

                await _hubContext.Clients.Group (groupName).SendAsync ("SystemNotification", notificationData);
                _logger.LogDebug ("Sent {NotificationType} notification to group {GroupName}", notificationType, groupName);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending notification to group {GroupName}: {Message}", groupName, ex.Message);
                throw;
            }
        }

        /// <summary>
        /// Sends a notification to all connected users
        /// </summary>
        public async Task SendGlobalNotificationAsync (string notificationType, string message, object data = null) {
            try {
            var notificationData = new {
            id = Guid.NewGuid ().ToString (),
            type = notificationType,
            message = message,
            data = data,
            timestamp = DateTime.UtcNow
                };

                await _hubContext.Clients.All.SendAsync ("SystemNotification", notificationData);
                _logger.LogDebug ("Sent {NotificationType} global notification", notificationType);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending global notification: {Message}", ex.Message);
                throw;
            }
        }

        /// <summary>
        /// Adds a user to a group
        /// </summary>
        public async Task AddUserToGroupAsync (string userId, string groupName) {
            try {
                // Note: This implementation assumes userId is the connection ID
                // In a real implementation, you might need to maintain a mapping of user IDs to connection IDs
                await _hubContext.Groups.AddToGroupAsync (userId, groupName);
                _logger.LogDebug ("Added user {UserId} to group {GroupName}", userId, groupName);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error adding user {UserId} to group {GroupName}: {Message}", userId, groupName, ex.Message);
                throw;
            }
        }

        /// <summary>
        /// Removes a user from a group
        /// </summary>
        public async Task RemoveUserFromGroupAsync (string userId, string groupName) {
            try {
                // Note: This implementation assumes userId is the connection ID
                // In a real implementation, you might need to maintain a mapping of user IDs to connection IDs
                await _hubContext.Groups.RemoveFromGroupAsync (userId, groupName);
                _logger.LogDebug ("Removed user {UserId} from group {GroupName}", userId, groupName);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error removing user {UserId} from group {GroupName}: {Message}", userId, groupName, ex.Message);
                throw;
            }
        }
    }
}