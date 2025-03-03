using FMS.Application.Infrastructure.ErrorCodes.Common;
using System;

namespace FMS.Application.Infrastructure.Expections.Base;

public class PTSDeviceException : Exception
{

    public PtsErrorCode ErrorCode { get; }


    public PTSDeviceException(string message, PtsErrorCode errorCode = PtsErrorCode.UNKNOWN_ERROR)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public PTSDeviceException(string message, PtsErrorCode errorCode, Exception innerException)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }


}