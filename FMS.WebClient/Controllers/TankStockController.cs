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
using FMS.Application.Command.DatabaseCommand.TankTransferCommand;
using FMS.Application.ModelsDTOs.FMS.TankTransfer;
using FMS.Application.Common;
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
        if (!hasPermission) return Forbid( new FMSResponseMessage(false,"Please sign in").ToString());
        
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
    public async Task<IActionResult> CreateOpeningStock([FromQuery]int tankId,decimal amount,DateTime dateTime)
    {
        // var hasPermission = User.HasClaim("permissions", "_openingStock");
        // if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest(new FMSResponseMessage(false, "Invalid Tank ID"));  
        if (amount <= 0) return BadRequest(new FMSResponseMessage(false, "Opening stock should be greater than 0"));

        if (dateTime > DateTime.Now) return BadRequest(new FMSResponseMessage(false,"Date cannot be in the future"));
        if (dateTime == default(DateTime)) return BadRequest(new FMSResponseMessage(false, "Invalid Date"));

        var userIdClaim = User.Claims.FirstOrDefault(c =>
               c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
               Guid.TryParse(c.Value, out _));

        if (userIdClaim == null) return BadRequest(new FMSResponseMessage(false, "Invalid User ID"));

        var result = await _mediator.Send(new OpeningStockCommand(tankId, amount, userIdClaim.Value,dateTime));

        if (!result.Success) return BadRequest(result);
         
        return Ok(result);
        
    }
    [HttpPost("closingstock")]
    [Authorize]
    public async Task<IActionResult> CreateClosingStock([FromQuery]int tankId, decimal amount ,DateTime dateTime)
    {
        // var hasPermission = User.HasClaim("permissions", "_closingStock");
        // if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest(new FMSResponseMessage(false, "Invalid Tank ID"));
        if (amount <= 0) return BadRequest(new FMSResponseMessage(false, "Closing stock should be greater than 0"));
        if (dateTime > DateTime.Now) return BadRequest(new FMSResponseMessage(false, "Date cannot be in the future"));
        if (dateTime == default(DateTime)) return BadRequest(new FMSResponseMessage(false, "Invalid Date"));

        var userIdClaim = User.Claims.FirstOrDefault(c =>
             c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
             Guid.TryParse(c.Value, out _));

        if (userIdClaim == null) return BadRequest(new FMSResponseMessage(false, "Invalid User ID"));
        var result = await _mediator.Send(new ClosingStockCommand(tankId, amount, userIdClaim.Value,dateTime));

        if (!result.Success) return BadRequest(result);

        return Ok(result);

    }

    [HttpPost("transfer")]
    [Authorize]
    public async Task<IActionResult> CreateTankTransfer([FromBody] TankTransferDTO tankTransferDTO)
    {
        //var hasPermission = User.HasClaim("permissions", "_tankTransfer");
       // if (!hasPermission) return Forbid();
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userIdClaim = User.Claims.FirstOrDefault(c =>
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                                Guid.TryParse(c.Value, out _));

        if (userIdClaim == null) return BadRequest(new FMSResponseMessage(false, "Invalid User ID"));

        tankTransferDTO.RecordedBy = userIdClaim.Value;

        var result = await _mediator.Send(new CreateTankTransfer(tankTransferDTO));

        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }
    




}
