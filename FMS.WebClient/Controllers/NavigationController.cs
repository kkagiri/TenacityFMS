using System.Security.Claims;
using System.Text.Json.Serialization;
using FMS.Application.Command.DatabaseCommand.NavigationCommand;
using FMS.Application.Queries.Database.FMSQuery.Navigation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NavigationController : ControllerBase
    {

        private readonly IMediator _mediator;
        public NavigationController(IMediator mediator)
        {
            _mediator = mediator;
        }


        //Api/Navigation
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetNavigationItemList()
        {
            //retrieve user roles from claims (token)
            var userRoles = User.Claims.Where(c => c.Type == ClaimTypes.Role)
                             .Select(c => c.Value).
                             ToList();

            var querry = new GetNavigationItemListByRoleQuery(userRoles);
            var navigationItems = await _mediator.Send(querry);
            return Ok(navigationItems);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNavigationItem([FromBody] CreateNavigationItemCommand command)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var navigationItemId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetNavigationItemByIdQuery), new { id = navigationItemId }, command);
        }
    [HttpGet("all")]
    public async Task<IActionResult> GetAllNavigationItems()
    {
        var navigationItems = await _mediator.Send(new GetAllNavigationItemsQuery());
        return Ok(navigationItems);
    }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNavigationItem(int id, [FromBody] UpdateNavigationCommand command)
        {
            if (!ModelState.IsValid) return BadRequest();

            if (command.Id != id) return BadRequest();

            var result = await _mediator.Send(command);
            if (!result) return NotFound();

            return NoContent();
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNavigationItem(int id)
        {
            if (id == 0) return BadRequest();
            var result = await _mediator.Send(new DeleteNavigationItemCommand(id));
            if (!result) return NotFound();
            return NoContent();
        }
        [HttpPost("AssignRoles")]
        public async Task<IActionResult> AssignRolesToNavigationItem([FromBody] AssignRoleToNavigationCommand command)
        {
            if(!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _mediator.Send(command);
            if (!result) return BadRequest();
            return Ok();
        }
    }
}