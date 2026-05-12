
using System;
using System.ComponentModel.DataAnnotations;
using System.Net.WebSockets;
using FMS.Application.Infrastructure.ErrorCodes.Common;
using FMS.Application.Infrastructure.Expections.Base;

namespace FMS.Application.Infrastructure.ErroCodeHanding.Common;

public static class ErrorCodeMapper
{
    public static (PtsErrorCode Code, string Message) MapException(Exception ex)
    {
        var errorCode = ex switch
        {
            ValidationException => PtsErrorCode.INVALID_JSON_REQUEST,
            OperationCanceledException => PtsErrorCode.JSONPTS_ERROR_POWER_DOWN_DETECTED,
            WebSocketException => PtsErrorCode.INIT_ERROR,
            TimeoutException => PtsErrorCode.TIMEOUT_ERROR,
            _ => PtsErrorCode.UNKNOWN_ERROR
        };

        return (errorCode, GetErrorMessage(errorCode, ex));
    }

    private static string GetErrorMessage(PtsErrorCode code, Exception ex)
    {
        return ex switch
        {
            // BasePTSException ptsEx => ptsEx.Message,
            _ => code.GetDescription()
        };
    }
}


