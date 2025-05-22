using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Core.Common.Responses {
    public record FMSResponseMessage (bool Success, string Message);
    public record FMSResponseMessage<T> (bool Success, string Message, T Data) : FMSResponseMessage (Success, Message);

    public class FMSResponse {
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
        public List<string> ValidationErrors { get; set; } = new List<string> ();

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
                    ValidationErrors = errors
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
            return response;
        }

        //Cursor: New overload for ValidationFailed accepting detailed error data
        public static FMSResponse<TData> ValidationFailed<TData> (List<string> summaryErrors, TData detailedErrorData) {
            var response = new FMSResponse<TData> (false, "Validation failed", detailedErrorData);
            response.ValidationErrors = summaryErrors;
            return response;
        }
    }
}