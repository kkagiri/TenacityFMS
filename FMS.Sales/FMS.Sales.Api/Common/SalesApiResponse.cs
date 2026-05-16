using System.Collections.Generic;

namespace FMS.Sales.Api.Common
{
    public sealed record SalesApiResponse<T>(
        bool Success,
        string Message,
        T? Data,
        IReadOnlyList<string>? Errors = null)
    {
        public static SalesApiResponse<T> Ok(T data, string message = "OK")
            => new(true, message, data);

        public static SalesApiResponse<T> NotFoundResult(string message)
            => new(false, message, default);

        public static SalesApiResponse<T> Error(string message, IReadOnlyList<string>? errors = null)
            => new(false, message, default, errors);
    }
}
