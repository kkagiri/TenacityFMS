using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Core.Common.Responses;

namespace FMS.Application.Core.Common.Interfaces {
    /// <summary>
    /// Base interface for all query handlers
    /// </summary>
    /// <typeparam name="TQuery">The type of query to handle</typeparam>
    /// <typeparam name="TResponse">The type of response to return</typeparam>
    public interface IQueryHandler<in TQuery, TResponse>
        where TQuery : IQuery<TResponse> {
            /// <summary>
            /// Handles the specified query.
            /// </summary>
            /// <param name="query">The query to handle</param>
            /// <param name="cancellationToken">Cancellation token</param>
            /// <returns>A task representing the asynchronous operation with the query result</returns>
            Task<FMSResponse<TResponse>> Handle (TQuery query, CancellationToken cancellationToken = default);
        }
}