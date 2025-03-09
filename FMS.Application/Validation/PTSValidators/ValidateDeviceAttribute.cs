
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using FMS.Application.Validation.PTSValidators.Common;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using System;

namespace FMS.Application.Validation.PTSValidators;

public class ValidateDeviceAttribute : ActionFilterAttribute
{
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var deviceId = context.HttpContext.Request.Headers["X-Pts-Id"].ToString();
        var validator = context.HttpContext.RequestServices.GetRequiredService<IDeviceValidator>();
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<ValidateDeviceAttribute>>();


        try
        {
            var result = await validator.ValidateDevice(deviceId);
            if (!result.IsAllowed)
            {
                logger.LogWarning("Unauthorized device access attempt: {DeviceId}", deviceId);
                context.Result = new UnauthorizedObjectResult(
                   new
                   {
                       Error = "Device not authorized",
                       Message = result.Message
                   });
                return;
            }
            context.HttpContext.Items["DeviceInfo"] = result.DeviceInfo;
            await next();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating device {DeviceId}", deviceId);
            context.Result = new StatusCodeResult(500);
        }

    }
}