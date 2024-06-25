using FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceManufacturerCommands;
using FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceManufacturerQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeviceManufacturerController : ControllerBase
{
    private readonly IMediator _mediator;

    public DeviceManufacturerController(IMediator mediator)
    {
        _mediator = mediator;
    }


    //Api: api/getlist
     [HttpGet]
     [Route("getlist")]
    public async Task<IActionResult> GetDeviceManufacturerList()
    {
        var deviceManufacturerList = await _mediator.Send(new GetDeviceManufacturerListQuery());
        return Ok(deviceManufacturerList);
    }


//APi: 
    [HttpGet("{id}")]
    public async Task<ActionResult<Devicemanufacturer>> GetDeviceManufacturer(int id)
    {
        if (id == 0 || id < 0) return BadRequest();
        var query = new GetDeviceManufacturerByIdQuery(id);
        var result = await _mediator.Send(query);
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<int>> CreateDeviceManufacturer(CreateDeviceManufacturerCommand command)
    {
        if(!ModelState.IsValid) return BadRequest();
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetDeviceManufacturer), new { id = result }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDeviceManufacturer(int id, UpdateDeviceManufacturerCommand command)
    {
        if (!ModelState.IsValid) return BadRequest(); 
               if (id != command.Devicemanufacturer.Id)
            return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDeviceManufacturer(int id)
    {
        if(id == 0 || id < 0) return BadRequest();
        var command = new DeleteDeviceManufacturerCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}