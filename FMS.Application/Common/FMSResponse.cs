using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Common {
    public record FMSResponseMessage (bool Success, string Message);
    public record FMSResponseMessage<T> (bool Success, string Message, T Data) : FMSResponseMessage (Success, Message);

    //Cursor: Add error type enumeration for better error categorization
    public enum ErrorType {
        None,
        Validation,
        SystemError,
        DeviceError,
        BusinessLogic,
        Network
    }

    public class FMSResponse {
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
        public List<string> ValidationErrors { get; set; } = new List<string> ();

        //Cursor: Add error type for better categorization
        public ErrorType ErrorType { get; set; } = ErrorType.None;

        public FMSResponse () { }

        public FMSResponse (bool success, string message) {
            IsSuccess = success;
            Message = message;
        }

        public static FMSResponse SuccessResponse (string message = "Operation completed successfully") {
            return new FMSResponse {
            IsSuccess = true,
            Message = message
            };
        }

        public static FMSResponse FailedResponse (string message = "Operation failed") {
            return new FMSResponse {
            IsSuccess = false,
            Message = message
            };
        }

        public static FMSResponse ValidationFailed (List<string> errors) {
            return new FMSResponse {
                IsSuccess = false,
                    Message = "Validation failed",
                    ValidationErrors = errors,
                    ErrorType = ErrorType.Validation
            };
        }

        //Cursor: Add methods for specific error types
        public static FMSResponse SystemError (string message = "System error occurred") {
            return new FMSResponse {
            IsSuccess = false,
            Message = message,
            ErrorType = ErrorType.SystemError
            };
        }

        public static FMSResponse DeviceError (string message = "Device error occurred") {
            return new FMSResponse {
            IsSuccess = false,
            Message = message,
            ErrorType = ErrorType.DeviceError
            };
        }

        public static FMSResponse NetworkError (string message = "Network error occurred") {
            return new FMSResponse {
            IsSuccess = false,
            Message = message,
            ErrorType = ErrorType.Network
            };
        }
    }

    public class FMSResponse<T> : FMSResponse {
        public T Data { get; set; }

        public FMSResponse () : base () { }

        public FMSResponse (bool success, string message, T data) : base (success, message) {
            Data = data;
        }

        public static FMSResponse<T> Success (T data, string message = "Operation completed successfully") {
            return new FMSResponse<T> (true, message, data);
        }

        public static FMSResponse<T> Failed (string message = "Operation failed") {
            return new FMSResponse<T> (false, message, default);
        }

        public static FMSResponse<T> ValidationFailed (List<string> errors) {
            var response = new FMSResponse<T> (false, "Validation failed", default);
            response.ValidationErrors = errors;
            response.ErrorType = ErrorType.Validation;
            return response;
        }

        //Cursor: New overload for ValidationFailed accepting detailed error data
        public static FMSResponse<TData> ValidationFailed<TData> (List<string> summaryErrors, TData detailedErrorData) {
            var response = new FMSResponse<TData> (false, "Validation failed", detailedErrorData);
            response.ValidationErrors = summaryErrors;
            response.ErrorType = ErrorType.Validation;
            return response;
        }

        //Cursor: Add typed error methods for generic responses
        public static FMSResponse<T> SystemError (string message = "System error occurred") {
            return new FMSResponse<T> {
            IsSuccess = false,
            Message = message,
            Data = default,
            ErrorType = ErrorType.SystemError
            };
        }

        public static FMSResponse<T> DeviceError (string message = "Device error occurred") {
            return new FMSResponse<T> {
            IsSuccess = false,
            Message = message,
            Data = default,
            ErrorType = ErrorType.DeviceError
            };
        }

        public static FMSResponse<T> NetworkError (string message = "Network error occurred") {
            return new FMSResponse<T> {
            IsSuccess = false,
            Message = message,
            Data = default,
            ErrorType = ErrorType.Network
            };
        }
    }
}