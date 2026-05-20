using FMS.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator;

internal static class OperatorResponseExtensions
{
    public static ActionResult<FMSResponse<T>> ToActionResult<T>(this ControllerBase controller, FMSResponse<T> response)
    {
        return controller.StatusCode(response.StatusCode, response);
    }
}
