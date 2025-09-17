using System.Collections.Concurrent;
using FMS.IoT.Contracts.ProcessingEngine.Interfaces;
using FMS.IoT.Contracts.ProcessingEngine.Models;
using Microsoft.Extensions.Logging;

namespace FMS.IoT.ProcessingEngine.Events;

/// <summary>
/// Event processing service implementation
/// </summary>
public class EventProcessingService : IEventProcessor {
    private readonly ILogger<EventProcessingService> _logger;
    private readonly ConcurrentDictionary<string, List<Func<object, Task>>> _eventHandlers;
    private readonly ConcurrentDictionary<string, Func<ProcessingEvent, Task>> _processingEventHandlers;
    private readonly EventStatistics _statistics;

    public EventProcessingService (ILogger<EventProcessingService> logger) {
        _logger = logger;
        _eventHandlers = new ConcurrentDictionary<string, List<Func<object, Task>>> ();
        _processingEventHandlers = new ConcurrentDictionary<string, Func<ProcessingEvent, Task>> ();
        _statistics = new EventStatistics {
            LastUpdated = DateTime.UtcNow
        };
    }

    public async Task PublishEventAsync<T> (T eventData, CancellationToken cancellationToken = default) where T : class {
        try {
            var eventType = typeof (T).Name;
            _logger.LogDebug ("Publishing event of type {EventType}", eventType);

            if (_eventHandlers.TryGetValue (eventType, out var handlers)) {
                var tasks = handlers.Select (handler => handler (eventData));
                await Task.WhenAll (tasks);

                _statistics.TotalEventsPublished++;
                UpdateEventTypeStatistics (eventType);
            } else {
                _logger.LogDebug ("No handlers registered for event type {EventType}", eventType);
            }

            _statistics.LastUpdated = DateTime.UtcNow;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to publish event of type {EventType}", typeof (T).Name);
            _statistics.FailedEvents++;
            throw;
        }
    }

    public async Task<bool> SubscribeToEventAsync<T> (Func<T, Task> handler) where T : class {
        try {
            var eventType = typeof (T).Name;
            _logger.LogInformation ("Subscribing to event type {EventType}", eventType);

            var genericHandler = new Func<object, Task> (async obj => {
                    if (obj is T typedObj)
                        await handler (typedObj);
                });

            _eventHandlers.AddOrUpdate (eventType,
                new List<Func<object, Task>> { genericHandler },
                (key, existing) => {
                    existing.Add (genericHandler);
                    return existing;
                });

            _statistics.ActiveSubscriptions++;
            _statistics.LastUpdated = DateTime.UtcNow;

            return true;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to subscribe to event type {EventType}", typeof (T).Name);
            return false;
        }
    }

    public async Task<bool> UnsubscribeFromEventAsync<T> () where T : class {
        try {
            var eventType = typeof (T).Name;
            _logger.LogInformation ("Unsubscribing from event type {EventType}", eventType);

            if (_eventHandlers.TryRemove (eventType, out var handlers)) {
                _statistics.ActiveSubscriptions -= handlers.Count;
                _statistics.LastUpdated = DateTime.UtcNow;
                return true;
            }

            return false;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to unsubscribe from event type {EventType}", typeof (T).Name);
            return false;
        }
    }

    public async Task<EventStatistics> GetEventStatisticsAsync () {
        _statistics.LastUpdated = DateTime.UtcNow;

        // Calculate success rate
        var totalProcessed = _statistics.TotalEventsProcessed;
        if (totalProcessed > 0) {
            _statistics.EventProcessingSuccessRate =
                (double) (totalProcessed - _statistics.FailedEvents) / totalProcessed * 100;
        }

        return _statistics;
    }

    public async Task<bool> PublishProcessingEventAsync (ProcessingEvent processingEvent, CancellationToken cancellationToken = default) {
        try {
            _logger.LogDebug ("Publishing processing event {EventId} of type {EventType}",
                processingEvent.EventId, processingEvent.EventType);

            // Find handlers for this event type
            var matchingHandlers = _processingEventHandlers
                .Where (kvp => kvp.Key.Contains (processingEvent.EventType) || kvp.Key == "*")
                .Select (kvp => kvp.Value);

            var tasks = matchingHandlers.Select (handler => handler (processingEvent));
            await Task.WhenAll (tasks);

            _statistics.TotalEventsPublished++;
            UpdateEventTypeStatistics (processingEvent.EventType);
            _statistics.LastUpdated = DateTime.UtcNow;

            return true;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to publish processing event {EventId}", processingEvent.EventId);
            _statistics.FailedEvents++;
            return false;
        }
    }

    public async Task<string> SubscribeToProcessingEventsAsync (IEnumerable<string> eventTypes, Func<ProcessingEvent, Task> handler) {
        try {
            var subscriptionId = Guid.NewGuid ().ToString ();
            var eventTypesArray = eventTypes.ToArray ();

            _logger.LogInformation ("Creating processing event subscription {SubscriptionId} for types: {EventTypes}",
                subscriptionId, string.Join (", ", eventTypesArray));

            foreach (var eventType in eventTypesArray) {
                _processingEventHandlers.TryAdd ($"{subscriptionId}:{eventType}", handler);
            }

            _statistics.ActiveSubscriptions++;
            UpdateSubscriptionStatistics (eventTypesArray);
            _statistics.LastUpdated = DateTime.UtcNow;

            return subscriptionId;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to subscribe to processing events");
            throw;
        }
    }

    public async Task<bool> UnsubscribeFromProcessingEventsAsync (string subscriptionId) {
        try {
            _logger.LogInformation ("Unsubscribing from processing events: {SubscriptionId}", subscriptionId);

            var removedCount = 0;
            var keysToRemove = _processingEventHandlers.Keys
                .Where (key => key.StartsWith ($"{subscriptionId}:"))
                .ToArray ();

            foreach (var key in keysToRemove) {
                if (_processingEventHandlers.TryRemove (key, out _)) {
                    removedCount++;
                }
            }

            if (removedCount > 0) {
                _statistics.ActiveSubscriptions -= removedCount;
                _statistics.LastUpdated = DateTime.UtcNow;
            }

            return removedCount > 0;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to unsubscribe from processing events: {SubscriptionId}", subscriptionId);
            return false;
        }
    }

    private void UpdateEventTypeStatistics (string eventType) {
        if (!_statistics.EventsByType.ContainsKey (eventType))
            _statistics.EventsByType[eventType] = 0;

        _statistics.EventsByType[eventType]++;
    }

    private void UpdateSubscriptionStatistics (string[] eventTypes) {
        foreach (var eventType in eventTypes) {
            if (!_statistics.SubscriptionsByType.ContainsKey (eventType))
                _statistics.SubscriptionsByType[eventType] = 0;

            _statistics.SubscriptionsByType[eventType]++;
        }
    }
}