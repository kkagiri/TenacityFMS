using System;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
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
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers {
    [Route ("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class TankVolumeHistoryController : ControllerBase {
        private readonly IMediator _mediator;

        public TankVolumeHistoryController (IMediator mediator) {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistory () {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            var result = await _mediator.Send (new GetTankVolumeHistoryQuery ());
            if (result == null) return NoContent ();
            return Ok (result);
        }

        [HttpGet ("filtered")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistoryFiltered (
            [FromQuery] int? siteId = null, [FromQuery] int? tankId = null, [FromQuery] string? recordedBy = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int? take = 100, [FromQuery] bool? includeVehicleNames = true) {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            // Validate parameters
            if (take.HasValue && take.Value <= 0)
                return BadRequest ("Take parameter must be greater than 0");

            if (startDate.HasValue && endDate.HasValue && startDate.Value > endDate.Value)
                return BadRequest ("Start date cannot be greater than end date");

            var query = new GetTankVolumeHistoryFilteredQuery {
                SiteId = siteId,
                TankId = tankId,
                RecordedBy = recordedBy,
                StartDate = startDate,
                EndDate = endDate,
                Take = take,
                IncludeVehicleNames = includeVehicleNames
            };

            var result = await _mediator.Send (query);

            if (!result.IsSuccess)
                return BadRequest (result.Message);

            return Ok (result.Data);
        }

        [HttpGet ("byTankAndDateRange")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistoryById (DateTime startDate, DateTime endDate, int TankId) {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            if (TankId <= 0) return BadRequest ("Invalid ID");
            if (startDate == default || endDate == default) return BadRequest ("Invalid Date Range");

            var result = await _mediator.Send (new GetTankVolumeHistoryByTankIdQuery (startDate, endDate, TankId));
            if (result == null) return NotFound ();
            if (result.Success == false) return BadRequest (result.Message);

            return Ok (result.Data);
        }

        [HttpGet ("byDateRange")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistoryByDateRange (DateTime StartDate, DateTime EndDate) {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            if (StartDate == default || EndDate == default) return BadRequest ("Invalid Date Range");
            var result = await _mediator.Send (new GetTankVolumeHistoryByDateRangeQuery (StartDate, EndDate));
            if (result == null) return NotFound ();
            return Ok (result);
        }

        [HttpGet ("bySite")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistoryBySite (DateTime startDate, DateTime endDate, int siteId) {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            if (siteId <= 0) return BadRequest ("Invalid Site ID");
            if (startDate == default || endDate == default) return BadRequest ("Invalid Date Range");

            var result = await _mediator.Send (new GetTankVolumeHistoryBySiteQuery (startDate, endDate, siteId));
            if (result == null) return NotFound ();

            return Ok (result);
        }

        [HttpGet ("users")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetUsersForFilter () {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            var result = await _mediator.Send (new GetAllUsersForFilterQuery ());

            if (!result.IsSuccess)
                return BadRequest (result.Message);

            return Ok (result.Data);
        }

        /// <summary>
        /// Validates if a transaction can be deleted based on future records policy
        /// </summary>
        [HttpPost ("validate-delete")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ValidateDelete ([FromBody] ValidateDeleteRequest request) {
            var hasPermission = User.HasClaim ("permissions", "_Delete_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            // Input validation
            if (request.TankId <= 0)
                return BadRequest ("Invalid tank ID");

            if (request.EntryDate == default)
                return BadRequest ("Invalid entry date");

            if (!Enum.IsDefined (typeof (VolumeChangeReasonEnum), request.EntryType))
                return BadRequest ("Invalid entry type");

            try {
                var futureRecordsService = new TankStockFutureRecordsService (
                    HttpContext.RequestServices.GetService<GpsdataContext> (),
                    HttpContext.RequestServices.GetService<ISystemConfigurationService> (),
                    HttpContext.RequestServices.GetService<ILogger<TankStockFutureRecordsService>> ());

                var result = await futureRecordsService.ValidateHistoricalEntryAsync (
                    request.TankId,
                    request.EntryDate,
                    request.EntryType);

                return Ok (result);
            } catch (Exception ex) {
                return BadRequest ($"Validation failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Deletes a tank volume history transaction
        /// </summary>
        [HttpDelete ("{id}")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteTransaction (int id, [FromQuery] bool userConfirmed = false) {
            var hasPermission = User.HasClaim ("permissions", "_Delete_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            if (id <= 0)
                return BadRequest ("Invalid transaction ID");

            try {
                // Get the current user identifier
                var userIdClaim = User.Claims.FirstOrDefault (c =>
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                    Guid.TryParse (c.Value, out _));

                var deletedBy = userIdClaim?.Value;

                var command = new DeleteTankVolumeHistoryCommand (
                    DeletedBy: deletedBy,
                    Id: id,
                    ValidateFutureRecords: !userConfirmed);

                var result = await _mediator.Send (command);

                if (!result.Success)
                    return BadRequest (result.Message);

                return Ok (result);
            } catch (Exception ex) {
                return BadRequest ($"Delete failed: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Request model for delete validation
    /// </summary>
    public class ValidateDeleteRequest {
        public int TankId { get; set; }
        public DateTime EntryDate { get; set; }
        public VolumeChangeReasonEnum EntryType { get; set; }
    }

    /// <summary>
    /// Request model for transaction deletion
    /// </summary>
    public class DeleteTransactionRequest {
        public string? DeletionReason { get; set; }
        public bool UserConfirmed { get; set; }
    }
}