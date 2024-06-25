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
                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

                var action = context.Request.RouteValues["action"]?.ToString();
                var actionName = context.GetRouteValue("action")?.ToString();

                var controller = context.Request.RouteValues["controller"]?.ToString();
                var parameters = "";


                if (request.ContentLength > 0 && request.ContentType?.Contains("application/json") == true)
                {
                    request.EnableBuffering();
                    using (var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true))
                    {
                        parameters = await reader.ReadToEndAsync();
                        request.Body.Position = 0;
                    }
                }

                var command = new CreateUserActivitiesCommand(userId, action, controller, actionName, parameters);
            }
            await _next(context);
        }
    }
}