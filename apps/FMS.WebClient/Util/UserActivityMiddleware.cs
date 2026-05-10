/*
 * File: UserActivityMiddleware.cs
 * Purpose: Logs authenticated user activity for API requests
 * Dependencies: MediatR, ASP.NET Core HttpContext
 * Last Modified: 2026-01-19
 *
 * Key Classes:
 * - UserActivityMiddleware: Captures and persists activity metadata
 */
using System;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.UserActivitiesCommands;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Util
{
    public class UserActivityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<UserActivityMiddleware> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public UserActivityMiddleware(RequestDelegate next, ILogger<UserActivityMiddleware> logger, IServiceScopeFactory serviceScopeFactory)
        {
            _next = next;
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var user = context.User;
            var request = context.Request;
            var path = request.Path.ToString().ToLowerInvariant();
            var controller = request.RouteValues["controller"]?.ToString();
            var actionName = request.RouteValues["action"]?.ToString();
            var action = request.Method;
            var parameters = "";

            // Skip certain paths to avoid excessive logging
            var shouldSkip = path.StartsWith("/api/useractivities") ||
                             path.StartsWith("/dashboardhub") ||
                             path.StartsWith("/ptshub") ||
                             path.StartsWith("/frontendhub") ||
                             path.StartsWith("/vehicletrackinghub") ||
                             path.Contains("favicon") ||
                             path.Contains("signalr") ||
                             path.Contains("GetNavigationItemList") ||
                             path.Contains("GetUser") ||
                             path.Contains("GetUserActivities") ||
                             path.Contains("GetUserByEmail") ||
                             path.Contains("GetUserByPhoneNumber") ||
                             (request.Method == "GET" && path.Contains("/api/user"));

            if (user.Identity?.IsAuthenticated == true &&
                !shouldSkip &&
                (request.Method == "POST" || request.Method == "PUT") &&
                request.ContentType?.Contains("application/json") == true)
            {
                try
                {
                    request.EnableBuffering();
                    request.Body.Position = 0; // Rewind the stream
                    using (var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true))
                    {
                        parameters = await reader.ReadToEndAsync();
                        request.Body.Position = 0; // Reset the position for other middleware
                    }

                    if (parameters.Length > 1000)
                    {
                        parameters = $"[Truncated payload: {parameters.Length} bytes]";
                    }

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

            // Continue with the request pipeline first
            await _next(context);

            // Then log the activity (to avoid blocking the main request flow)
            if (user.Identity?.IsAuthenticated == true)
            {
                try
                {
                    if (shouldSkip)
                    {
                        return;
                    }

                    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                        ?? user.FindFirst("sub")?.Value;

                    if (string.IsNullOrWhiteSpace(userId))
                    {
                        _logger.LogWarning("User is authenticated but no valid user ID claim was found");
                        return;
                    }

                    _logger.LogDebug("Using user ID: {UserId} for activity logging", userId);

                    var ipAddress = context.Connection.RemoteIpAddress?.ToString();
                    var statusCode = context.Response.StatusCode;

                    if (statusCode == StatusCodes.Status101SwitchingProtocols)
                    {
                        return;
                    }

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

                    // Create a scope to access scoped services like GpsdataContext
                    using (var scope = _serviceScopeFactory.CreateScope())
                    {
                        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                        // Actually await the operation
                        var activityId = await mediator.Send(command);
                        _logger.LogInformation("Activity logged for user {UserId}, action {Action}, controller {Controller}, activityId: {ActivityId}",
                            userId, action, controller, activityId);
                    }
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