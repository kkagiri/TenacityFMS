using FMS.IoT.Contracts.Common;
using FMS.IoT.Contracts.Gateway.Models;
using FMS.IoT.Contracts.ProcessingEngine.Interfaces;
using FMS.IoT.Contracts.ProcessingEngine.Models;
using Microsoft.Extensions.Logging;

namespace FMS.IoT.ProcessingEngine.Services;

/// <summary>
/// Core message processing service
/// </summary>
public class MessageProcessingService : IMessageProcessor {
    private readonly ILogger<MessageProcessingService> _logger;
    private readonly IDataTransformer _dataTransformer;
    private readonly IEventProcessor _eventProcessor;
    private readonly ProcessingStatistics _statistics;

    public MessageProcessingService (
        ILogger<MessageProcessingService> logger,
        IDataTransformer dataTransformer,
        IEventProcessor eventProcessor) {
        _logger = logger;
        _dataTransformer = dataTransformer;
        _eventProcessor = eventProcessor;
        _statistics = new ProcessingStatistics {
            LastUpdated = DateTime.UtcNow
        };
    }

    public async Task<ProcessingResult> ProcessMessageAsync (DeviceMessage message, CancellationToken cancellationToken = default) {
        var startTime = DateTime.UtcNow;

        try {
            _logger.LogInformation ("Processing message {MessageId} from device {DeviceId}",
                message.MessageId, message.DeviceId);

            // Validate message
            var validationResult = await ValidateMessageAsync (message);
            if (!validationResult.Success) {
                return validationResult;
            }

            // Process based on message type
            var result = message.MessageType
            switch {
                IoTConstants.MessageTypes.Telemetry => await ProcessTelemetryMessageAsync (message, cancellationToken),
                IoTConstants.MessageTypes.Event => await ProcessEventMessageAsync (message, cancellationToken),
                IoTConstants.MessageTypes.Heartbeat => await ProcessHeartbeatMessageAsync (message, cancellationToken),
                _ => new ProcessingResult {
                Success = false,
                Error = $"Unsupported message type: {message.MessageType}",
                ProcessedAt = DateTime.UtcNow
                }
            };

            // Update statistics
            UpdateStatistics (result.Success, DateTime.UtcNow - startTime, message.MessageType);

            return result;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to process message {MessageId}", message.MessageId);
            UpdateStatistics (false, DateTime.UtcNow - startTime, message.MessageType);

            return new ProcessingResult {
                Success = false,
                    Error = ex.Message,
                    Exception = ex,
                    ProcessedAt = DateTime.UtcNow,
                    ProcessingDuration = DateTime.UtcNow - startTime
            };
        }
    }

    public async Task<CommandResult> ProcessCommandAsync (DeviceCommand command, CancellationToken cancellationToken = default) {
        var startTime = DateTime.UtcNow;

        try {
            _logger.LogInformation ("Processing command {CommandId} for device {DeviceId}",
                command.CommandId, command.DeviceId);

            // TODO: Implement command processing logic
            await Task.Delay (100, cancellationToken); // Simulate processing

            return new CommandResult {
                Success = true,
                    CommandId = command.CommandId,
                    DeviceId = command.DeviceId,
                    ExecutedAt = DateTime.UtcNow,
                    ExecutionDuration = DateTime.UtcNow - startTime,
                    Status = CommandStatus.Completed
            };
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to process command {CommandId}", command.CommandId);

            return new CommandResult {
                Success = false,
                    Error = ex.Message,
                    CommandId = command.CommandId,
                    DeviceId = command.DeviceId,
                    ExecutedAt = DateTime.UtcNow,
                    ExecutionDuration = DateTime.UtcNow - startTime,
                    Status = CommandStatus.Failed
            };
        }
    }

    public async Task<ProcessingStatistics> GetStatisticsAsync () {
        _statistics.LastUpdated = DateTime.UtcNow;
        return _statistics;
    }

    public async Task<ProcessingResult> ValidateMessageAsync (DeviceMessage message) {
        var errors = new List<string> ();

        if (string.IsNullOrEmpty (message.DeviceId))
            errors.Add ("DeviceId is required");

        if (string.IsNullOrEmpty (message.MessageId))
            errors.Add ("MessageId is required");

        if (message.Timestamp == default)
            errors.Add ("Timestamp is required");

        return new ProcessingResult {
            Success = errors.Count == 0,
                ValidationErrors = errors,
                ProcessedAt = DateTime.UtcNow
        };
    }

    public IEnumerable<string> GetSupportedMessageTypes () {
        return new [] {
            IoTConstants.MessageTypes.Telemetry,
                IoTConstants.MessageTypes.Event,
                IoTConstants.MessageTypes.Heartbeat,
                IoTConstants.MessageTypes.Alert
        };
    }

    public bool CanProcess (string messageType) {
        return GetSupportedMessageTypes ().Contains (messageType, StringComparer.OrdinalIgnoreCase);
    }

    private async Task<ProcessingResult> ProcessTelemetryMessageAsync (DeviceMessage message, CancellationToken cancellationToken) {
        // TODO: Implement telemetry processing logic
        _logger.LogDebug ("Processing telemetry message from device {DeviceId}", message.DeviceId);

        return new ProcessingResult {
            Success = true,
                ProcessedAt = DateTime.UtcNow,
                ProcessingDuration = TimeSpan.FromMilliseconds (50)
        };
    }

    private async Task<ProcessingResult> ProcessEventMessageAsync (DeviceMessage message, CancellationToken cancellationToken) {
        // TODO: Implement event processing logic
        _logger.LogDebug ("Processing event message from device {DeviceId}", message.DeviceId);

        return new ProcessingResult {
            Success = true,
                ProcessedAt = DateTime.UtcNow,
                ProcessingDuration = TimeSpan.FromMilliseconds (30)
        };
    }

    private async Task<ProcessingResult> ProcessHeartbeatMessageAsync (DeviceMessage message, CancellationToken cancellationToken) {
        // TODO: Implement heartbeat processing logic
        _logger.LogDebug ("Processing heartbeat message from device {DeviceId}", message.DeviceId);

        return new ProcessingResult {
            Success = true,
                ProcessedAt = DateTime.UtcNow,
                ProcessingDuration = TimeSpan.FromMilliseconds (10)
        };
    }

    private void UpdateStatistics (bool success, TimeSpan duration, string messageType) {
        _statistics.TotalMessagesProcessed++;

        if (success)
            _statistics.SuccessfulProcessing++;
        else
            _statistics.FailedProcessing++;

        // Update message type statistics
        if (!_statistics.ProcessingByMessageType.ContainsKey (messageType))
            _statistics.ProcessingByMessageType[messageType] = 0;

        _statistics.ProcessingByMessageType[messageType]++;

        // Calculate average processing time
        _statistics.AverageProcessingTimeMs =
            (_statistics.AverageProcessingTimeMs + duration.TotalMilliseconds) / 2;

        // Calculate success rate
        _statistics.ProcessingSuccessRate =
            (double) _statistics.SuccessfulProcessing / _statistics.TotalMessagesProcessed * 100;
    }
}