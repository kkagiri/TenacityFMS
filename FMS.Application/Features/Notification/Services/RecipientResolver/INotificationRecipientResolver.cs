using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;

namespace FMS.Application.Features.Notification.Services.RecipientResolver {
    /// <summary>
    /// Interface for resolving notification recipients based on various criteria
    /// </summary>
    public interface INotificationRecipientResolver {
        /// <summary>
        /// Resolves notification recipients based on the provided notification request
        /// </summary>
        /// <param name="request">The notification creation request containing criteria for recipient resolution</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of resolved notification recipients with their delivery methods</returns>
        Task<List<NotificationRecipientDto>> ResolveRecipientsAsync (
            CreateNotificationRequest request,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the site administrator for a specific site
        /// </summary>
        /// <param name="siteId">The site identifier</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>The site administrator's user ID, or null if not found</returns>
        Task<string?> GetSiteAdministratorAsync (
            int siteId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets users associated with a specific role, optionally filtered by site
        /// </summary>
        /// <param name="roleIdentifier">Role ID or role name</param>
        /// <param name="siteId">Optional site ID to filter users by site association</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of user IDs in the specified role</returns>
        Task<List<string>> GetUsersByRoleAsync (
            string roleIdentifier,
            int? siteId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets users who have subscribed to notifications for a specific category
        /// </summary>
        /// <param name="category">The notification category ID</param>
        /// <param name="siteId">Optional site ID filter</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of subscribed user IDs</returns>
        Task<List<string>> GetSubscribedUsersAsync (
            int category,
            int? siteId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets user notification preferences for a specific category
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="category">The notification category ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>User notification preference object or null if not found</returns>
        Task<object?> GetUserNotificationPreferenceAsync (
            string userId,
            int category,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets default delivery methods for a user based on priority level
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="priority">The notification priority level (Critical, High, Medium, Low)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of delivery method names</returns>
        Task<List<string>> GetDeliveryMethodsForUserAsync (
            string userId,
            string priority,
            CancellationToken cancellationToken = default);
    }
}