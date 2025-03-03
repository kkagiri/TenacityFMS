using FMS.Application.Command.DatabaseCommand.FuelRefillCommand;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;


[ApiController]
[Route("api/[controller]")]
public class FuelRefilController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelRefilController(IMediator mediator)
    {
        _mediator = mediator;
    }

    //api: Post fuelrefill
    [HttpPost]
    public async Task<IActionResult> CreateFuelRefil(FuelRefilCreateCommand command)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var id = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetFuelRefil), new { id = id }, command);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFuelRefil(int id)
    {
        var fuelRefil = await _mediator.Send(new FuelRefilGetbyIDQuery(id));
        if (fuelRefil == null)
        {
            return NotFound();
        }
        return Ok(fuelRefil);
    }


    [HttpGet("getlist")]
    public async Task<IActionResult> GetFuelRefilList()
    {
        var fuelRefil = await _mediator.Send(new FuelRefillGetListQuery());
        if (fuelRefil == null)
        {
            return NoContent();
        }
        return Ok(fuelRefil);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFuelRefil(int id, FuelRefilDTO dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");

        var result = await _mediator.Send(new UpdateFuelRefillCommand(dto, id));

        if (!result.Success) return NotFound(result.Message);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFuelRefil(int id)
    {
        var result = await _mediator.Send(new FuelRefilDeleteCommand(id));
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }
}