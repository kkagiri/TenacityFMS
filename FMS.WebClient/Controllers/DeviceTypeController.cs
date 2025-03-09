using System.Text.Json.Serialization;
using FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceTypeCommands;
using FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceTypeQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeviceTypeController : ControllerBase
{
    private readonly IMediator _mediator;

    public DeviceTypeController(IMediator mediator)
    {
        _mediator = mediator;
    }


    [HttpGet]
    [Route("getlist")]
    public async Task<IActionResult> Get()
    {
        var query = new GetDeviceTypeListQuery();
        var result = await _mediator.Send(query);
        if (result == null) return NotFound();
        return Ok(result);
    }

    //Api: api/devicetype/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Devicetype>> GetDeviceType(int id)
    {

        if (id == 0 || id < 0) return BadRequest();
        var query = new GetDeviceTypeByIdQuery(id);
        var result = await _mediator.Send(query);
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    //Api: api/devicetype

    [HttpPost]
    public async Task<ActionResult<int>> CreateDeviceType(CreateDeviceTypeCommand command)
    {
        if (!ModelState.IsValid) return BadRequest();
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetDeviceType), new { id = result }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDeviceType(int id, UpdateDeviceTypeCommand command)
    {
        if (!ModelState.IsValid) return BadRequest();
        if (id == 0 || id < 0) return BadRequest();
        if (id != command.Devicetype.Id)
            return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDeviceType(int id)
    {

        if (id == 0 || id < 0) return BadRequest();
        var command = new DeleteDeviceTypeCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
