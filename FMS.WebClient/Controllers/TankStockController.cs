using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Queries.Database.FMSQuery.TankStock;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using AutoMapper.Configuration.Annotations;
namespace FMS.WebClient.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,User")]
public class TankStockController : ControllerBase
{
    private readonly IMediator _mediator;

    public TankStockController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize]

    public async Task<IActionResult> GetTankStocks()
    {
        return User.HasClaim("permissions", "_Read_tankStock")
      ? Ok(await _mediator.Send(new GetTankStockListQuery()))
      : Forbid();
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetTankStockById(int id)
    {
        var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
        if (!hasPermission) return Forbid();
        if (id <= 0) return BadRequest("Invalid ID");

        var result = await _mediator.Send(new GetTankStockByIdQuery(id));
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateTankStock([FromBody] TankStockDTO tankStockDTO)
    {
        //check if user has "_create_tankStock" permission
        var hasPermission = User.HasClaim("permissions", "_Create_tankStock");
        if (!hasPermission)
        {
            return Forbid();
        }
        
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var id = await _mediator.Send(new CreateTankStockCommand(tankStockDTO));
        return CreatedAtAction(nameof(GetTankStockById), new { id = id }, tankStockDTO);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateTankStock(int id, [FromBody] TankStockDTO tankStockDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_Update_tankStock");
        if (!hasPermission) return Forbid();
        
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (id != tankStockDTO.EntryId)
        {
            return BadRequest("ID mismatch");
        }
        var result = await _mediator.Send(new UpdateTankStockCommand(tankStockDTO, id));
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteTankStock(int id)
    {
        var hasPermission = User.HasClaim("permissions", "_Delete_tankStock");
        if (!hasPermission) return Forbid();
        var result = await _mediator.Send(new DeleteTankStockCommand(id));
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }
}
