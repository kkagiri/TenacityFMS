using FMS.Application.Command.DatabaseCommand.FuelRefillCommand;
using FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;

namespace FMS.WebClient.Controllers;


[ApiController]
[Authorize]
[Route("api/[controller]")]
public class FuelRefillController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelRefillController(IMediator mediator)
    {
        _mediator = mediator;
    }

    //api: Post fuelrefill
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateFuelRefil([FromBody] FuelRefilDTO fuelRefilDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_createFuelRefill");
        if (!hasPermission) return Forbid();
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

        if (userIdClaim == null) return BadRequest("Invalid User ID");

        fuelRefilDTO.FuelBy = userIdClaim.Value;

        var command = new FuelRefilCreateCommand(fuelRefilDTO);

        var results = await _mediator.Send(command);
        if (!results.Success) return BadRequest(results.Message);

    return Ok(results);
        }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetFuelRefil(int id)
    {
       var hasPermission = User.HasClaim("permissions", "_readFuelRefill");
       if (!hasPermission) return Forbid();
        if (id <= 0) return BadRequest("Invalid ID");
        var fuelRefil = await _mediator.Send(new FuelRefilGetbyIDQuery(id));
        if (fuelRefil == null)  return NotFound();
        
        return Ok(fuelRefil);
    }


    [HttpGet]
    [Authorize]
     public async Task<IActionResult> GetFuelRefilList()
    {
        var hasPermission = User.HasClaim("permissions", "_readFuelRefill");
        if (!hasPermission) return Forbid();
        var fuelRefil = await _mediator.Send(new FuelRefillGetListQuery());
        if (fuelRefil == null)  return NoContent();
        
        return Ok(fuelRefil);
    }

    [HttpPut("{id}")]
    [Authorize]

    public async Task<IActionResult> UpdateFuelRefil(int id, [FromBody] FuelRefilDTO fuelRefilDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_editFuelRefill");
        if (!hasPermission) return Forbid();
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

        if (userIdClaim == null) return BadRequest("Invalid User ID");

        fuelRefilDTO.FuelBy = userIdClaim.Value;

        if (id <= 0) return BadRequest("Invalid ID");
        if (id != fuelRefilDTO.Id) return BadRequest("ID mismatch");

        var command = new UpdateFuelRefillCommand(fuelRefilDTO,id );

        var result = await _mediator.Send(command);
        if (!result.Success)  return NotFound();
         return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteFuelRefil(int id)
    {
        var hasPermission = User.HasClaim("permissions", "_deleteFuelRefill");
        if (!hasPermission) return Forbid();
        if (id <= 0) return BadRequest("Invalid ID");
        var result = await _mediator.Send(new FuelRefilDeleteCommand(id));
        if (!result)  return NotFound();
        
        return NoContent();
    }
}