using FMS.Application.Queries.Database.FMSQuery.UserActivies;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserActiviesController : ControllerBase
{
    private readonly IMediator _mediator;
    public UserActiviesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetUserActivities([FromQuery] GetUserActivitiesQuery query)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userActivities = await _mediator.Send(query);
        return Ok(userActivities);
    }
}
