using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.Services {
    /// <summary>
    /// Registry for notification channels keyed by delivery method name.
    /// </summary>
    public class NotificationChannelRegistry : INotificationChannelRegistry {
        private readonly ConcurrentDictionary<string, INotificationChannel> _channels = new(StringComparer.OrdinalIgnoreCase);

        public NotificationChannelRegistry(IEnumerable<INotificationChannel> channels) {
            if (channels != null) {
                foreach (var ch in channels) {
                    Register(ch);
                }
            }
        }

        public void Register(INotificationChannel channel) {
            if (channel == null) return;
            _channels[channel.Name] = channel;
        }

        public bool TryGet(string deliveryMethod, out INotificationChannel? channel) {
            return _channels.TryGetValue(deliveryMethod ?? string.Empty, out channel);
        }

        public IEnumerable<string> GetRegisteredMethods() => _channels.Keys;
    }

    public interface INotificationChannelRegistry {
        void Register(INotificationChannel channel);
        bool TryGet(string deliveryMethod, out INotificationChannel? channel);
        IEnumerable<string> GetRegisteredMethods();
    }
}
