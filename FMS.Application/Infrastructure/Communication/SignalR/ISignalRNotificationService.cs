using System;
using System.Threading.Tasks;

namespace FMS.Application.Infrastructure.Communication.SignalR {
    /// <summary>
    /// Interface for SignalR notifications
    /// </summary>
    public interface ISignalRNotificationService {
        /// <summary>
        /// Sends a notification to a specific user
        /// </summary>
        /// <param name="userId">The ID of the user to send the notification to</param>
        /// <param name="notificationType">The type of notification</param>
        /// <param name="message">The notification message</param>
        /// <param name="data">Optional data to include with the notification</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendUserNotificationAsync (string userId, string notificationType, string message, object data = null);

        /// <summary>
        /// Sends a notification to all users in a group
        /// </summary>
        /// <param name="groupName">The name of the group to send the notification to</param>
        /// <param name="notificationType">The type of notification</param>
        /// <param name="message">The notification message</param>
        /// <param name="data">Optional data to include with the notification</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendGroupNotificationAsync (string groupName, string notificationType, string message, object data = null);

        /// <summary>
        /// Sends a notification to all connected users
        /// </summary>
        /// <param name="notificationType">The type of notification</param>
        /// <param name="message">The notification message</param>
        /// <param name="data">Optional data to include with the notification</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task SendGlobalNotificationAsync (string notificationType, string message, object data = null);

        /// <summary>
        /// Adds a user to a group
        /// </summary>
        /// <param name="userId">The ID of the user to add</param>
        /// <param name="groupName">The name of the group to add the user to</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task AddUserToGroupAsync (string userId, string groupName);

        /// <summary>
        /// Removes a user from a group
        /// </summary>
        /// <param name="userId">The ID of the user to remove</param>
        /// <param name="groupName">The name of the group to remove the user from</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task RemoveUserFromGroupAsync (string userId, string groupName);
    }
}