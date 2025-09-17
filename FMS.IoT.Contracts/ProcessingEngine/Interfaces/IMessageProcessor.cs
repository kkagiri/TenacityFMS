using FMS.IoT.Contracts.Gateway.Models;
using FMS.IoT.Contracts.ProcessingEngine.Models;

namespace FMS.IoT.Contracts.ProcessingEngine.Interfaces;

/// <summary>
/// Core interface for message processing engine
/// </summary>
public interface IMessageProcessor {
    /// <summary>
    /// Processes a device message and returns the result
    /// </summary>
    Task<ProcessingResult> ProcessMessageAsync (DeviceMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Processes a device command and returns the result
    /// </summary>
    Task<CommandResult> ProcessCommandAsync (DeviceCommand command, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets processing statistics
    /// </summary>
    Task<ProcessingStatistics> GetStatisticsAsync ();

    /// <summary>
    /// Validates a message before processing
    /// </summary>
    Task<ProcessingResult> ValidateMessageAsync (DeviceMessage message);

    /// <summary>
    /// Gets supported message types
    /// </summary>
    IEnumerable<string> GetSupportedMessageTypes ();

    /// <summary>
    /// Checks if processor can handle the message type
    /// </summary>
    bool CanProcess (string messageType);
}