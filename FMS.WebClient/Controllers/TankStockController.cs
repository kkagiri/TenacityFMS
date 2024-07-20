using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Queries.Database.FMSQuery.TankStock;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using AutoMapper.Configuration.Annotations;
using FMS.Application.Queries.Database.FMSQuery.TankVolumeHistory;
using FMS.Application.ModelsDTOs.FMS.TankVolumeHistory;
using FMS.Application.ModelsDTOs.FMS.Delivery.cs;
using FMS.Application.Command.DatabaseCommand.ATGCommands.InTankDeliveryCommand;
using FMS.Application.Command.DatabaseCommand.DeliveriesCommands;
using FMS.Application.Queries.Database.FMSQuery.DeliveryQueries;
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


    [HttpPost("openingstock")]
    [Authorize]
    public async Task<IActionResult> CreateOpeningStock([FromQuery]int tankId,decimal amount)
    {
        var hasPermission = User.HasClaim("permissions", "_openingStock");
        if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest("Invalid Tank ID");  
        if (amount <= 0) return BadRequest("Opening stock should be greater than 0");

        var userIdClaim = User.Claims.FirstOrDefault(c =>
               c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
               Guid.TryParse(c.Value, out _));

        if (userIdClaim == null) return BadRequest("Invalid User ID");

        var result = await _mediator.Send(new OpeningStockCommand(tankId, amount, userIdClaim.Value));

        if (!result.Success) return BadRequest(result.Message);
         
        return Ok(result.Message);
        
    }
    [HttpPost("closingstock")]
    [Authorize]
    public async Task<IActionResult> CreateClosingStock([FromQuery]int tankId, decimal amount)
    {
        var hasPermission = User.HasClaim("permissions", "_closingStock");
        if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest("Invalid Tank ID");
        if (amount <= 0) return BadRequest("Closing stock should be greater than 0");

        var userIdClaim = User.Claims.FirstOrDefault(c =>
             c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
             Guid.TryParse(c.Value, out _));

        if (userIdClaim == null) return BadRequest("Invalid User ID");
        var result = await _mediator.Send(new ClosingStockCommand(tankId, amount, userIdClaim.Value));

        if (!result.Success) return BadRequest(result.Message);

        return Ok(result.Message);

    }

    [HttpGet("tankvolumeHistory")]
    [Authorize]
    public async Task<IActionResult>  GetTankVolumeHistory()
    {
       // var hasPermission = User.HasClaim("permissions", "_Read_tankVolumeHistory");
        //if (!hasPermission) return Forbid();
        var result = await _mediator.Send(new GetTankVolumeHistoryQuery());
        if (result == null) return NoContent();
        return Ok(result);
    }

    [HttpGet("tankvolumehistory/{TankId}")]
    [Authorize]
    public async Task<IActionResult> GetTankVolumeHistoryById(int TankId)
    {
       // var hasPermission = User.HasClaim("permissions", "_Read_tankVolumeHistory");
     //   if (!hasPermission) return Forbid();
        if (TankId <= 0) return BadRequest("Invalid ID");

        var result = await _mediator.Send(new GetTankVolumeHistoryByTankIdQuery(TankId));
        if (result == null) return NotFound();
        if (result.Success == false) return BadRequest(result.Message);
        
        return Ok(result.Data);
    }


    [HttpPost("Delivery")]
    [Authorize]
    public async Task<IActionResult> CreateDelivery([FromBody] DeliveryDTO deliveryDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_Create_Delivery");

        if (!hasPermission) return Forbid();
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _mediator.Send(new CreateDeliveryCommand(deliveryDTO));
        if (!result.Success) return BadRequest(result.Message);
        return Ok(result.Message);
    }
    [HttpGet("Deliveries")]
    [Authorize]
    public async Task<IActionResult> GetDeliveries()
    {
        var hasPermission = User.HasClaim("permissions", "_Read_Delivery");
        if (!hasPermission) return Forbid();
        var result = await _mediator.Send(new GetDeliveryListQuery());
        if (result == null) return NoContent();
        return Ok(result);
    }


}
