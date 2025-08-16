using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services.Channels {
    public class EmailNotificationChannel : INotificationChannel {
        private readonly IEmailService _emailService;
        private readonly ILogger<EmailNotificationChannel> _logger;
        public string Name => "email";

        public EmailNotificationChannel (IEmailService emailService, ILogger<EmailNotificationChannel> logger) {
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<bool> SendAsync (FMS.Domain.Entities.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken = default) {
            try {
                var subject = notification.Title;
                var body = $"{notification.Title}: {notification.Message}";
                return await _emailService.SendEmailAsync (recipient.RecipientAddress, subject, body, false, cancellationToken);
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Email channel send failed for {Email}", recipient.RecipientAddress);
                return false;
            }
        }
    }
}