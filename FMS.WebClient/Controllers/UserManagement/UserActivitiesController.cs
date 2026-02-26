using System;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.UserActivitiesCommands;
using FMS.Application.Queries.Database.FMSQuery.UserActivities;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.Admin.Users)]
public class UserActivitiesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UserActivitiesController> _logger;

    public UserActivitiesController(IMediator mediator, ILogger<UserActivitiesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet]
    [EnableCors("DevelopmentCorsPolicy")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetUserActivities([FromQuery] GetUserActivitiesQuery query)
    {
        try
        {
            _logger.LogInformation("Received request for user activities: UserId={UserId}, PageNumber={PageNumber}, PageSize={PageSize}",
                query.UserId, query.PageNumber, query.PageSize);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for user activities query");
                return BadRequest(ModelState);
            }

            var userActivities = await _mediator.Send(query);
            _logger.LogInformation("Retrieved {Count} user activities", userActivities.Count);

            return Ok(userActivities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user activities");
            return StatusCode(500, new { error = "An error occurred while retrieving user activities" });
        }
    }

    [HttpGet("login")]
    [EnableCors("DevelopmentCorsPolicy")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetLoginActivities([FromQuery] GetLoginActivitiesQuery query)
    {
        try
        {
            _logger.LogInformation("Received request for login activities: UserId={UserId}", query.UserId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var loginActivities = await _mediator.Send(query);
            _logger.LogInformation("Retrieved {Count} login activities", loginActivities.Count);

            return Ok(loginActivities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving login activities");
            return StatusCode(500, new { error = "An error occurred while retrieving login activities" });
        }
    }

    [HttpPost]
    [EnableCors("DevelopmentCorsPolicy")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateUserActivity([FromBody] CreateUserActivityCommand command)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for create user activity command");
                return BadRequest(ModelState);
            }

            var activityId = await _mediator.Send(command);
            _logger.LogInformation("Created user activity with ID {ActivityId}", activityId);

            return Ok(activityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user activity");
            return StatusCode(500, new { error = "An error occurred while creating the user activity" });
        }
    }
}