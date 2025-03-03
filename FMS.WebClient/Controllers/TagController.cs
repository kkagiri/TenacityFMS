using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Application.Command.DatabaseCommand.TagCmd;
using FMS.Application.Queries.Database.FMSQuery.TagQueries;

namespace FMS.WebClient.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,User")]
public class TagController : ControllerBase
{
    private readonly IMediator _mediator;

    public TagController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetTags()
    {
        return User.HasClaim("permissions", "_readTag")
            ? Ok(await _mediator.Send(new GetAllTagsQuery()))
            : Forbid();
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetTagById(int id)
    {
        var hasPermission = User.HasClaim("permissions", "_readTag");
        if (!hasPermission) return Forbid();
        if (id <= 0) return BadRequest("Invalid ID");

        var result = await _mediator.Send(new GetTagByIdQuery(id));
        return result != null ? Ok(result) : NotFound();
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateTag([FromBody] TagDTO tagDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_CreateTags");
        if (!hasPermission) return Forbid();

        if (!ModelState.IsValid) return BadRequest(ModelState);

        var id = await _mediator.Send(new CreateTagCommand(tagDTO));
        return CreatedAtAction(nameof(GetTagById), new { id }, tagDTO);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateTag(int id, [FromBody] TagDTO tagDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_EditTags");
        if (!hasPermission) return Forbid();

        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (id != tagDTO.Id) return BadRequest("ID mismatch");

        var result = await _mediator.Send(new UpdateTagCommand(tagDTO));
        return result.Success ? NoContent() : BadRequest(result);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteTag(int id)
    {
        var hasPermission = User.HasClaim("permissions", "_DeleteTags");
        if (!hasPermission) return Forbid();

        var result = await _mediator.Send(new DeleteTagCommand(id));
        return result.Success ? NoContent() : BadRequest(result);
    }

    [HttpPost("assign-to-vehicle")]
    [Authorize]
    public async Task<IActionResult> AssignTagToVehicle([FromBody] AssignTagToVehicleDTO assignTagDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_EditTags");
        if (!hasPermission) return Forbid();

        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _mediator.Send(new AssignToVehicleTagCommand(assignTagDTO));
        return result.Success ? Ok(result) : BadRequest(result);
    }
}