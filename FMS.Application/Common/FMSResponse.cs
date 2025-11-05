using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Common {
    /// <summary>
    /// DEPRECATED: Use FMSResponse instead for new development
    /// Legacy record-based response - kept for backward compatibility
    /// </summary>
    [Obsolete ("Use FMSResponse instead. This will be removed in a future version.", false)]
    public record FMSResponseMessage (bool Success, string Message);

    /// <summary>
    /// DEPRECATED: Use FMSResponse<T> instead for new development
    /// Legacy generic record-based response - kept for backward compatibility
    /// </summary>
    [Obsolete ("Use FMSResponse<T> instead. This will be removed in a future version.", false)]
    public record FMSResponseMessage<T> (bool Success, string Message, T Data) : FMSResponseMessage (Success, Message);

    /// <summary>
    /// Enumeration for categorizing different types of errors/responses
    /// Maps to HTTP status codes for consistent API responses
    /// </summary>
    public enum ErrorType {
        /// <summary>No error - successful operation (HTTP 200)</summary>
        None,

        /// <summary>Input validation failed (HTTP 400)</summary>
        Validation,

        /// <summary>Authentication required or failed (HTTP 401)</summary>
        Unauthorized,

        /// <summary>Insufficient permissions (HTTP 403)</summary>
        Forbidden,

        /// <summary>Resource not found (HTTP 404)</summary>
        NotFound,

        /// <summary>Resource conflict, e.g., duplicate entry (HTTP 409)</summary>
        Conflict,

        /// <summary>Business logic/rule violation (HTTP 422)</summary>
        BusinessLogic,

        /// <summary>Too many requests - rate limit exceeded (HTTP 429)</summary>
        TooManyRequests,

        /// <summary>System/server error (HTTP 500)</summary>
        SystemError,

        /// <summary>Service temporarily unavailable (HTTP 503)</summary>
        ServiceUnavailable,

        /// <summary>Device/hardware related error (HTTP 503)</summary>
        DeviceError,

        /// <summary>Network connectivity error (HTTP 503)</summary>
        NetworkError
    }

    /// <summary>
    /// Standard API response wrapper for FMS operations
    /// Provides consistent response structure across all API endpoints
    /// </summary>
    public class FMSResponse {
        // ========== Core Properties (Existing) ==========
        /// <summary>Indicates if the operation was successful</summary>
        public bool IsSuccess { get; set; }

        /// <summary>Human-readable message describing the result</summary>
        public string Message { get; set; }

        /// <summary>List of validation error messages</summary>
        public List<string> ValidationErrors { get; set; } = new List<string> ();

        /// <summary>Type of error that occurred (if any)</summary>
        public ErrorType ErrorType { get; set; } = ErrorType.None;

        // ========== Phase 1: Essential Additions ==========
        /// <summary>HTTP status code for the response</summary>
        public int StatusCode { get; set; } = 200;

        /// <summary>Machine-readable error code for programmatic error handling</summary>
        public string ErrorCode { get; set; }

        /// <summary>UTC timestamp when the response was generated</summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>Unique identifier for this specific request</summary>
        public string RequestId { get; set; }

        /// <summary>Correlation ID for tracking requests across distributed systems</summary>
        public string CorrelationId { get; set; }

        // ========== Phase 2: Enhanced Features ==========
        /// <summary>API endpoint path that generated this response</summary>
        public string Path { get; set; }

        /// <summary>HTTP method used for the request</summary>
        public string Method { get; set; }

        /// <summary>Non-critical warning messages</summary>
        public List<string> Warnings { get; set; } = new List<string> ();

        /// <summary>Debug information (only populated in Development environment)</summary>
        public object DebugInfo { get; set; }

        // ========== Phase 3: Advanced Features ==========
        /// <summary>Additional metadata for extensibility</summary>
        public Dictionary<string, object> Metadata { get; set; }

        // ========== Constructors ==========
        public FMSResponse () { }

        public FMSResponse (bool success, string message) {
            IsSuccess = success;
            Message = message;
            StatusCode = success ? 200 : 400;
        }

        public FMSResponse (bool success, string message, int statusCode) {
            IsSuccess = success;
            Message = message;
            StatusCode = statusCode;
        }

        // ========== Factory Methods ==========

        /// <summary>Creates a successful response</summary>
        public static FMSResponse SuccessResponse (string message = "Operation completed successfully") {
            return new FMSResponse {
                IsSuccess = true,
                Message = message,
                StatusCode = 200,
                ErrorType = ErrorType.None
            };
        }

        /// <summary>Creates a failed response (generic failure)</summary>
        public static FMSResponse FailedResponse (string message = "Operation failed", string errorCode = null) {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                StatusCode = 400,
                ErrorType = ErrorType.Validation
            };
        }

        /// <summary>Creates a validation failed response</summary>
        public static FMSResponse ValidationFailed (List<string> errors, string errorCode = "VALIDATION_FAILED") {
            return new FMSResponse {
                IsSuccess = false,
                Message = "Validation failed",
                ValidationErrors = errors,
                ErrorType = ErrorType.Validation,
                ErrorCode = errorCode,
                StatusCode = 400
            };
        }

        /// <summary>Creates a not found response (HTTP 404)</summary>
        public static FMSResponse NotFound (string errorCode, string message = "Resource not found") {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.NotFound,
                StatusCode = 404
            };
        }

        /// <summary>Creates an unauthorized response (HTTP 401)</summary>
        public static FMSResponse Unauthorized (string errorCode = "UNAUTHORIZED", string message = "Authentication required") {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.Unauthorized,
                StatusCode = 401
            };
        }

        /// <summary>Creates a forbidden response (HTTP 403)</summary>
        public static FMSResponse Forbidden (string errorCode = "FORBIDDEN", string message = "Insufficient permissions") {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.Forbidden,
                StatusCode = 403
            };
        }

        /// <summary>Creates a conflict response (HTTP 409)</summary>
        public static FMSResponse Conflict (string errorCode, string message = "Resource conflict") {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.Conflict,
                StatusCode = 409
            };
        }

        /// <summary>Creates a business logic error response (HTTP 422)</summary>
        public static FMSResponse BusinessLogicError (string errorCode, string message) {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.BusinessLogic,
                StatusCode = 422
            };
        }

        /// <summary>Creates a system error response (HTTP 500)</summary>
        public static FMSResponse SystemError (string message = "System error occurred", string errorCode = "SYSTEM_ERROR") {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.SystemError,
                StatusCode = 500
            };
        }

        /// <summary>Creates a device error response (HTTP 503)</summary>
        public static FMSResponse DeviceError (string message = "Device error occurred", string errorCode = "DEVICE_ERROR") {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.DeviceError,
                StatusCode = 503
            };
        }

        /// <summary>Creates a network error response (HTTP 503)</summary>
        public static FMSResponse NetworkError (string message = "Network error occurred", string errorCode = "NETWORK_ERROR") {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.NetworkError,
                StatusCode = 503
            };
        }

        /// <summary>Creates a service unavailable response (HTTP 503)</summary>
        public static FMSResponse ServiceUnavailable (string message = "Service temporarily unavailable", string errorCode = "SERVICE_UNAVAILABLE") {
            return new FMSResponse {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                ErrorType = ErrorType.ServiceUnavailable,
                StatusCode = 503
            };
        }

        // ========== Helper Methods ==========

        /// <summary>Adds a warning message to the response</summary>
        public FMSResponse AddWarning (string warning) {
            Warnings.Add (warning);
            return this;
        }

        /// <summary>Sets debug information (should only be used in Development environment)</summary>
        public FMSResponse WithDebugInfo (object debugInfo) {
            DebugInfo = debugInfo;
            return this;
        }

        /// <summary>Sets request tracking information</summary>
        public FMSResponse WithRequestTracking (string requestId, string correlationId = null) {
            RequestId = requestId;
            CorrelationId = correlationId ?? requestId;
            return this;
        }

        /// <summary>Sets the API path and method</summary>
        public FMSResponse WithPath (string path, string method = null) {
            Path = path;
            Method = method;
            return this;
        }

        /// <summary>Adds metadata to the response</summary>
        public FMSResponse AddMetadata (string key, object value) {
            if (Metadata == null)
                Metadata = new Dictionary<string, object> ();
            Metadata[key] = value;
            return this;
        }
    }

    /// <summary>
    /// Generic API response wrapper with typed data
    /// </summary>
    public class FMSResponse<T> : FMSResponse {
        /// <summary>Response data payload</summary>
        public T Data { get; set; }

        // ========== Constructors ==========
        public FMSResponse () : base () { }

        public FMSResponse (bool success, string message, T data) : base (success, message) {
            Data = data;
        }

        public FMSResponse (bool success, string message, T data, int statusCode) : base (success, message, statusCode) {
            Data = data;
        }

        // ========== Factory Methods ==========

        /// <summary>Creates a successful response with data</summary>
        public static FMSResponse<T> Success (T data, string message = "Operation completed successfully") {
            return new FMSResponse<T> {
                IsSuccess = true,
                Message = message,
                Data = data,
                StatusCode = 200,
                ErrorType = ErrorType.None
            };
        }

        /// <summary>Creates a failed response with optional error code</summary>
        public static FMSResponse<T> Failed (string message = "Operation failed", string errorCode = null) {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                StatusCode = 400,
                ErrorType = ErrorType.Validation
            };
        }

        /// <summary>Creates a validation failed response</summary>
        public static FMSResponse<T> ValidationFailed (List<string> errors, string errorCode = "VALIDATION_FAILED") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = "Validation failed",
                ValidationErrors = errors,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.Validation,
                StatusCode = 400
            };
        }

        /// <summary>Creates a validation failed response with detailed error data</summary>
        public static FMSResponse<TData> ValidationFailedWithData<TData> (List<string> summaryErrors, TData detailedErrorData, string errorCode = "VALIDATION_FAILED") {
            return new FMSResponse<TData> {
                IsSuccess = false,
                Message = "Validation failed",
                ValidationErrors = summaryErrors,
                ErrorCode = errorCode,
                Data = detailedErrorData,
                ErrorType = ErrorType.Validation,
                StatusCode = 400
            };
        }

        /// <summary>Creates a not found response (HTTP 404)</summary>
        public static FMSResponse<T> NotFound (string errorCode, string message = "Resource not found") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.NotFound,
                StatusCode = 404
            };
        }

        /// <summary>Creates an unauthorized response (HTTP 401)</summary>
        public static FMSResponse<T> Unauthorized (string errorCode = "UNAUTHORIZED", string message = "Authentication required") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.Unauthorized,
                StatusCode = 401
            };
        }

        /// <summary>Creates a forbidden response (HTTP 403)</summary>
        public static FMSResponse<T> Forbidden (string errorCode = "FORBIDDEN", string message = "Insufficient permissions") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.Forbidden,
                StatusCode = 403
            };
        }

        /// <summary>Creates a conflict response (HTTP 409)</summary>
        public static FMSResponse<T> Conflict (string errorCode, string message = "Resource conflict") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.Conflict,
                StatusCode = 409
            };
        }

        /// <summary>Creates a business logic error response (HTTP 422)</summary>
        public static FMSResponse<T> BusinessLogicError (string errorCode, string message) {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.BusinessLogic,
                StatusCode = 422
            };
        }

        /// <summary>Creates a system error response (HTTP 500)</summary>
        public static FMSResponse<T> SystemError (string message = "System error occurred", string errorCode = "SYSTEM_ERROR") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.SystemError,
                StatusCode = 500
            };
        }

        /// <summary>Creates a device error response (HTTP 503)</summary>
        public static FMSResponse<T> DeviceError (string message = "Device error occurred", string errorCode = "DEVICE_ERROR") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.DeviceError,
                StatusCode = 503
            };
        }

        /// <summary>Creates a network error response (HTTP 503)</summary>
        public static FMSResponse<T> NetworkError (string message = "Network error occurred", string errorCode = "NETWORK_ERROR") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.NetworkError,
                StatusCode = 503
            };
        }

        /// <summary>Creates a service unavailable response (HTTP 503)</summary>
        public static FMSResponse<T> ServiceUnavailable (string message = "Service temporarily unavailable", string errorCode = "SERVICE_UNAVAILABLE") {
            return new FMSResponse<T> {
                IsSuccess = false,
                Message = message,
                ErrorCode = errorCode,
                Data = default,
                ErrorType = ErrorType.ServiceUnavailable,
                StatusCode = 503
            };
        }

        // ========== Helper Methods ==========

        /// <summary>Adds a warning message to the response</summary>
        public new FMSResponse<T> AddWarning (string warning) {
            Warnings.Add (warning);
            return this;
        }

        /// <summary>Sets debug information (should only be used in Development environment)</summary>
        public new FMSResponse<T> WithDebugInfo (object debugInfo) {
            DebugInfo = debugInfo;
            return this;
        }

        /// <summary>Sets request tracking information</summary>
        public new FMSResponse<T> WithRequestTracking (string requestId, string correlationId = null) {
            RequestId = requestId;
            CorrelationId = correlationId ?? requestId;
            return this;
        }

        /// <summary>Sets the API path and method</summary>
        public new FMSResponse<T> WithPath (string path, string method = null) {
            Path = path;
            Method = method;
            return this;
        }

        /// <summary>Adds metadata to the response</summary>
        public new FMSResponse<T> AddMetadata (string key, object value) {
            if (Metadata == null)
                Metadata = new Dictionary<string, object> ();
            Metadata[key] = value;
            return this;
        }
    }

    /// <summary>
    /// Pagination metadata for list responses
    /// </summary>
    public class PaginationMetadata {
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int) Math.Ceiling (TotalCount / (double) PageSize) : 0;
        public bool HasPrevious => PageNumber > 1;
        public bool HasNext => PageNumber < TotalPages;
    }

    /// <summary>
    /// Paginated API response with metadata
    /// </summary>
    public class FMSPagedResponse<T> : FMSResponse<T> {
        /// <summary>Pagination metadata</summary>
        public PaginationMetadata Pagination { get; set; }

        /// <summary>Creates a successful paginated response</summary>
        public static FMSPagedResponse<T> Success (T data, int pageNumber, int pageSize, int totalCount, string message = "Operation completed successfully") {
            return new FMSPagedResponse<T> {
                IsSuccess = true,
                Message = message,
                Data = data,
                StatusCode = 200,
                ErrorType = ErrorType.None,
                Pagination = new PaginationMetadata {
                    TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize
                }
            };
        }
    }

    /// <summary>
    /// Helper class for HTTP status code mapping
    /// </summary>
    public static class FMSResponseHelper {
        /// <summary>Maps ErrorType to HTTP status code</summary>
        public static int GetHttpStatusCode (ErrorType errorType) {
            return errorType switch {
                ErrorType.None => 200, // OK
                ErrorType.Validation => 400, // Bad Request
                ErrorType.Unauthorized => 401, // Unauthorized
                ErrorType.Forbidden => 403, // Forbidden
                ErrorType.NotFound => 404, // Not Found
                ErrorType.Conflict => 409, // Conflict
                ErrorType.BusinessLogic => 422, // Unprocessable Entity
                ErrorType.TooManyRequests => 429, // Too Many Requests
                ErrorType.SystemError => 500, // Internal Server Error
                ErrorType.ServiceUnavailable => 503, // Service Unavailable
                ErrorType.DeviceError => 503, // Service Unavailable
                ErrorType.NetworkError => 503, // Service Unavailable
                _ => 500
            };
        }
    }
}