using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using FMS.IoT.Contracts.ProcessingEngine.Interfaces;
using FMS.IoT.Contracts.ProcessingEngine.Models;
using Microsoft.Extensions.Logging;

namespace FMS.IoT.ProcessingEngine.Commands;

/// <summary>
/// Command processing service implementation
/// </summary>
public class CommandProcessingService : ICommandProcessor {
    private readonly ILogger<CommandProcessingService> _logger;
    private readonly ConcurrentDictionary<string, DeviceCommand> _pendingCommands;
    private readonly List<CommandResult> _commandHistory;
    private readonly CommandQueueStatistics _queueStatistics;

    public CommandProcessingService (ILogger<CommandProcessingService> logger) {
        _logger = logger;
        _pendingCommands = new ConcurrentDictionary<string, DeviceCommand> ();
        _commandHistory = new List<CommandResult> ();
        _queueStatistics = new CommandQueueStatistics {
            LastUpdated = DateTime.UtcNow
        };
    }

    public async Task<CommandResult> ExecuteCommandAsync (DeviceCommand command, CancellationToken cancellationToken = default) {
        var startTime = DateTime.UtcNow;

        try {
            _logger.LogInformation ("Executing command {CommandId} of type {CommandType} for device {DeviceId}",
                command.CommandId, command.CommandType, command.DeviceId);

            // Remove from pending if it was queued
            _pendingCommands.TryRemove (command.CommandId, out _);

            // Update command status
            command.Status = CommandStatus.Executing;

            // Simulate command execution based on type
            var result = await ExecuteCommandByType (command, cancellationToken);

            // Add to history
            lock (_commandHistory) {
                _commandHistory.Add (result);

                // Keep only last 1000 commands in history
                if (_commandHistory.Count > 1000) {
                    _commandHistory.RemoveAt (0);
                }
            }

            // Update statistics
            UpdateQueueStatistics (result);

            return result;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to execute command {CommandId}", command.CommandId);

            var result = new CommandResult {
                Success = false,
                Error = ex.Message,
                CommandId = command.CommandId,
                DeviceId = command.DeviceId,
                ExecutedAt = DateTime.UtcNow,
                ExecutionDuration = DateTime.UtcNow - startTime,
                Status = CommandStatus.Failed
            };

            UpdateQueueStatistics (result);
            return result;
        }
    }

    public async IAsyncEnumerable<DeviceCommand> GetPendingCommandsAsync (
        string deviceId, [EnumeratorCancellation] CancellationToken cancellationToken = default) {
        var deviceCommands = _pendingCommands.Values
            .Where (cmd => cmd.DeviceId == deviceId)
            .OrderBy (cmd => cmd.Priority)
            .ThenBy (cmd => cmd.CreatedAt);

        foreach (var command in deviceCommands) {
            if (cancellationToken.IsCancellationRequested)
                yield break;

            yield return command;
        }
    }

    public async Task<bool> CancelCommandAsync (string commandId) {
        try {
            if (_pendingCommands.TryRemove (commandId, out var command)) {
                _logger.LogInformation ("Cancelled command {CommandId}", commandId);

                command.Status = CommandStatus.Cancelled;

                var result = new CommandResult {
                    Success = false,
                    Error = "Command cancelled",
                    CommandId = commandId,
                    DeviceId = command.DeviceId,
                    ExecutedAt = DateTime.UtcNow,
                    Status = CommandStatus.Cancelled
                };

                lock (_commandHistory) {
                    _commandHistory.Add (result);
                }

                UpdateQueueStatistics (result);
                return true;
            }

            return false;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to cancel command {CommandId}", commandId);
            return false;
        }
    }

    public async Task<IEnumerable<CommandResult>> GetCommandHistoryAsync (string deviceId, DateTime? since = null) {
        lock (_commandHistory) {
            var query = _commandHistory.Where (cmd => cmd.DeviceId == deviceId);

            if (since.HasValue) {
                query = query.Where (cmd => cmd.ExecutedAt >= since.Value);
            }

            return query.OrderByDescending (cmd => cmd.ExecutedAt).ToList ();
        }
    }

    public async Task<string> QueueCommandAsync (DeviceCommand command) {
        try {
            _logger.LogInformation ("Queueing command {CommandId} for device {DeviceId}",
                command.CommandId, command.DeviceId);

            command.Status = CommandStatus.Queued;
            _pendingCommands.TryAdd (command.CommandId, command);

            _queueStatistics.TotalQueued++;
            UpdateCommandTypeStatistics (command.CommandType);
            _queueStatistics.LastUpdated = DateTime.UtcNow;

            return command.CommandId;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to queue command {CommandId}", command.CommandId);
            throw;
        }
    }

    public async Task<CommandQueueStatistics> GetQueueStatisticsAsync () {
        _queueStatistics.Processing = _pendingCommands.Count;
        _queueStatistics.LastUpdated = DateTime.UtcNow;

        // Calculate average execution time
        lock (_commandHistory) {
            if (_commandHistory.Count > 0) {
                var averageTicks = _commandHistory.Average (cmd => cmd.ExecutionDuration.Ticks);
                _queueStatistics.AverageExecutionTime = new TimeSpan ((long) averageTicks);
            }
        }

        return _queueStatistics;
    }

    private async Task<CommandResult> ExecuteCommandByType (DeviceCommand command, CancellationToken cancellationToken) {
        var startTime = DateTime.UtcNow;

        // Simulate different execution times based on command type
        var executionDelay = command.CommandType.ToLowerInvariant () switch {
            "restart" => 2000,
            "update" => 5000,
            "configure" => 1000,
            "ping" => 100,
            _ => 500
        };

        await Task.Delay (executionDelay, cancellationToken);

        return new CommandResult {
            Success = true,
                CommandId = command.CommandId,
                DeviceId = command.DeviceId,
                ExecutedAt = DateTime.UtcNow,
                ExecutionDuration = DateTime.UtcNow - startTime,
                Status = CommandStatus.Completed,
                DeviceResponse = $"Command {command.CommandType} executed successfully"
        };
    }

    private void UpdateQueueStatistics (CommandResult result) {
        if (result.Success)
            _queueStatistics.Completed++;
        else
            _queueStatistics.Failed++;

        UpdateCommandTypeStatistics (result.CommandId);
        _queueStatistics.LastUpdated = DateTime.UtcNow;
    }

    private void UpdateCommandTypeStatistics (string commandType) {
        if (!_queueStatistics.CommandsByType.ContainsKey (commandType))
            _queueStatistics.CommandsByType[commandType] = 0;

        _queueStatistics.CommandsByType[commandType]++;
    }
}