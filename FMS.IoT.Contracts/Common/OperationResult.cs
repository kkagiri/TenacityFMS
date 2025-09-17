namespace FMS.IoT.Contracts.Common;

/// <summary>
/// Common result wrapper for operations
/// </summary>
public class OperationResult<T> {
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> Errors { get; set; } = new ();
    public Dictionary<string, object> Metadata { get; set; } = new ();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static OperationResult<T> SuccessResult (T data) => new () {
        Success = true,
        Data = data
    };

    public static OperationResult<T> FailureResult (string error) => new () {
        Success = false,
        ErrorMessage = error
    };

    public static OperationResult<T> FailureResult (List<string> errors) => new () {
        Success = false,
        Errors = errors
    };
}