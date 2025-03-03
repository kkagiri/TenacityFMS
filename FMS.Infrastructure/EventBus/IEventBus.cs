

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Infrastructure.EventBus
{
    public interface IEventBus
    {
        Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
                where TEvent : class;
        IAsyncEnumerable<TEvent> SubscribeAsync<TEvent>(CancellationToken cancellationToken = default)
            where TEvent : class;
        void Subscribe<TEvent>(Func<TEvent, Task> handler) where TEvent : class;
        void Unsubscribe<TEvent>(Func<TEvent, Task> handler) where TEvent : class;
    }
}
