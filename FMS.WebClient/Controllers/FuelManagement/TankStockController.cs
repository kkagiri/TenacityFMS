using FMS.Application.Command.DatabaseCommand.DeliveriesCommands;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Command.DatabaseCommand.TankTransferCommand;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Delivery.cs;
using FMS.Application.Features.FMS.TankStock;
using FMS.Application.Features.FMS.TankTransfer;
using FMS.Application.Queries.Database.FMSQuery.TankStock;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities.enums;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
//Cursor - Add SignalR for real-time updates
using System.Security.Claims;
using FMS.Application.Communication.SignalR;
using Microsoft.AspNetCore.SignalR;

namespace FMS.WebClient.Controllers;

[Route ("api/[controller]")]
[ApiController]
[Authorize]
public class TankStockController : ControllerBase {
    private readonly IMediator _mediator;
    private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
    private readonly TankStockFutureRecordsService _futureRecordsService;
    private readonly OpeningStockValidationService _openingStockValidationService;
    //Cursor - Add SignalR hub context for real-time updates
    private readonly IHubContext<FrontEndHub> _hubContext;

    public TankStockController (
        IMediator mediator,
        TankVolumeHistoryIntegrationService tankVolumeHistoryService,
        TankStockFutureRecordsService futureRecordsService,
        OpeningStockValidationService openingStockValidationService,
        IHubContext<FrontEndHub> hubContext) {
        _mediator = mediator;
        _tankVolumeHistoryService = tankVolumeHistoryService;
        _futureRecordsService = futureRecordsService;
        _openingStockValidationService = openingStockValidationService;
        _hubContext = hubContext;
    }

    [HttpGet]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetTankStocks () {
        return User.HasClaim ("permissions", "_Read_tankStock") ?
            Ok (await _mediator.Send (new GetTankStockListQuery ())) :
            Forbid ();
    }

    /// <summary>
    /// Validates if a historical tank stock entry can be processed based on future records policy
    /// </summary>
    /// <param name="request">Historical entry validation request</param>
    /// <returns>Validation result with policy decision and warning messages</returns>
    [HttpPost ("validate-historical-entry")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ValidateHistoricalEntry ([FromBody] HistoricalEntryValidationRequest request) {
        var hasPermission = User.HasClaim ("permissions", "_Read_tankStock");
        if (!hasPermission) return Forbid ();

        if (!ModelState.IsValid)
            return BadRequest (ModelState);

        try {
            var result = await _futureRecordsService.ValidateHistoricalEntryAsync (
                request.TankId,
                request.EntryDate,
                request.EntryType,
                HttpContext.RequestAborted);

            // Check if the validation result indicates the entry is not allowed
            if (!result.IsAllowed) {
                // Return 422 Unprocessable Entity for validation failures
                var failedResponse = FMSResponse<TankStockFutureRecordsValidationResult>.Failed (result.Message);
                failedResponse.Data = result;
                return UnprocessableEntity (failedResponse);
            }

            // Return success for allowed entries (with or without warnings)
            return Ok (FMSResponse<TankStockFutureRecordsValidationResult>.Success (result, "Validation completed successfully"));
        } catch (Exception ex) {
            return BadRequest (FMSResponse<TankStockFutureRecordsValidationResult>.Failed ($"Validation failed: {ex.Message}"));
        }
    }
    /// <summary>
    /// Gets the current tank stock future records policy configuration
    /// </summary>
    /// <returns>Current policy configuration</returns>
    [HttpGet ("future-records-policy")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme), ]
    public async Task<IActionResult> GetFutureRecordsPolicy () {
        var hasPermission = User.HasClaim ("permissions", "_Read_tankStock");
        if (!hasPermission) return Forbid ();

        try {
            // Get policy configuration from the future records service
            var policyConfig = await _futureRecordsService.GetFutureRecordsPolicyAsync (HttpContext.RequestAborted);

            var policyData = new {
                FutureRecordsPolicy = policyConfig.Policy,
                ShowDetailedWarnings = policyConfig.ShowDetailedWarnings,
                MaxHistoricalDays = policyConfig.MaxHistoricalDays,
                AllowOverride = policyConfig.AllowOverride
            };

            return Ok (FMSResponse<object>.Success (policyData, "Policy retrieved successfully"));
        } catch (Exception ex) {
            return BadRequest (FMSResponse<object>.Failed ($"Failed to retrieve policy: {ex.Message}"));
        }
    }

    [HttpGet ("details/{id:int}")]
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

    [HttpPost ("openingstock")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateOpeningStock ([FromQuery] int tankId, decimal amount, DateTimeOffset dateTime) {
        // var hasPermission = User.HasClaim("permissions", "_openingStock");
        // if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest (new FMSResponseMessage (false, "Invalid Tank ID"));
        if (amount <= 0) return BadRequest (new FMSResponseMessage (false, "Opening stock should be greater than 0"));
        // Normalize the provided date to UTC before comparison to avoid false positives when clients send local time
        DateTime dateTimeUtc = dateTime.UtcDateTime;

        Claim? userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));

        if (userIdClaim == null) {
            return BadRequest (new FMSResponseMessage (false, "Invalid User ID"));
        }

        FMSResponseMessage result = await _mediator.Send (new OpeningStockCommand (tankId, amount, userIdClaim.Value, dateTimeUtc));

        if (result.Success) {
            await _hubContext.Clients.All.SendAsync ("TankStockUpdate", result);
        }

        if (!result.Success) {
            return BadRequest (result);
        }

        return Ok (result);

    }

    [HttpPost ("closingstock")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateClosingStock ([FromQuery] int tankId, decimal amount, DateTimeOffset dateTime) {
        // var hasPermission = User.HasClaim("permissions", "_closingStock");
        // if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest (new FMSResponseMessage (false, "Invalid Tank ID"));
        if (amount <= 0) return BadRequest (new FMSResponseMessage (false, "Closing stock should be greater than 0"));
        // Normalize to UTC for consistent comparison
        DateTime dateTimeUtc = dateTime.UtcDateTime;

        Claim? userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));

        if (userIdClaim == null) {
            return BadRequest (new FMSResponseMessage (false, "Invalid User ID"));
        }
        FMSResponseMessage result = await _mediator.Send (new ClosingStockCommand (tankId, amount, userIdClaim.Value, dateTimeUtc));

        if (!result.Success) {
            return BadRequest (result);
        }

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
    // [HttpPost ("reconcile")]
    // [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    // public async Task<IActionResult> ReconcileTankStocks ([FromBody] ReconcileRequest request) {
    //     // var hasPermission = User.HasClaim("permissions", "_tankManagement");
    //     // if (!hasPermission) return Forbid();

    //     var userIdClaim = User.Claims.FirstOrDefault (c =>
    //         c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
    //         Guid.TryParse (c.Value, out _));

    //     if (userIdClaim == null)
    //         return BadRequest (new FMSResponseMessage (false, "Invalid User ID"));

    //     // Call the reconciliation service
    //     var result = await _tankVolumeHistoryService.ReconcileAllTankCurrentStocksAsync (
    //         userIdClaim.Value,
    //         request.SiteId,
    //         HttpContext.RequestAborted);

    //     if (!result.Success)
    //         return BadRequest (result);

    //     return Ok (result);
    // }

    /// <summary>
    /// Creates a new stock adjustment
    /// </summary>
    [HttpPost ("adjustments")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateStockAdjustment ([FromBody] StockAdjustmentDTO adjustmentDTO) {
        var hasPermission = User.HasClaim ("permissions", "_Create_tankStock");
        if (!hasPermission) return Forbid ();

        if (!ModelState.IsValid) return BadRequest (ModelState);

        var userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));

        if (userIdClaim == null)
            return BadRequest (new FMSResponseMessage (false, "Invalid User ID"));

        adjustmentDTO.CreatedBy = userIdClaim.Value;

        var result = await _mediator.Send (new CreateStockAdjustmentCommand (adjustmentDTO));

        if (!result.IsSuccess)
            return BadRequest (result);

        return Ok (result);
    }

    /// <summary>
    /// Gets stock adjustments with optional filtering
    /// </summary>
    [HttpGet ("adjustments")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetStockAdjustments (
        [FromQuery] int? siteId = null, [FromQuery] int? tankId = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null) {
        var hasPermission = User.HasClaim ("permissions", "_Read_tankStock");
        if (!hasPermission) return Forbid ();

        var result = await _mediator.Send (new GetStockAdjustmentsQuery (siteId, tankId, startDate, endDate));

        if (!result.IsSuccess)
            return BadRequest (result);

        return Ok (result);
    }

    /// <summary>
    /// Gets stock discrepancies for reconciliation dashboard
    /// </summary>
    [HttpGet ("discrepancies")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetStockDiscrepancies (
        [FromQuery] int? siteId = null, [FromQuery] decimal threshold = 10) {
        var hasPermission = User.HasClaim ("permissions", "_Read_tankStock");
        if (!hasPermission) return Forbid ();

        var result = await _mediator.Send (new GetStockDiscrepanciesQuery (siteId, threshold));

        if (!result.IsSuccess)
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
    public required string UserId { get; set; }
}

/// <summary>
/// Request model for historical entry validation
/// </summary>
public class HistoricalEntryValidationRequest {
    /// <summary>
    /// The tank ID
    /// </summary>
    public int TankId { get; set; }

    /// <summary>
    /// The date of the historical entry
    /// </summary>
    public DateTime EntryDate { get; set; }

    /// <summary>
    /// The type of entry (OpeningStock, ClosingStock, TransferOut, etc.)
    /// </summary>
    public VolumeChangeReasonEnum EntryType { get; set; }
}