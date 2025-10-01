using System.Security.Claims;
using System.Text.Json.Serialization;
using FMS.Application.Command.DatabaseCommand.NavigationCommand;
using FMS.Application.Queries.Database.FMSQuery.Navigation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/v1/[controller]")]
    public class NavigationController : ControllerBase {

        private readonly IMediator _mediator;
        public NavigationController (IMediator mediator) {
            _mediator = mediator;
        }

        //Cursor - Added DTO for update request
        public class UpdateNavigationItemDto {
            public int Id { get; set; }
            public string Link { get; set; }
            public string PageName { get; set; }
            public int? ParentId { get; set; }
            public string? Icon { get; set; }
            public List<string> RoleIds { get; set; } = new ();
        }

        //Api/Navigation
        [HttpGet]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetNavigationItemList () {
            //retrieve user roles from claims (token)
            var userRoles = User.Claims.Where (c => c.Type == ClaimTypes.Role)
                .Select (c => c.Value).
            ToList ();

            var querry = new GetNavigationItemListByRoleQuery (userRoles);
            var navigationItems = await _mediator.Send (querry);
            return Ok (navigationItems);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNavigationItem ([FromBody] CreateNavigationItemCommand command) {
            if (!ModelState.IsValid) return BadRequest (ModelState);
            var navigationItemId = await _mediator.Send (command);
            return CreatedAtAction (nameof (GetNavigationItemByIdQuery), new { id = navigationItemId }, command);
        }

        [HttpGet ("all")]
        public async Task<IActionResult> GetAllNavigationItems () {
            var navigationItems = await _mediator.Send (new GetAllNavigationItemsQuery ());
            return Ok (navigationItems);
        }

        [HttpPut ("{id}")]
        public async Task<IActionResult> UpdateNavigationItem (int id, [FromBody] UpdateNavigationItemDto dto) //Cursor - Changed to use DTO
        {
            if (!ModelState.IsValid) return BadRequest ();

            if (dto.Id != id) return BadRequest ();

            //ToDo: -Move Map DTO to command
            var command = new UpdateNavigationCommand (dto.Link, dto.PageName, dto.Id, dto.RoleIds, dto.ParentId, dto.Icon);
            var result = await _mediator.Send (command);
            if (!result) return NotFound ();

            return NoContent ();
        }

        [HttpDelete ("{id}")]
        public async Task<IActionResult> DeleteNavigationItem (int id) {
            if (id == 0) return BadRequest ();
            var result = await _mediator.Send (new DeleteNavigationItemCommand (id));
            if (!result) return NotFound ();
            return NoContent ();
        }

        [HttpPost ("AssignRoles")]
        public async Task<IActionResult> AssignRolesToNavigationItem ([FromBody] AssignRoleToNavigationCommand command) {
            if (!ModelState.IsValid) return BadRequest (ModelState);
            var result = await _mediator.Send (command);
            if (!result) return BadRequest ();
            return Ok ();
        }
    }
}
