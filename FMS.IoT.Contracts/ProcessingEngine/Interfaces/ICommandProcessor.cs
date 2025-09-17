using System.Runtime.CompilerServices;
using FMS.IoT.Contracts.ProcessingEngine.Models;

namespace FMS.IoT.Contracts.ProcessingEngine.Interfaces;

/// <summary>
/// Interface for command processing
/// </summary>
public interface ICommandProcessor {
    /// <summary>
    /// Executes a command against a device
    /// </summary>
    Task<CommandResult> ExecuteCommandAsync (DeviceCommand command, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets pending commands for a device
    /// </summary>
    IAsyncEnumerable<DeviceCommand> GetPendingCommandsAsync (string deviceId, [EnumeratorCancellation] CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancels a pending command
    /// </summary>
    Task<bool> CancelCommandAsync (string commandId);

    /// <summary>
    /// Gets command execution history
    /// </summary>
    Task<IEnumerable<CommandResult>> GetCommandHistoryAsync (string deviceId, DateTime? since = null);

    /// <summary>
    /// Queues a command for later execution
    /// </summary>
    Task<string> QueueCommandAsync (DeviceCommand command);

    /// <summary>
    /// Gets command queue statistics
    /// </summary>
    Task<CommandQueueStatistics> GetQueueStatisticsAsync ();
}