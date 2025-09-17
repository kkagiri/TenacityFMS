using System.Threading;
using System.Threading.Tasks;
using Noti = FMS.Domain.Entities.Features.Notifications;
using Microsoft.Extensions.Logging;
using FMS.Domain.Entities.Features.Notifications;

namespace FMS.Application.Features.Notification.Services.Channels {
    /// <summary>
    /// Example Slack channel. Replace TODOs with your Slack webhook/API integration.
    /// </summary>
    public class SlackNotificationChannel : INotificationChannel {
        private readonly ILogger<SlackNotificationChannel> _logger;
        public string Name => "slack";

        public SlackNotificationChannel (ILogger<SlackNotificationChannel> logger) {
            _logger = logger;
        }

        public Task<bool> SendAsync (Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken = default) {
            try {
                // TODO: Implement Slack posting via webhook URL or Slack API
                _logger.LogInformation ("[Slack] {UserOrChannel}: {Title} - {Message}", recipient.RecipientAddress, notification.Title, notification.Message);
                return Task.FromResult (true);
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Slack channel send failed for {Recipient}", recipient.RecipientAddress);
                return Task.FromResult (false);
            }
        }
    }
}