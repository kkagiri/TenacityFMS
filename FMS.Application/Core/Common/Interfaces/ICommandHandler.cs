using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Core.Common.Responses;

namespace FMS.Application.Core.Common.Interfaces {
    /// <summary>
    /// Base interface for all command handlers
    /// </summary>
    /// <typeparam name="TCommand">The type of command to handle</typeparam>
    /// <typeparam name="TResponse">The type of response to return</typeparam>
    public interface ICommandHandler<in TCommand, TResponse>
        where TCommand : ICommand<TResponse> {
            /// <summary>
            /// Handles the specified command.
            /// </summary>
            /// <param name="command">The command to handle</param>
            /// <param name="cancellationToken">Cancellation token</param>
            /// <returns>A task representing the asynchronous operation with the command result</returns>
            Task<FMSResponse<TResponse>> Handle (TCommand command, CancellationToken cancellationToken = default);
        }

    /// <summary>
    /// Base interface for all command handlers without a specific return value
    /// </summary>
    /// <typeparam name="TCommand">The type of command to handle</typeparam>
    public interface ICommandHandler<in TCommand>
        where TCommand : ICommand {
            /// <summary>
            /// Handles the specified command.
            /// </summary>
            /// <param name="command">The command to handle</param>
            /// <param name="cancellationToken">Cancellation token</param>
            /// <returns>A task representing the asynchronous operation</returns>
            Task<FMSResponse> Handle (TCommand command, CancellationToken cancellationToken = default);
        }
}