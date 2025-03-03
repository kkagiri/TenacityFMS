using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.IO;
using System.Text;
using System.Security.Claims;
using MediatR;
using FMS.Application.Command.DatabaseCommand.UserActivitiesCommands;

namespace FMS.WebClient.Util
{
    public class UserActivityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<UserActivityMiddleware> _logger;
        private readonly IMediator _mediator;

        public UserActivityMiddleware(RequestDelegate next, ILogger<UserActivityMiddleware> logger, IMediator mediator)
        {
            _next = next;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var user = context.User;
            var request = context.Request;

            if (user.Identity.IsAuthenticated)
            {
                try
                {
                    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    var action = context.Request.Method;
                    var controller = context.Request.RouteValues["controller"]?.ToString();
                    var actionName = context.Request.RouteValues["action"]?.ToString();
                    var parameters = "";

                    // Only capture request body for POST/PUT requests
                    if ((request.Method == "POST" || request.Method == "PUT") &&
                        request.ContentType?.Contains("application/json") == true)
                    {
                        request.EnableBuffering();
                        using (var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true))
                        {
                            parameters = await reader.ReadToEndAsync();
                            request.Body.Position = 0;  // Reset the position to allow reading again
                        }
                    }

                    var ipAddress = context.Connection.RemoteIpAddress?.ToString();

                    var command = new CreateUserActivityCommand
                    {
                        UserId = userId,
                        Action = action,
                        Controller = controller,
                        ActionName = actionName,
                        Parameters = parameters,
                        IpAddress = ipAddress,
                        Timestamp = DateTime.UtcNow
                    };

                    // Fire and forget activity logging
                    _ = _mediator.Send(command);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error logging user activity");
                }
            }

            // Continue with the request pipeline
            await _next(context);
        }
    }

    // Extension method to make registration cleaner
    public static class UserActivityMiddlewareExtensions
    {
        public static IApplicationBuilder UseUserActivity(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<UserActivityMiddleware>();
        }
    }
}