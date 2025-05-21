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
using System.IdentityModel.Tokens.Jwt;

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

            // Continue with the request pipeline first
            await _next(context);

            // Then log the activity (to avoid blocking the main request flow)
            if (user.Identity?.IsAuthenticated == true)
            {
                try
                {
                    // Use exactly the same approach as in your working controller code
                    var userIdClaim = user.Claims.FirstOrDefault(c =>
                        c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                        Guid.TryParse(c.Value, out _));

                    if (userIdClaim == null)
                    {
                        _logger.LogWarning("User is authenticated but no valid user ID claim was found");
                        return;
                    }

                    var userId = userIdClaim.Value;
                    _logger.LogDebug("Using user ID: {UserId} for activity logging", userId);

                    var action = context.Request.Method;
                    var controller = context.Request.RouteValues["controller"]?.ToString();
                    var actionName = context.Request.RouteValues["action"]?.ToString();
                    var parameters = "";

                    // Skip certain paths to avoid excessive logging
                    var path = context.Request.Path.ToString().ToLowerInvariant();
                    if (path.StartsWith("/api/useractivies") ||
                        path.Contains("favicon") ||
                        path.Contains("signalr") ||
                        path.Contains("GetNavigationItemList") ||
                        path.Contains("GetUser") ||
                        path.Contains("GetUserActivities") ||
                        path.Contains("GetUserByEmail") ||
                        path.Contains("GetUserByPhoneNumber"))
                    {
                        return;
                    }

                    // Only capture request body for POST/PUT requests
                    if ((request.Method == "POST" || request.Method == "PUT") &&
                        request.ContentType?.Contains("application/json") == true)
                    {
                        try
                        {
                            request.EnableBuffering();
                            request.Body.Position = 0;  // Rewind the stream
                            using (var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true))
                            {
                                parameters = await reader.ReadToEndAsync();
                                request.Body.Position = 0;  // Reset the position for other middleware
                            }

                            // Don't log sensitive info or large payloads
                            if (parameters.Length > 1000)
                            {
                                parameters = $"[Truncated payload: {parameters.Length} bytes]";
                            }

                            // Don't log auth-related payloads
                            if (controller?.ToLowerInvariant() == "auth" ||
                                path.Contains("login") ||
                                path.Contains("password"))
                            {
                                parameters = "[Sensitive data redacted]";
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error reading request body for activity logging");
                            parameters = "[Error reading request body]";
                        }
                    }

                    var ipAddress = context.Connection.RemoteIpAddress?.ToString();
                    var statusCode = context.Response.StatusCode;

                    var command = new CreateUserActivityCommand
                    {
                        UserId = userId,
                        Action = $"{action} - {statusCode}",
                        Controller = controller,
                        ActionName = actionName,
                        Parameters = parameters,
                        IpAddress = ipAddress,
                        Timestamp = DateTime.UtcNow
                    };

                    // Actually await the operation
                    var activityId = await _mediator.Send(command);
                    _logger.LogInformation("Activity logged for user {UserId}, action {Action}, controller {Controller}, activityId: {ActivityId}",
                        userId, action, controller, activityId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error logging user activity: {Message}", ex.Message);
                }
            }
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