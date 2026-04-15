/**
 * File: TankVolumeHistoryController.cs
 * Purpose: Handles tank volume history retrieval, validation, deletion, and admin edits.
 * Dependencies: MediatR, tank volume commands/queries, future-record validation services.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - GetTankVolumeHistoryFiltered(): Retrieves filtered transaction history.
 * - DeleteTransaction(): Deletes transactions with user audit context.
 * - UpdateTransaction(): Performs admin-only direct transaction updates.
 */
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs;
using FMS.Application.Features.TankManagement.TankVolumeHistory.Queries;
using FMS.Application.Queries.Database.FMSQuery.TankVolumeHistory;
using FMS.Application.Services.Configuration;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankVolumeHistory.Read)]
    public class TankVolumeHistoryController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TankVolumeHistoryController(IMediator mediator)
        {
            _mediator = mediator;
        }

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? string.Empty;

            return Guid.TryParse(userId, out _);
        }

        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Read)]
        public async Task<IActionResult> GetTankVolumeHistory()
        {
            var result = await _mediator.Send(new GetTankVolumeHistoryQuery());
            if (result == null) return NoContent();
            return Ok(result);
        }

        [HttpGet("filtered")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Read)]
        public async Task<IActionResult> GetTankVolumeHistoryFiltered(
            [FromQuery] int? siteId = null,
            [FromQuery] int? tankId = null,
            [FromQuery] string? recordedBy = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? take = 100,
            [FromQuery] bool? includeVehicleNames = true,
            [FromQuery] bool? useManualDispensing = false)
        {
            // Validate parameters
            if (take.HasValue && take.Value <= 0)
                return BadRequest("Take parameter must be greater than 0");

            if (startDate.HasValue && endDate.HasValue && startDate.Value > endDate.Value)
                return BadRequest("Start date cannot be greater than end date");

            var query = new GetTankVolumeHistoryFilteredQuery
            {
                SiteId = siteId,
                TankId = tankId,
                RecordedBy = recordedBy,
                StartDate = startDate,
                EndDate = endDate,
                Take = take,
                IncludeVehicleNames = includeVehicleNames,
                UseManualDispensing = useManualDispensing
            };

            var result = await _mediator.Send(query);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Data);
        }

        [HttpGet("byTankAndDateRange")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Read)]
        public async Task<IActionResult> GetTankVolumeHistoryById(DateTime startDate, DateTime endDate, int TankId)
        {
            if (TankId <= 0) return BadRequest("Invalid ID");
            if (startDate == default || endDate == default) return BadRequest("Invalid Date Range");

            var result = await _mediator.Send(new GetTankVolumeHistoryByTankIdQuery(startDate, endDate, TankId));
            if (result == null) return NotFound();
            if (result.Success == false) return BadRequest(result.Message);

            return Ok(result.Data);
        }

        [HttpGet("byDateRange")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Read)]
        public async Task<IActionResult> GetTankVolumeHistoryByDateRange(DateTime StartDate, DateTime EndDate)
        {
            if (StartDate == default || EndDate == default) return BadRequest("Invalid Date Range");
            var result = await _mediator.Send(new GetTankVolumeHistoryByDateRangeQuery(StartDate, EndDate));
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("bySite")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Read)]
        public async Task<IActionResult> GetTankVolumeHistoryBySite(DateTime startDate, DateTime endDate, int siteId)
        {
            if (siteId <= 0) return BadRequest("Invalid Site ID");
            if (startDate == default || endDate == default) return BadRequest("Invalid Date Range");

            var result = await _mediator.Send(new GetTankVolumeHistoryBySiteQuery(startDate, endDate, siteId));
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpGet("users")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Read)]
        public async Task<IActionResult> GetUsersForFilter()
        {
            var result = await _mediator.Send(new GetAllUsersForFilterQuery());

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Data);
        }

        /// <summary>
        /// Validates if a transaction can be deleted based on future records policy
        /// </summary>
        [HttpPost("validate-delete")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Delete)]
        public async Task<IActionResult> ValidateDelete([FromBody] ValidateDeleteRequest request)
        {
            if (request.TransactionId.HasValue && request.TransactionId.Value > 0)
            {
                var coordinatorValidation = await _mediator.Send(
                    new ValidateBulkDeleteTankVolumeHistoryCommand(new List<int> { request.TransactionId.Value }, UserConfirmed: false));

                if (!coordinatorValidation.IsSuccess)
                    return BadRequest(coordinatorValidation);

                return Ok(coordinatorValidation.Data);
            }

            // Input validation
            if (request.TankId <= 0)
                return BadRequest("Invalid tank ID");

            if (request.EntryDate == default)
                return BadRequest("Invalid entry date");

            if (!Enum.IsDefined(typeof(VolumeChangeReasonEnum), request.EntryType))
                return BadRequest("Invalid entry type");

            try
            {
                var futureRecordsService = new TankStockFutureRecordsService(
                    HttpContext.RequestServices.GetService<GpsdataContext>(),
                    HttpContext.RequestServices.GetService<ISystemConfigurationService>(),
                    HttpContext.RequestServices.GetService<ILogger<TankStockFutureRecordsService>>());

                var result = await futureRecordsService.ValidateHistoricalEntryAsync(
                    request.TankId,
                    request.EntryDate,
                    request.EntryType);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Validation failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Deletes a tank volume history transaction
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Delete)]
        public async Task<IActionResult> DeleteTransaction(int id, [FromQuery] bool userConfirmed = false)
        {
            if (id <= 0)
                return BadRequest("Invalid transaction ID");

            try
            {
                if (!userConfirmed)
                {
                    var validationResult = await _mediator.Send(
                        new ValidateBulkDeleteTankVolumeHistoryCommand(new List<int> { id }, UserConfirmed: false));

                    if (!validationResult.IsSuccess)
                        return BadRequest(validationResult);
                }

                // Get the current user identifier
                string? deletedBy = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;

                var command = new DeleteTankVolumeHistoryCommand(
                    DeletedBy: deletedBy,
                    Id: id,
                    ValidateFutureRecords: !userConfirmed);

                var result = await _mediator.Send(command);

                if (!result.Success)
                    return BadRequest(result.Message);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Delete failed: {ex.Message}");
            }
        }

        [HttpPost("bulk-validate-delete")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Delete)]
        public async Task<IActionResult> ValidateBulkDelete([FromBody] BulkDeleteTransactionRequest request)
        {
            if (request.TransactionIds == null || request.TransactionIds.Count == 0)
                return BadRequest("At least one transaction ID must be provided");

            var result = await _mediator.Send(new ValidateBulkDeleteTankVolumeHistoryCommand(request.TransactionIds, request.UserConfirmed));
            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result.Data);
        }

        [HttpPost("bulk-delete")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Delete)]
        public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteTransactionRequest request)
        {
            if (request.TransactionIds == null || request.TransactionIds.Count == 0)
                return BadRequest("At least one transaction ID must be provided");

            try
            {
                string? deletedBy = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;

                var result = await _mediator.Send(new BulkDeleteTankVolumeHistoryCommand(
                    request.TransactionIds,
                    deletedBy ?? string.Empty,
                    request.UserConfirmed));

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result.Data);
            }
            catch (Exception ex)
            {
                return BadRequest($"Bulk delete failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Gets detailed transaction information including reference data
        /// </summary>
        [HttpGet("{id}/details")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Read)]
        public async Task<IActionResult> GetTransactionDetails(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid transaction ID");

            try
            {
                var result = await _mediator.Send(new GetTransactionDetailsQuery(id));

                if (!result.Success)
                    return NotFound(result.Message);

                // Cast to generic type to access Data property
                if (result is FMSResponseMessage<TransactionDetailsDto> typedResult)
                {
                    return Ok(typedResult.Data);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to get transaction details: {ex.Message}");
            }
        }

        /// <summary>
        /// Validates if a transaction can be updated
        /// </summary>
        [HttpPost("validate-update")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ValidateUpdate([FromBody] ValidateUpdateRequest request)
        {
            // var hasPermission = User.HasClaim("permissions", "_Update_tankVolumeHistory");
            // if (!hasPermission) return Forbid();

            if (request.TransactionId <= 0)
                return BadRequest("Invalid transaction ID");

            try
            {
                var futureRecordsService = new TankStockFutureRecordsService(
                    HttpContext.RequestServices.GetService<GpsdataContext>(),
                    HttpContext.RequestServices.GetService<ISystemConfigurationService>(),
                    HttpContext.RequestServices.GetService<ILogger<TankStockFutureRecordsService>>());

                var result = await futureRecordsService.ValidateHistoricalEntryAsync(
                    request.TankId,
                    request.Timestamp,
                    request.ChangeReason);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Validation failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Triggers recalculation of volume history for a tank
        /// </summary>
        [HttpPost("recalculate")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> RecalculateVolumeHistory([FromBody] RecalculateRequest request)
        {
            // var hasPermission = User.HasClaim("permissions", "_Update_tankVolumeHistory");
            // if (!hasPermission) return Forbid();

            if (request.TankId <= 0)
                return BadRequest("Invalid tank ID");

            try
            {
                var fromDate = request.FromDate ?? DateTime.UtcNow.Date;

                var result = await _mediator.Send(new UpdateTankVolumeHistoryCommand(
                    request.TankId,
                    fromDate,
                    IsHistoricalUpdate: true,
                    UpdateTankCurrentStock: true));

                if (!result.Success)
                    return BadRequest(result.Message);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Recalculation failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Updates a tank volume history transaction (requires update permission)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.TankVolumeHistory.Update)]
        public async Task<IActionResult> UpdateTransaction(int id, [FromBody] UpdateTransactionRequest request)
        {
            if (id <= 0)
                return BadRequest("Invalid transaction ID");

            if (string.IsNullOrWhiteSpace(request.UpdateReason))
                return BadRequest("Update reason is required");

            try
            {
                // Get the current user identifier
                string? updatedBy = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;

                // Get the transaction
                var httpContext = HttpContext;
                if (httpContext == null)
                    return BadRequest("Request services are unavailable");

                var services = httpContext.RequestServices;
                var context = services.GetRequiredService<GpsdataContext>();
                var transaction = await context.TankVolumeHistories
                    .FirstOrDefaultAsync(t => t.Id == id && (t.IsDeleted != true));

                if (transaction == null)
                    return NotFound($"Transaction with ID {id} not found");

                var requestedNewVolume = request.NewVolume ?? request.VolumeChange;

                // Update the transaction based on its semantic type.
                var oldVolumeChange = transaction.VolumeChange;
                var oldNewVolume = transaction.NewVolume;

                if (transaction.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                {
                    transaction.NewVolume = requestedNewVolume;
                    transaction.VolumeChange = 0;

                    if (transaction.ReferenceId.HasValue)
                    {
                        var linkedTankStock = await context.Tankstocks
                            .FirstOrDefaultAsync(ts => ts.EntryId == transaction.ReferenceId.Value && !ts.IsDeleted);

                        if (linkedTankStock != null)
                        {
                            linkedTankStock.ManualOpeningLevel = requestedNewVolume;
                        }
                    }
                }
                else if (transaction.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                {
                    var previousTransaction = await context.TankVolumeHistories
                        .Where(t => t.TankId == transaction.TankId &&
                                    t.Id != transaction.Id &&
                                    t.Timestamp < transaction.Timestamp &&
                                    (t.IsDeleted != true))
                        .OrderByDescending(t => t.Timestamp)
                        .ThenByDescending(t => t.Id)
                        .FirstOrDefaultAsync();

                    transaction.NewVolume = requestedNewVolume;
                    transaction.VolumeChange = requestedNewVolume - (previousTransaction?.NewVolume ?? 0m);

                    if (transaction.ReferenceId.HasValue)
                    {
                        var linkedTankStock = await context.Tankstocks
                            .FirstOrDefaultAsync(ts => ts.EntryId == transaction.ReferenceId.Value && !ts.IsDeleted);

                        if (linkedTankStock != null)
                        {
                            linkedTankStock.ManualClosingLevel = requestedNewVolume;
                        }
                    }
                }
                else
                {
                    transaction.VolumeChange = request.VolumeChange;
                }

                // Log the change (optional - add audit trail)
                var logger = HttpContext.RequestServices.GetService<ILogger<TankVolumeHistoryController>>();
                logger?.LogInformation(
                    "Transaction {TransactionId} updated by {UserId}. VolumeChange: {OldValue} -> {NewValue}, NewVolume: {OldNewVolume} -> {NewNewVolume}. Reason: {Reason}",
                    id, updatedBy, oldVolumeChange, transaction.VolumeChange, oldNewVolume, transaction.NewVolume, request.UpdateReason);

                await context.SaveChangesAsync();

                // Recalculate if requested
                if (request.RecalculateHistory)
                {
                    var result = await _mediator.Send(new UpdateTankVolumeHistoryCommand(
                        transaction.TankId ?? 0,
                        transaction.Timestamp,
                        IsHistoricalUpdate: true,
                        UpdateTankCurrentStock: true));

                    if (!result.Success)
                    {
                        return Ok(new
                        {
                            success = true,
                            message = "Transaction updated, but recalculation failed: " + result.Message,
                            recalculationFailed = true
                        });
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = "Transaction updated successfully",
                    transactionId = id,
                    oldVolumeChange = oldVolumeChange,
                    newVolumeChange = transaction.VolumeChange,
                    oldNewVolume = oldNewVolume,
                    newNewVolume = transaction.NewVolume,
                    recalculated = request.RecalculateHistory
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Update failed: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Request model for updating a transaction
    /// </summary>
    public class UpdateTransactionRequest
    {
        public decimal VolumeChange { get; set; }
        public decimal? NewVolume { get; set; }
        public bool RecalculateHistory { get; set; } = true;
        public string UpdateReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model for delete validation
    /// </summary>
    public class ValidateDeleteRequest
    {
        public int? TransactionId { get; set; }
        public int TankId { get; set; }
        public DateTime EntryDate { get; set; }
        public VolumeChangeReasonEnum EntryType { get; set; }
    }

    /// <summary>
    /// Request model for update validation
    /// </summary>
    public class ValidateUpdateRequest
    {
        public int TransactionId { get; set; }
        public int TankId { get; set; }
        public DateTime Timestamp { get; set; }
        public VolumeChangeReasonEnum ChangeReason { get; set; }
    }

    /// <summary>
    /// Request model for recalculation
    /// </summary>
    public class RecalculateRequest
    {
        public int TankId { get; set; }
        public DateTime? FromDate { get; set; }
    }

    /// <summary>
    /// Request model for transaction deletion
    /// </summary>
    public class DeleteTransactionRequest
    {
        public string? DeletionReason { get; set; }
        public bool UserConfirmed { get; set; }
    }

    public class BulkDeleteTransactionRequest
    {
        public List<int> TransactionIds { get; set; } = new();
        public bool UserConfirmed { get; set; }
    }
}