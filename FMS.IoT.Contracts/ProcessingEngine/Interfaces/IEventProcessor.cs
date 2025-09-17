using FMS.IoT.Contracts.ProcessingEngine.Models;

namespace FMS.IoT.Contracts.ProcessingEngine.Interfaces;

/// <summary>
/// Interface for event processing and publishing
/// </summary>
public interface IEventProcessor {
    /// <summary>
    /// Publishes an event to the event bus
    /// </summary>
    Task PublishEventAsync<T> (T eventData, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Subscribes to events of a specific type
    /// </summary>
    Task<bool> SubscribeToEventAsync<T> (Func<T, Task> handler) where T : class;

    /// <summary>
    /// Unsubscribes from events of a specific type
    /// </summary>
    Task<bool> UnsubscribeFromEventAsync<T> () where T : class;

    /// <summary>
    /// Gets event processing statistics
    /// </summary>
    Task<EventStatistics> GetEventStatisticsAsync ();

    /// <summary>
    /// Publishes a processing event
    /// </summary>
    Task<bool> PublishProcessingEventAsync (ProcessingEvent processingEvent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Subscribes to processing events
    /// </summary>
    Task<string> SubscribeToProcessingEventsAsync (IEnumerable<string> eventTypes, Func<ProcessingEvent, Task> handler);

    /// <summary>
    /// Unsubscribes from processing events
    /// </summary>
    Task<bool> UnsubscribeFromProcessingEventsAsync (string subscriptionId);
}