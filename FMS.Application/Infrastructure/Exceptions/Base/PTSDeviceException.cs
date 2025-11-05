//
// File: PTSDeviceException.cs
// Purpose: Base exception for PTS device-related errors with standardized ErrorType and error codes
// Dependencies: FMS.Application.Common.ErrorType, FMS.Application.Infrastructure.ErrorCodes.Common.PtsErrorCode
// Last Modified: 2025-11-05
//
// Key Members:
// - PTSDeviceException: Encapsulates device and system/network error contexts
// - SystemError(string): Factory for system errors
// - NetworkError(string): Factory for network connectivity errors
// - DeviceError(string, PtsErrorCode): Factory for device-specific faults

using System;
using FMS.Application.Common;
using FMS.Application.Infrastructure.ErrorCodes.Common;

namespace FMS.Application.Infrastructure.Expections.Base;

public class PTSDeviceException : Exception
{

    public PtsErrorCode ErrorCode { get; }
    public ErrorType ErrorType { get; }

    public PTSDeviceException(string message, PtsErrorCode errorCode = PtsErrorCode.UNKNOWN_ERROR) : base(message)
    {
        ErrorCode = errorCode;
        ErrorType = ErrorType.DeviceError;
    }

    public PTSDeviceException(string message, ErrorType errorType) : base(message)
    {
        ErrorCode = PtsErrorCode.UNKNOWN_ERROR;
        ErrorType = errorType;
    }

    public PTSDeviceException(string message, PtsErrorCode errorCode, Exception innerException) : base(message, innerException)
    {
        ErrorCode = errorCode;
        ErrorType = ErrorType.DeviceError;
    }

    public PTSDeviceException(string message, ErrorType errorType, Exception innerException) : base(message, innerException)
    {
        ErrorCode = PtsErrorCode.UNKNOWN_ERROR;
        ErrorType = errorType;
    }

    public static PTSDeviceException SystemError(string message) => new PTSDeviceException(message, ErrorType.SystemError);

    public static PTSDeviceException NetworkError(string message) => new PTSDeviceException(message, ErrorType.NetworkError);

    public static PTSDeviceException DeviceError(string message, PtsErrorCode errorCode = PtsErrorCode.UNKNOWN_ERROR) => new PTSDeviceException(message, errorCode);

}