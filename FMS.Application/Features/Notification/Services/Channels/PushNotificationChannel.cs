using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services.Channels {
    /// <summary>
    /// Example mobile push channel. Replace TODOs with your push provider integration (Firebase, APNS, etc.).
    /// </summary>
    public class PushNotificationChannel : INotificationChannel {
        private readonly ILogger<PushNotificationChannel> _logger;
        public string Name => "push";

        public PushNotificationChannel (ILogger<PushNotificationChannel> logger) {
            _logger = logger;
        }

        public Task<bool> SendAsync (FMS.Domain.Entities.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken = default) {
            try {
                // TODO: Implement push send via provider
                _logger.LogInformation ("[Push] {DeviceOrUser}: {Title} - {Message}", recipient.RecipientAddress, notification.Title, notification.Message);
                return Task.FromResult (true);
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Push channel send failed for {Recipient}", recipient.RecipientAddress);
                return Task.FromResult (false);
            }
        }
    }
}