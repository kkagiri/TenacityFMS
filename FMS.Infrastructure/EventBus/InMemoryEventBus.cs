using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace FMS.Infrastructure.EventBus

{
    public class InMemoryEventBus : IEventBus
    {

        private readonly ILogger<InMemoryEventBus> _logger;
        private readonly Dictionary<Type, List<Func<object, Task>>> _handlers;
        private readonly Channel<object> _channel;

        public InMemoryEventBus(ILogger<InMemoryEventBus> logger)
        {
            _logger = logger;
            _handlers = new Dictionary<Type, List<Func<object, Task>>>();
            _channel = Channel.CreateUnbounded<object>(new UnboundedChannelOptions
            {
                SingleReader = false,
                SingleWriter = true
            });
        }


        public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) where TEvent : class
        {
            try
            {
                await _channel.Writer.WriteAsync(@event, cancellationToken);

                var eventType = typeof(TEvent);
                if (_handlers.TryGetValue(eventType, out var handlers))
                {
                    foreach (var handler in handlers)
                    {
                        try
                        {
                            await handler(@event);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error handling event {EventType}", eventType);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing event {EventType}", typeof(TEvent));
                throw;
            }
        }

        public void Subscribe<TEvent>(Func<TEvent, Task> handler) where TEvent : class
        {
            var eventType = typeof(TEvent);
            if (!_handlers.ContainsKey(eventType))
            {
                _handlers[eventType] = new List<Func<object, Task>>();
            }
            _handlers[eventType].Add((@event) => handler((TEvent)@event));
        }

        public async IAsyncEnumerable<TEvent> SubscribeAsync<TEvent>(
         [EnumeratorCancellation] CancellationToken cancellationToken = default)
         where TEvent : class
        {
            await foreach (var message in _channel.Reader.ReadAllAsync(cancellationToken))
            {
                if (message is TEvent typedEvent)
                {
                    yield return typedEvent;
                }
            }
        }
        public void Unsubscribe<TEvent>(Func<TEvent, Task> handler) where TEvent : class
        {
            var eventType = typeof(TEvent);
            if (_handlers.ContainsKey(eventType))
            {
                _handlers[eventType].RemoveAll(h => h.Target == handler.Target);
            }
        }
    }
}