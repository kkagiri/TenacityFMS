using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Infrastructure.Communication.SignalR;
using FMS.Domain.Entities.Features.Notifications;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Noti = FMS.Domain.Entities.Features.Notifications;

namespace FMS.Application.Features.Notification.Services.Channels
{
    public class SystemNotificationChannel : INotificationChannel
    {
        private readonly ISignalRNotificationService _signalR;
        private readonly ILogger<SystemNotificationChannel> _logger;
        public string Name => SystemConstants.Notifications.SystemDeliveryMethod.ToLower();

        public SystemNotificationChannel(ISignalRNotificationService signalR, ILogger<SystemNotificationChannel> logger)
        {
            _signalR = signalR;
            _logger = logger;
        }

        public async Task<bool> SendAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken = default)
        {
            try
            {
                var plainMessage = StripHtml(notification.Message);

                await _signalR.SendUserNotificationAsync(
                    recipient.UserId,
                    SystemConstants.Notifications.SystemNotificationType,
                    plainMessage,
                    new
                    {
                        id = notification.NotificationId,
                        title = notification.Title,
                        message = plainMessage,
                        type = notification.Type.ToLower(),
                        priority = notification.Priority,
                        // Ensure timestamp is in ISO 8601 UTC format with 'Z' suffix
                        timestamp = notification.CreatedAt.ToString("o"),
                        data = notification.Data != null ? JsonConvert.DeserializeObject(notification.Data) : null
                    }
                );
                return true;
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "System channel send failed for {UserId}", recipient.UserId);
                return false;
            }
        }

        private static string StripHtml(string? html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;
            var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
            text = text.Replace("&amp;", "&")
                       .Replace("&lt;", "<")
                       .Replace("&gt;", ">")
                       .Replace("&nbsp;", " ")
                       .Replace("&quot;", "\"");
            text = System.Text.RegularExpressions.Regex.Replace(text, @"\s{2,}", " ");
            return text.Trim();
        }
    }
}