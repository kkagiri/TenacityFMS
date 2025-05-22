using System;

namespace FMS.Application.Core.Common.Interfaces {
    /// <summary>
    /// Base interface for all commands with a specific return type
    /// </summary>
    /// <typeparam name="TResponse">The type of response to return</typeparam>
    public interface ICommand<out TResponse> { }

    /// <summary>
    /// Base interface for all commands without a specific return value
    /// </summary>
    public interface ICommand { }
}