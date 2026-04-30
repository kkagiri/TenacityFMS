/*
 * File:          SalesResult.cs
 * Purpose:       Lightweight result wrapper for Sales CQRS handlers, mirroring
 *                FMSResponse but kept inside the bounded context so the Sales
 *                projects never reference FMS.Application.
 * Last Modified: 2026-04-29
 */
namespace FMS.Sales.Application.Common;

public class SalesResult
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public IReadOnlyList<string>? Errors { get; init; }

    public static SalesResult Ok() => new() { Success = true };
    public static SalesResult Fail(string error) => new() { Success = false, Error = error };
    public static SalesResult Fail(IEnumerable<string> errors) =>
        new() { Success = false, Errors = errors.ToArray() };
}

public class SalesResult<T> : SalesResult
{
    public T? Data { get; init; }

    public static SalesResult<T> Ok(T data) => new() { Success = true, Data = data };
    public new static SalesResult<T> Fail(string error) => new() { Success = false, Error = error };
    public new static SalesResult<T> Fail(IEnumerable<string> errors) =>
        new() { Success = false, Errors = errors.ToArray() };
}
