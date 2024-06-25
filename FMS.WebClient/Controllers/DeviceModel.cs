using FMS.Application.Command.DatabaseCommand.DeviceManagement.DeviceModelCommands;
using FMS.Application.Queries.Database.FMSQuery.DeviceManager.DeviceModelQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
namespace FMS.WebClient.Controllers;


[ApiController]
[Route("api/[controller]")]
public class DeviceModelController : ControllerBase
{
    private readonly IMediator _mediator;

    public DeviceModelController(IMediator mediator)
    {
        _mediator = mediator;
    }

  
  //Api: api/devicemodel/getlist
     [HttpGet]
     [Route("getlist")]
     public async Task<IActionResult> Get()
     {
         var query = new GetDeviceModelListQuery();
         var result = await _mediator.Send(query);
         if (result == null)
             return NotFound();
         return Ok(result);
     }

     
     //api:api/devivemodel/3
    [HttpGet("{id}")]
    public async Task<ActionResult<Devicemodel>> GetDeviceModel(int id)
    {
        if(id == 0 || id < 0) return BadRequest();
        var query = new GetDeviceModelByIdQuery(id);
        var result = await _mediator.Send(query);
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<int>> CreateDeviceModel(CreateDeviceModelCommand command)
    {
         if(!ModelState.IsValid) return BadRequest();

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetDeviceModel), new { id = result }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDeviceModel(int id, UpdateDeviceModelCommand command)
    {
        if(!ModelState.IsValid) return BadRequest();
        if (id != command.Devicemodel.Id)
            return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDeviceModel(int id)
    {

        if(id == 0 || id < 0)
        {
            return BadRequest();
        }
        var command = new DeleteDeviceModelCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}