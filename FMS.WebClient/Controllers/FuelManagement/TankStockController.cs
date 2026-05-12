/**
 * File: TankStockController.cs
 * Purpose: Handles tank stock operations, imports, adjustments, and analysis endpoints.
 * Dependencies: MediatR, SignalR, tank stock services, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - CreateOpeningStock: Records opening stock with authenticated user context.
 * - BulkImportTankStock: Validates and imports tank stock entries in bulk.
 * - GetVarianceAnalysis: Returns variance analytics for tank stock behavior.
 */
using FMS.Application.Command.DatabaseCommand.DeliveriesCommands;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Application.Command.DatabaseCommand.TankTransferCommand;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Delivery.cs;
using FMS.Application.Features.FMS.TankStock;
using FMS.Application.Features.FMS.TankTransfer;
using FMS.Application.Features.TankManagement.BulkImport.Commands;
using FMS.Application.Features.TankManagement.BulkImport.DTOs;
using FMS.Application.Features.TankManagement.Deliveries.Queries;
using FMS.Application.Features.TankManagement.TankMeasurements.Queries;
using FMS.Application.Features.TankManagement.Queries;
using FMS.Application.Features.TankManagement.TankStock.Commands;
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

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.TankStock.Read)]
public class TankStockController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
    private readonly TankStockFutureRecordsService _futureRecordsService;
    private readonly OpeningStockValidationService _openingStockValidationService;
    private readonly IHubContext<FrontEndHub> _hubContext;

    public TankStockController(
        IMediator mediator,
        TankVolumeHistoryIntegrationService tankVolumeHistoryService,
        TankStockFutureRecordsService futureRecordsService,
        OpeningStockValidationService openingStockValidationService,
        IHubContext<FrontEndHub> hubContext)
    {
        _mediator = mediator;
        _tankVolumeHistoryService = tankVolumeHistoryService;
        _futureRecordsService = futureRecordsService;
        _openingStockValidationService = openingStockValidationService;
        _hubContext = hubContext;
    }

    private bool TryGetCurrentUserId(out string userId)
    {
        userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? string.Empty;

        return Guid.TryParse(userId, out _);
    }

    /// <summary>
    /// Gets tank stock records with optional filtering by date range, site, and tank
    /// </summary>
    /// <param name="startDate">Start date filter (inclusive)</param>
    /// <param name="endDate">End date filter (inclusive)</param>
    /// <param name="siteIds">Site IDs to filter by (multiple allowed)</param>
    /// <param name="tankIds">Tank IDs to filter by (multiple allowed)</param>
    /// <returns>Filtered list of tank stock records</returns>
    [HttpGet]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetTankStocks(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] List<int>? siteIds = null,
        [FromQuery] List<int>? tankIds = null)
    {
        var query = new GetTankStockListQuery(
            StartDate: startDate,
            EndDate: endDate,
            SiteIds: siteIds,
            TankIds: tankIds
        );

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Gets in-tank deliveries (PTS auto-detected) filtered by site and optional date range/status.
    /// </summary>
    [HttpGet("in-tank-deliveries")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetInTankDeliveries(
        [FromQuery] int siteId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? status = null)
    {
        if (siteId <= 0)
        {
            return BadRequest(FMSResponse.FailedResponse("Invalid Site ID"));
        }

        var result = await _mediator.Send(new GetInTankDeliveriesBySiteQuery(
            SiteId: siteId,
            StartDate: startDate,
            EndDate: endDate,
            Status: status));

        return Ok(result);
    }

    /// <summary>
    /// Gets tank measurement history for charting (volume/temperature/water levels).
    /// </summary>
    [HttpGet("tank-measurements/history")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetTankMeasurementHistory(
        [FromQuery] int tankId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        if (tankId <= 0)
        {
            return BadRequest(FMSResponse.FailedResponse("Invalid Tank ID"));
        }

        var result = await _mediator.Send(new GetTankMeasurementHistoryQuery(
            TankId: tankId,
            StartDate: startDate,
            EndDate: endDate));

        return Ok(result);
    }

    /// <summary>
    /// Gets upload status probe reading history for charting (periodic readings from UploadStatus packets).
    /// </summary>
    [HttpGet("upload-status-readings/history")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetUploadStatusProbeReadingHistory(
        [FromQuery] int tankId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        if (tankId <= 0)
        {
            return BadRequest(FMSResponse.FailedResponse("Invalid Tank ID"));
        }

        var result = await _mediator.Send(new GetUploadStatusProbeReadingHistoryQuery(
            TankId: tankId,
            StartDate: startDate,
            EndDate: endDate));

        return Ok(result);
    }

    /// <summary>
    /// Validates if a historical tank stock entry can be processed based on future records policy
    /// </summary>
    /// <param name="request">Historical entry validation request</param>
    /// <returns>Validation result with policy decision and warning messages</returns>
    [HttpPost("validate-historical-entry")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> ValidateHistoricalEntry([FromBody] HistoricalEntryValidationRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _futureRecordsService.ValidateHistoricalEntryAsync(
                request.TankId,
                request.EntryDate,
                request.EntryType,
                HttpContext.RequestAborted);

            // Check if the validation result indicates the entry is not allowed
            if (!result.IsAllowed)
            {
                // Return 422 Unprocessable Entity for validation failures
                var failedResponse = FMSResponse<TankStockFutureRecordsValidationResult>.Failed(result.Message);
                failedResponse.Data = result;
                return UnprocessableEntity(failedResponse);
            }

            // Return success for allowed entries (with or without warnings)
            return Ok(FMSResponse<TankStockFutureRecordsValidationResult>.Success(result, "Validation completed successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(FMSResponse<TankStockFutureRecordsValidationResult>.Failed($"Validation failed: {ex.Message}"));
        }
    }
    /// <summary>
    /// Gets the current tank stock future records policy configuration
    /// </summary>
    /// <returns>Current policy configuration</returns>
    [HttpGet("future-records-policy")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme),]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetFutureRecordsPolicy()
    {
        try
        {
            // Get policy configuration from the future records service
            var policyConfig = await _futureRecordsService.GetFutureRecordsPolicyAsync(HttpContext.RequestAborted);

            var policyData = new
            {
                FutureRecordsPolicy = policyConfig.Policy,
                ShowDetailedWarnings = policyConfig.ShowDetailedWarnings,
                MaxHistoricalDays = policyConfig.MaxHistoricalDays,
                AllowOverride = policyConfig.AllowOverride
            };

            return Ok(FMSResponse<object>.Success(policyData, "Policy retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(FMSResponse<object>.Failed($"Failed to retrieve policy: {ex.Message}"));
        }
    }

    [HttpGet("details/{id:int}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetTankStockById(int id)
    {
        if (id <= 0) return BadRequest("Invalid ID");

        var result = await _mediator.Send(new GetTankStockByIdQuery(id));
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Create)]
    public async Task<IActionResult> CreateTankStock([FromBody] TankStockDTO tankStockDTO)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var id = await _mediator.Send(new CreateTankStockCommand(tankStockDTO));

        return CreatedAtAction(nameof(GetTankStockById), new { id = id }, tankStockDTO);
    }

    /// <summary>
    /// Updates a TankStock entry. Optionally processes TankVolumeHistory updates.
    /// </summary>
    /// <param name="id">Entry ID to update</param>
    /// <param name="tankStockDTO">Updated tank stock data</param>
    /// <param name="processHistory">If true, updates related TankVolumeHistory records (default: false)</param>
    /// <returns>Success/failure response</returns>
    [HttpPut("{id:int}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Update)]
    public async Task<IActionResult> UpdateTankStock(
        int id,
        [FromBody] TankStockDTO tankStockDTO,
        [FromQuery] bool processHistory = false)
    {
        if (id <= 0) return BadRequest(FMSResponse.FailedResponse("Invalid ID"));

        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _mediator.Send(new UpdateTankStockCommand(tankStockDTO, id, processHistory));

        if (!result)
        {
            return NotFound(FMSResponse.FailedResponse($"Tank stock entry with ID {id} not found"));
        }

        // Notify clients about the update
        await _hubContext.Clients.All.SendAsync("TankStockUpdate", new
        {
            Success = true,
            EntryId = id,
            Action = "Updated",
            Message = "Tank stock entry updated successfully",
            ProcessHistory = processHistory
        });

        return Ok(FMSResponse.SuccessResponse("Tank stock entry updated successfully"));
    }

    /// <summary>
    /// Soft deletes a TankStock entry. Optionally processes TankVolumeHistory updates.
    /// </summary>
    /// <param name="id">Entry ID to delete</param>
    /// <param name="processHistory">If true, updates related TankVolumeHistory records (default: false)</param>
    /// <returns>Success/failure response</returns>
    [HttpDelete("{id:int}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Delete)]
    public async Task<IActionResult> DeleteTankStock(
        int id,
        [FromQuery] bool processHistory = false)
    {
        if (id <= 0) return BadRequest(FMSResponse.FailedResponse("Invalid ID"));

        if (!TryGetCurrentUserId(out var userId))
            return BadRequest(FMSResponse.FailedResponse("Invalid User ID"));

        var result = await _mediator.Send(new DeleteTankStockCommand(id, processHistory, userId));

        if (!result.Success)
        {
            return BadRequest(result);
        }

        // Notify clients about the deletion
        await _hubContext.Clients.All.SendAsync("TankStockUpdate", new
        {
            Success = true,
            EntryId = id,
            Action = "Deleted",
            Message = "Tank stock entry deleted successfully",
            ProcessHistory = processHistory
        });

        return Ok(result);
    }

    [HttpPost("openingstock")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateOpeningStock([FromQuery] int tankId, decimal amount, DateTimeOffset dateTime)
    {
        // var hasPermission = User.HasClaim("permissions", "_openingStock");
        // if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest(FMSResponse.FailedResponse("Invalid Tank ID"));
        if (amount <= 0) return BadRequest(FMSResponse.FailedResponse("Opening stock should be greater than 0"));
        // Normalize the provided date to UTC before comparison to avoid false positives when clients send local time
        DateTime dateTimeUtc = dateTime.UtcDateTime;

        if (!TryGetCurrentUserId(out var userId))
            return BadRequest(FMSResponse.FailedResponse("Invalid User ID"));

        FMSResponseMessage result = await _mediator.Send(new OpeningStockCommand(tankId, amount, userId, dateTimeUtc));

        if (result.Success)
        {
            await _hubContext.Clients.All.SendAsync("TankStockUpdate", result);
        }

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);

    }

    [HttpPost("closingstock")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateClosingStock([FromQuery] int tankId, decimal amount, DateTimeOffset dateTime, bool confirmOverride = false)
    {
        // var hasPermission = User.HasClaim("permissions", "_closingStock");
        // if (!hasPermission) return Forbid();
        if (tankId <= 0) return BadRequest(FMSResponse.FailedResponse("Invalid Tank ID"));
        if (amount <= 0) return BadRequest(FMSResponse.FailedResponse("Closing stock should be greater than 0"));
        // Normalize to UTC for consistent comparison
        DateTime dateTimeUtc = dateTime.UtcDateTime;

        if (!TryGetCurrentUserId(out var userId))
            return BadRequest(FMSResponse.FailedResponse("Invalid User ID"));

        FMSResponseMessage result = await _mediator.Send(new ClosingStockCommand(tankId, amount, userId, dateTimeUtc, ConfirmOverride: confirmOverride));

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);

    }

    [HttpPost("transfer")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateTankTransfer([FromBody] TankTransferDTO tankTransferDTO)
    {
        //var hasPermission = User.HasClaim("permissions", "_tankTransfer");
        // if (!hasPermission) return Forbid();
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (!TryGetCurrentUserId(out var userId))
            return BadRequest(FMSResponse.FailedResponse("Invalid User ID"));

        tankTransferDTO.RecordedBy = userId;

        var result = await _mediator.Send(new CreateTankTransfer(tankTransferDTO));

        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Bulk import tank stock data from Excel file
    /// Supports opening, closing, dispensing, transfer IN/OUT, and delivery entries
    /// Performs comprehensive validation with 11 anomaly detection algorithms (backend)
    /// </summary>
    /// <param name="request">Bulk import request containing entries and configuration</param>
    /// <returns>Import result with validation anomalies and statistics</returns>
    [HttpPost("bulk-import")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Create)]
    public async Task<IActionResult> BulkImportTankStock([FromBody] BulkImportRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!TryGetCurrentUserId(out var userId))
            return BadRequest(FMSResponse.FailedResponse("Invalid User ID"));

        // Build command
        var command = new BulkImportTankStockCommand
        {
            Entries = request.Entries,
            ValidateOnly = request.ValidateOnly,
            DuplicateHandling = request.DuplicateHandling,
            IgnoreWarnings = request.IgnoreWarnings,
            SkipValidation = request.SkipValidation,
            UserId = userId,
            StationId = request.StationId
        };

        // Execute command
        var result = await _mediator.Send(command);

        // Return appropriate response based on validation status
        if (!result.IsSuccess)
        {
            if (result.Data?.ValidationResult?.HasBlockingAnomalies == true)
            {
                return UnprocessableEntity(result); // 422 for validation failures
            }
            return BadRequest(result); // 400 for other errors
        }

        // Notify clients if import was successful (not validation-only)
        if (!request.ValidateOnly && result.Data?.ImportedRows > 0)
        {
            await _hubContext.Clients.All.SendAsync("TankStockBulkImport", new
            {
                Success = true,
                ImportedRows = result.Data.ImportedRows,
                Message = result.Message
            });
        }

        return Ok(result);
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
    [HttpPost("adjustments")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Create)]
    public async Task<IActionResult> CreateStockAdjustment([FromBody] StockAdjustmentDTO adjustmentDTO)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (!TryGetCurrentUserId(out var userId))
            return BadRequest(FMSResponse.FailedResponse("Invalid User ID"));

        adjustmentDTO.CreatedBy = userId;

        var result = await _mediator.Send(new CreateStockAdjustmentCommand(adjustmentDTO));

        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Gets stock adjustments with optional filtering
    /// </summary>
    [HttpGet("adjustments")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetStockAdjustments(
        [FromQuery] int? siteId = null, [FromQuery] int? tankId = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _mediator.Send(new GetStockAdjustmentsQuery(siteId, tankId, startDate, endDate));

        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Gets stock discrepancies for reconciliation dashboard
    /// </summary>
    [HttpGet("discrepancies")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetStockDiscrepancies(
        [FromQuery] int? siteId = null, [FromQuery] decimal threshold = 10)
    {
        var result = await _mediator.Send(new GetStockDiscrepanciesQuery(siteId, threshold));

        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Creates a new dispensing volume record (bulk entry)
    /// </summary>
    [HttpPost("dispensing")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Create)]
    public async Task<IActionResult> CreateDispensingVolume([FromQuery] int tankId, decimal dispensedVolume, DateTimeOffset entryDate, string? notes = null)
    {
        if (tankId <= 0) return BadRequest(FMSResponse.FailedResponse("Invalid Tank ID"));
        if (dispensedVolume <= 0) return BadRequest(FMSResponse.FailedResponse("Dispensed volume should be greater than 0"));

        DateTime entryDateUtc = entryDate.UtcDateTime;

        if (!TryGetCurrentUserId(out var userId))
            return BadRequest(FMSResponse.FailedResponse("Invalid User ID"));

        FMSResponseMessage result = await _mediator.Send(new CreateDispensingVolumeCommand(tankId, dispensedVolume, userId, entryDateUtc, notes));

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Gets dispensing volume records with optional filtering
    /// </summary>
    [HttpGet("dispensing")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetDispensingVolumes(
        [FromQuery] int? siteId = null, [FromQuery] int? tankId = null, [FromQuery] string? recordedBy = null,
        [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _mediator.Send(new GetDispensingVolumesQuery(siteId, tankId, recordedBy, startDate, endDate));

        return Ok(result);
    }

    /// <summary>
    /// Updates an existing dispensing volume record
    /// </summary>
    [HttpPut("dispensing/{entryId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Update)]
    public async Task<IActionResult> UpdateDispensingVolume(int entryId, [FromQuery] decimal dispensedVolume, DateTimeOffset entryDate, string? notes = null)
    {
        if (entryId <= 0) return BadRequest(FMSResponse.FailedResponse("Invalid Entry ID"));
        if (dispensedVolume <= 0) return BadRequest(FMSResponse.FailedResponse("Dispensed volume should be greater than 0"));

        DateTime entryDateUtc = entryDate.UtcDateTime;

        FMSResponseMessage result = await _mediator.Send(new UpdateDispensingVolumeCommand(entryId, dispensedVolume, entryDateUtc, notes));

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Deletes a dispensing volume record
    /// </summary>
    [HttpDelete("dispensing/{entryId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Delete)]
    public async Task<IActionResult> DeleteDispensingVolume(int entryId)
    {
        if (entryId <= 0) return BadRequest(FMSResponse.FailedResponse("Invalid Entry ID"));

        FMSResponseMessage result = await _mediator.Send(new DeleteDispensingVolumeCommand(entryId));

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Gets variance analysis data for a specific tank and date range
    /// </summary>
    [HttpGet("variance-analysis")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetVarianceAnalysis(
        [FromQuery] int tankId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] bool useManualDispensing = false,
        [FromQuery] bool useCombinedDispensing = false)
    {
        if (tankId <= 0)
            return BadRequest(FMSResponse.FailedResponse("Invalid Tank ID"));

        if (startDate >= endDate)
            return BadRequest(FMSResponse.FailedResponse("Start date must be before end date"));

        // Validate mutually exclusive dispensing modes
        if (useManualDispensing && useCombinedDispensing)
        {
            return BadRequest(FMSResponse.FailedResponse(
                "Cannot use both manual and combined dispensing modes. Choose one mode."));
        }

        try
        {
            var query = new GetTankVarianceAnalysisQuery(
                tankId,
                startDate,
                endDate,
                useManualDispensing,
                useCombinedDispensing);

            var result = await _mediator.Send(query);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(FMSResponse.FailedResponse($"Failed to retrieve variance analysis: {ex.Message}"));
        }
    }

    /// <summary>
    /// Gets delivery cycle analysis with consumption rates for specific tank(s) and date range
    /// Supports single tank or multiple tanks for site-level analysis
    /// </summary>
    [HttpGet("delivery-cycle-analysis")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetDeliveryCycleAnalysis(
        [FromQuery] int? tankId,  // Single tank ID (for backward compatibility)
        [FromQuery] int[]? tankIds,  // Multiple tank IDs for multi-tank analysis
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] DeliveryCycleAnalysisType analysisType = DeliveryCycleAnalysisType.BetweenDeliveries,
        [FromQuery] bool useManualDispensing = false,
        [FromQuery] bool useCombinedDispensing = false)
    {
        // Validate that either tankId or tankIds is provided
        if (!tankId.HasValue && (tankIds == null || tankIds.Length == 0))
            return BadRequest(FMSResponse.FailedResponse("Either tankId or tankIds must be provided"));

        if (startDate >= endDate)
            return BadRequest(FMSResponse.FailedResponse("Start date must be before end date"));

        // Validate mutually exclusive dispensing modes
        if (useManualDispensing && useCombinedDispensing)
        {
            return BadRequest(FMSResponse.FailedResponse(
                "Cannot use both manual and combined dispensing modes. Choose one mode."));
        }

        try
        {
            var query = new GetDeliveryCycleAnalysisQuery(
                tankId,
                tankIds?.ToList(),
                startDate,
                endDate,
                analysisType,
                useManualDispensing,
                useCombinedDispensing);

            var result = await _mediator.Send(query);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(FMSResponse.FailedResponse($"Failed to retrieve delivery cycle analysis: {ex.Message}"));
        }
    }

    /// <summary>
    /// Gets expected stock for validation before saving stock entry
    /// Calculates expected stock based on previous closing + deliveries + transfers - dispensing
    /// </summary>
    [HttpGet("expected-stock")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetExpectedStock(
        [FromQuery] int tankId,
        [FromQuery] DateTime timestamp,
        [FromQuery] string stockType = "Closing")
    {
        if (tankId <= 0)
            return BadRequest(FMSResponse.FailedResponse("Valid tank ID is required"));

        if (timestamp > DateTime.UtcNow)
            return BadRequest(FMSResponse.FailedResponse("Timestamp cannot be in the future"));

        try
        {
            var query = new GetExpectedStockQuery(tankId, timestamp, stockType);
            var result = await _mediator.Send(query);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(FMSResponse.FailedResponse($"Failed to calculate expected stock: {ex.Message}"));
        }
    }

    /// <summary>
    /// Gets transfer-based reconciliation analysis for a tank
    /// Analyzes periods between stock entries, tracking transfers and dispensing with variance detection
    /// </summary>
    [HttpGet("transfer-reconciliation")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public async Task<IActionResult> GetTransferReconciliationAnalysis(
        [FromQuery] int tankId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] bool includeTransferDetails = false)
    {
        if (tankId <= 0)
            return BadRequest(FMSResponse.FailedResponse("Valid tank ID is required"));

        if (startDate >= endDate)
            return BadRequest(FMSResponse.FailedResponse("Start date must be before end date"));

        try
        {
            var query = new GetTransferReconciliationAnalysisQuery(
                tankId,
                startDate,
                endDate,
                includeTransferDetails);

            var result = await _mediator.Send(query);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(FMSResponse.FailedResponse($"Failed to retrieve transfer reconciliation analysis: {ex.Message}"));
        }
    }

}

/// <summary>
/// Request model for tank reconciliation
/// </summary>
public class ReconcileRequest
{
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
public class HistoricalEntryValidationRequest
{
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

/// <summary>
/// Request model for bulk import tank stock
/// </summary>
public class BulkImportRequest
{
    /// <summary>
    /// List of rows from Excel file
    /// </summary>
    public List<BulkImportRowDTO> Entries { get; set; } = new List<BulkImportRowDTO>();

    /// <summary>
    /// If true, only validates without importing
    /// </summary>
    public bool ValidateOnly { get; set; }

    /// <summary>
    /// How to handle duplicate entries (Skip or Replace)
    /// </summary>
    public DuplicateHandlingMode DuplicateHandling { get; set; } = DuplicateHandlingMode.Skip;

    /// <summary>
    /// Whether to proceed even with warnings
    /// </summary>
    public bool IgnoreWarnings { get; set; }

    /// <summary>
    /// Whether to skip validation checks (controlled by system configuration)
    /// </summary>
    public bool SkipValidation { get; set; }

    /// <summary>
    /// Optional: Station ID context
    /// </summary>
    public int? StationId { get; set; }
}
