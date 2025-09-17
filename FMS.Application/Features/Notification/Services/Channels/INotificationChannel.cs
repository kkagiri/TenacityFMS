using FMS.Domain.Entities.Features.Notifications;
using System.Threading;
using System.Threading.Tasks;
using Noti = FMS.Domain.Entities.Features.Notifications;

namespace FMS.Application.Features.Notification.Services {
    /// <summary>
    /// Pluggable channel for delivering notifications via a specific method (e.g., email, sms, slack).
    /// </summary>
    public interface INotificationChannel {
        /// <summary>
        /// Canonical, lowercase name of the delivery method (e.g., "system", "email", "sms", "slack", "push").
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Send the notification to a single recipient.
        /// </summary>
        Task<bool> SendAsync (Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken = default);
    }
}