using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Services.DeliveryChannel;
using FMS.Domain.Entities.Features.Notifications;
using Microsoft.Extensions.Logging;
using Noti = FMS.Domain.Entities.Features.Notifications;

namespace FMS.Application.Features.Notification.Services.Channels
{
    /// <summary>
    /// Push notification channel for mobile/web push notifications.
    /// Integrates with Firebase Cloud Messaging (FCM) and Expo Push.
    /// </summary>
    public class PushNotificationChannel : INotificationChannel
    {
        private readonly ILogger<PushNotificationChannel> _logger;
        private readonly IPushNotificationService _pushService;

        public string Name => "push";

        public PushNotificationChannel(
            ILogger<PushNotificationChannel> logger,
            IPushNotificationService pushService)
        {
            _logger = logger;
            _pushService = pushService;
        }

        public async Task<bool> SendAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(recipient.UserId))
                {
                    _logger.LogWarning("[Push] Cannot send: recipient has no UserId");
                    return false;
                }

                // Send to all registered devices for this user
                var result = await _pushService.SendToUserAsync(
                    recipient.UserId,
                    notification.Title,
                    notification.Message,
                    new
                    {
                        notificationId = notification.NotificationId,
                        type = notification.Type,
                        category = notification.Category,
                        priority = notification.Priority,
                        siteId = notification.SiteId,
                        tankId = notification.TankId
                    },
                    cancellationToken);

                if (result.IsSuccess && result.Data != null)
                {
                    _logger.LogInformation("[Push] Sent to {DeviceCount} devices for user {UserId}",
                        result.Data.DevicesSent, recipient.UserId);
                    return result.Data.DevicesSent > 0;
                }

                _logger.LogWarning("[Push] Failed for user {UserId}: {Message}",
                    recipient.UserId, result.Message);
                return false;
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "[Push] Channel send failed for user {UserId}", recipient.UserId);
                return false;
            }
        }
    }
}