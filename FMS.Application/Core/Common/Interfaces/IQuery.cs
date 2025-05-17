using System;

namespace FMS.Application.Core.Common.Interfaces {
    /// <summary>
    /// Base interface for all queries
    /// </summary>
    /// <typeparam name="TResponse">The type of response to return</typeparam>
    public interface IQuery<out TResponse> { }
}