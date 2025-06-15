using System;
using FMS.Application.Common;
using FMS.Application.Infrastructure.ErrorCodes.Common;

namespace FMS.Application.Infrastructure.Expections.Base;

public class PTSDeviceException : Exception {

    public PtsErrorCode ErrorCode { get; }
    public ErrorType ErrorType { get; }

    public PTSDeviceException (string message, PtsErrorCode errorCode = PtsErrorCode.UNKNOWN_ERROR) : base (message) {
        ErrorCode = errorCode;
        ErrorType = ErrorType.DeviceError;
    }

    public PTSDeviceException (string message, ErrorType errorType) : base (message) {
        ErrorCode = PtsErrorCode.UNKNOWN_ERROR;
        ErrorType = errorType;
    }

    public PTSDeviceException (string message, PtsErrorCode errorCode, Exception innerException) : base (message, innerException) {
        ErrorCode = errorCode;
        ErrorType = ErrorType.DeviceError;
    }

    public PTSDeviceException (string message, ErrorType errorType, Exception innerException) : base (message, innerException) {
        ErrorCode = PtsErrorCode.UNKNOWN_ERROR;
        ErrorType = errorType;
    }

    public static PTSDeviceException SystemError (string message) => new PTSDeviceException (message, ErrorType.SystemError);

    public static PTSDeviceException NetworkError (string message) => new PTSDeviceException (message, ErrorType.Network);

    public static PTSDeviceException DeviceError (string message, PtsErrorCode errorCode = PtsErrorCode.UNKNOWN_ERROR) => new PTSDeviceException (message, errorCode);

}