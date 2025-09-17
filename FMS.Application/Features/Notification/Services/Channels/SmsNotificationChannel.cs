using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Noti = FMS.Domain.Entities.Features.Notifications;


namespace FMS.Application.Features.Notification.Services.Channels {
    public class SmsNotificationChannel : INotificationChannel {
        private readonly ISmsService _smsService;
        private readonly ILogger<SmsNotificationChannel> _logger;
        public string Name => "sms";

        public SmsNotificationChannel (ISmsService smsService, ILogger<SmsNotificationChannel> logger) {
            _smsService = smsService;
            _logger = logger;
        }

        public async Task<bool> SendAsync (Noti.Notification notification, Noti.NotificationRecipient recipient, CancellationToken cancellationToken = default) {
            try {
                var content = $"{notification.Title}: {notification.Message}";
                return await _smsService.SendSmsAsync (recipient.RecipientAddress, content, cancellationToken);
            } catch (System.Exception ex) {
                _logger.LogError (ex, "SMS channel send failed for {Phone}", recipient.RecipientAddress);
                return false;
            }
        }
    }
}