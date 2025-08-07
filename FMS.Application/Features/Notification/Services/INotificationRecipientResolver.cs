using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;

namespace FMS.Application.Features.Notification.Services {
    /// <summary>
    /// Service for dynamically resolving notification recipients based on business rules
    /// </summary>
    public interface INotificationRecipientResolver {
        /// <summary>
        /// Resolves recipients for a notification based on business rules
        /// </summary>
        /// <param name="request">The notification request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of resolved recipients</returns>
        Task<List<CreateNotificationRecipientRequest>> ResolveRecipientsAsync (
            CreateNotificationRequest request,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets site administrator for a site
        /// </summary>
        /// <param name="siteId">Site ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Site administrator user ID</returns>
        Task<string?> GetSiteAdministratorAsync (int siteId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets users by role for a specific site
        /// </summary>
        /// <param name="role">Role name</param>
        /// <param name="siteId">Site ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of user IDs with the specified role</returns>
        Task<List<string>> GetUsersByRoleAsync (string role, int? siteId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets users subscribed to a notification category
        /// </summary>
        /// <param name="category">Notification category</param>
        /// <param name="siteId">Site ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of subscribed user IDs</returns>
        Task<List<string>> GetSubscribedUsersAsync (int category, int? siteId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets notification policies for a category
        /// </summary>
        /// <param name="category">Notification category</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of notification policies</returns>
        Task<List<object>> GetNotificationPoliciesAsync (int category, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets user notification preferences
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="category">Notification category</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>User notification preference</returns>
        Task<object?> GetUserNotificationPreferenceAsync (string userId, string category, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets delivery methods for a user and priority
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="priority">Notification priority</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of delivery methods</returns>
        Task<List<string>> GetDeliveryMethodsForUserAsync (string userId, string priority, CancellationToken cancellationToken = default);
    }
}