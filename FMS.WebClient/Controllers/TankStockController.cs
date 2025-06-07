using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.DeliveriesCommands;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Command.DatabaseCommand.TankTransferCommand;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.Delivery.cs;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Application.ModelsDTOs.FMS.TankTransfer;
using FMS.Application.Queries.Database.FMSQuery.DeliveryQueries;
using FMS.Application.Queries.Database.FMSQuery.TankStock;
using FMS.Domain.ATGEntities.Nafta;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace FMS.WebClient.Controllers;
using Microsoft.AspNetCore.Authentication.JwtBearer;

[Route ("api/[controller]")]
[ApiController]
[Authorize (Roles = "Admin,User")]
public class TankStockController : ControllerBase {
    private readonly IMediator _mediator;
    private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

    public TankStockController (
        IMediator mediator,
        TankVolumeHistoryIntegrationService tankVolumeHistoryService) {
        _mediator = mediator;
        _tankVolumeHistoryService = tankVolumeHistoryService;
    }

    [HttpGet]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    public async Task<IActionResult> GetTankStocks () {
        return User.HasClaim ("permissions", "_Read_tankStock") ?
            Ok (await _mediator.Send (new GetTankStockListQuery ())) :
            Forbid ();
    }

    [HttpGet ("{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetTankStockById (int id) {
        var hasPermission = User.HasClaim ("permissions", "_Read_tankStock");
        if (!hasPermission) return Forbid ();
        if (id <= 0) return BadRequest ("Invalid ID");

        var result = await _mediator.Send (new GetTankStockByIdQuery (id));
        if (result == null) {
            return NotFound ();
        }
        return Ok (result);
    }

    [HttpPut ("update/{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UpdateDelivery (int id, [FromBody] DeliveryDTO deliveryDTO, bool ignoreNegativesValues = false) {
        var hasPermission = User.HasClaim ("permissions", "_editStock");
        if (!hasPermission) return Forbid ();
        if (!ModelState.IsValid) return BadRequest (ModelState);

        if (id != deliveryDTO.Id) return BadRequest ("ID mismatch");

        var result = await _mediator.Send (new UpdateDeliveryCommand (deliveryDTO, ignoreNegativesValues));
        if (!result.Success) return BadRequest (result);

        return Ok (result);
    }

    [HttpPost]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateTankStock ([FromBody] TankStockDTO tankStockDTO) {
        //check if user has "_create_tankStock" permission
        var hasPermission = User.HasClaim ("permissions", "_Create_tankStock");
        if (!hasPermission) {
            return Forbid ();
        }

        if (!ModelState.IsValid) {
            return BadRequest (ModelState);
        }
        var id = await _mediator.Send (new CreateTankStockCommand (tankStockDTO));
        return CreatedAtAction (nameof (GetTankStockById), new { id = id }, tankStockDTO);
    }

    [HttpPut ("{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UpdateTankStock (int id, [FromBody] TankStockDTO tankStockDTO) {
        var hasPermission = User.HasClaim ("permissions", "_Update_tankStock");
        if (!hasPermission) return Forbid (new FMSResponseMessage (false, "Please sign in").ToString ());

        if (!ModelState.IsValid) return BadRequest (ModelState);

        if (id != tankStockDTO.EntryId) {
            return BadRequest ("ID mismatch");
        }
        var result = await _mediator.Send (new UpdateTankStockCommand (tankStockDTO, id));
        if (!result) {
            return NotFound ();
        }
        return NoContent ();
    }

    [HttpDelete ("{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> DeleteTankStock (int id) {
        var hasPermission = User.HasClaim ("permissions", "_Delete_tankStock");
        if (!hasPermission) return Forbid ();
        var result = await _mediator.Send (new DeleteTankStockCommand (id));
        if (!result.Success) {
            return NotFound ();
        }
        return NoContent ();
    }

    [HttpPost ("openingstock")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateOpeningStock ([FromQuery] int tankId, decimal amount, DateTime dateTime) {
        // var hasPermission = User.HasClaim("permissions", "_openingStock");
        // if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest (new FMSResponseMessage (false, "Invalid Tank ID"));
        if (amount <= 0) return BadRequest (new FMSResponseMessage (false, "Opening stock should be greater than 0"));

        if (dateTime > DateTime.Now) return BadRequest (new FMSResponseMessage (false, "Date cannot be in the future"));
        if (dateTime == default (DateTime)) return BadRequest (new FMSResponseMessage (false, "Invalid Date"));

        var userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));

        if (userIdClaim == null) return BadRequest (new FMSResponseMessage (false, "Invalid User ID"));

        var result = await _mediator.Send (new OpeningStockCommand (tankId, amount, userIdClaim.Value, dateTime));

        if (!result.Success) return BadRequest (result);

        return Ok (result);

    }

    [HttpPost ("closingstock")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateClosingStock ([FromQuery] int tankId, decimal amount, DateTime dateTime) {
        // var hasPermission = User.HasClaim("permissions", "_closingStock");
        // if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest (new FMSResponseMessage (false, "Invalid Tank ID"));
        if (amount <= 0) return BadRequest (new FMSResponseMessage (false, "Closing stock should be greater than 0"));
        if (dateTime > DateTime.Now) return BadRequest (new FMSResponseMessage (false, "Date cannot be in the future"));
        if (dateTime == default (DateTime)) return BadRequest (new FMSResponseMessage (false, "Invalid Date"));

        var userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));

        if (userIdClaim == null) return BadRequest (new FMSResponseMessage (false, "Invalid User ID"));
        var result = await _mediator.Send (new ClosingStockCommand (tankId, amount, userIdClaim.Value, dateTime));

        if (!result.Success) return BadRequest (result);

        return Ok (result);

    }

    [HttpPost ("transfer")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateTankTransfer ([FromBody] TankTransferDTO tankTransferDTO) {
        //var hasPermission = User.HasClaim("permissions", "_tankTransfer");
        // if (!hasPermission) return Forbid();
        if (!ModelState.IsValid) return BadRequest (ModelState);
        var userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));

        if (userIdClaim == null) return BadRequest (new FMSResponseMessage (false, "Invalid User ID"));

        tankTransferDTO.RecordedBy = userIdClaim.Value;

        var result = await _mediator.Send (new CreateTankTransfer (tankTransferDTO));

        if (!result.Success) return BadRequest (result);

        return Ok (result);
    }

    /// <summary>
    /// Reconciles tank current stock with the latest volume history
    /// </summary>
    [HttpPost ("reconcile")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ReconcileTankStocks ([FromBody] ReconcileRequest request) {
        // var hasPermission = User.HasClaim("permissions", "_tankManagement");
        // if (!hasPermission) return Forbid();

        var userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));

        if (userIdClaim == null)
            return BadRequest (new FMSResponseMessage (false, "Invalid User ID"));

        // Call the reconciliation service
        var result = await _tankVolumeHistoryService.ReconcileAllTankCurrentStocksAsync (
            userIdClaim.Value,
            request.SiteId,
            HttpContext.RequestAborted);

        if (!result.Success)
            return BadRequest (result);

        return Ok (result);
    }
}

/// <summary>
/// Request model for tank reconciliation
/// </summary>
public class ReconcileRequest {
    /// <summary>
    /// Optional site ID to limit reconciliation to tanks at a specific site
    /// </summary>
    public int? SiteId { get; set; }

    /// <summary>
    /// User ID performing the reconciliation
    /// </summary>
    public string UserId { get; set; }
}