using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Infrastructure.Communication.SignalR;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Features.Notification.Services.Channels {
    public class SystemNotificationChannel : INotificationChannel {
        private readonly ISignalRNotificationService _signalR;
        private readonly ILogger<SystemNotificationChannel> _logger;
        public string Name => SystemConstants.Notifications.SystemDeliveryMethod.ToLower ();

        public SystemNotificationChannel (ISignalRNotificationService signalR, ILogger<SystemNotificationChannel> logger) {
            _signalR = signalR;
            _logger = logger;
        }

        public async Task<bool> SendAsync (FMS.Domain.Entities.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken = default) {
            try {
                await _signalR.SendUserNotificationAsync (
                    recipient.UserId,
                    SystemConstants.Notifications.SystemNotificationType,
                    notification.Message,
                    new {
                        id = notification.NotificationId,
                            title = notification.Title,
                            message = notification.Message,
                            type = notification.Type.ToLower (),
                            priority = notification.Priority,
                            timestamp = notification.CreatedAt,
                            data = notification.Data != null ? JsonConvert.DeserializeObject (notification.Data) : null
                    }
                );
                return true;
            } catch (System.Exception ex) {
                _logger.LogError (ex, "System channel send failed for {UserId}", recipient.UserId);
                return false;
            }
        }
    }
}