/**
 * File: FuelAuditController.cs
 * Purpose: Manages fuel audit workflow endpoints including draft, calculation, and finalization.
 * Dependencies: MediatR, fuel audit commands/queries, ILogger, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - SaveDraftAudit(): Persists wizard draft data with user context.
 * - CalculateAudit(): Runs variance calculations for an audit.
 * - CancelAudit(): Cancels an audit with audit trail user metadata.
 */
using System.Threading.Tasks;
using System.Security.Claims;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.Commands;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Queries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.FuelManagement
{
    /// <summary>
    /// Controller for Fuel Audit CRUD operations
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public class FuelAuditController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<FuelAuditController> _logger;

        public FuelAuditController(IMediator mediator, ILogger<FuelAuditController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue("id")
                ?? string.Empty;

            return Guid.TryParse(userId, out _);
        }

        /// <summary>
        /// Get list of fuel audits with optional filtering
        /// </summary>
        /// <param name="filter">Filter parameters</param>
        /// <returns>List of fuel audit summaries</returns>
        [HttpGet]
        public async Task<IActionResult> GetFuelAudits([FromQuery] FuelAuditFilterDTO filter)
        {
            _logger.LogInformation("Getting fuel audits with filter: {@Filter}", filter);

            var query = new GetFuelAuditsQuery(filter);
            var result = await _mediator.Send(query);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get fuel audit by ID with full details
        /// </summary>
        /// <param name="id">Audit ID</param>
        /// <param name="includeReadings">Include tank readings</param>
        /// <param name="includeVariances">Include variances</param>
        /// <param name="includeFlags">Include flags</param>
        /// <returns>Fuel audit details</returns>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetFuelAuditById(
            long id,
            [FromQuery] bool includeReadings = true,
            [FromQuery] bool includeVariances = true,
            [FromQuery] bool includeFlags = true)
        {
            _logger.LogInformation("Getting fuel audit {AuditId}", id);

            // Note: The query only takes auditId; include flags are for future use
            var query = new GetFuelAuditByIdQuery(id);
            var result = await _mediator.Send(query);

            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Create a new fuel audit
        /// </summary>
        /// <param name="dto">Audit creation data</param>
        /// <returns>Created audit summary</returns>
        [HttpPost]
        public async Task<IActionResult> CreateFuelAudit([FromBody] CreateFuelAuditDTO dto)
        {
            _logger.LogInformation("Creating fuel audit for period {Start} to {End}",
                dto.StartDate, dto.EndDate);

            var command = new CreateFuelAuditCommand(dto);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(
                nameof(GetFuelAuditById),
                new { id = result.Data.Id },
                result);
        }

        /// <summary>
        /// Save draft audit from wizard at any step.
        /// Creates a new draft on Step 1, updates on subsequent steps.
        /// </summary>
        /// <param name="dto">Wizard step data</param>
        /// <returns>Saved draft audit info</returns>
        [HttpPost("save-draft")]
        public async Task<IActionResult> SaveDraftAudit([FromBody] SaveDraftAuditDTO dto)
        {
            _logger.LogInformation("Saving draft audit at step {Step}, AuditId: {AuditId}",
                dto.WizardStep, dto.AuditId);

            // Set user ID from claims if not provided
            if (string.IsNullOrEmpty(dto.UserId) && TryGetCurrentUserId(out var userId))
            {
                dto.UserId = userId;
            }

            var command = new SaveDraftAuditCommand(dto);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Submit or update tanker reading for an audit
        /// </summary>
        /// <param name="id">Audit ID</param>
        /// <param name="dto">Tank reading data</param>
        /// <returns>Updated tank reading</returns>
        [HttpPost("{id:long}/tanker-reading")]
        public async Task<IActionResult> SubmitTankerReading(long id, [FromBody] SubmitTankerReadingDTO dto)
        {
            _logger.LogInformation("Submitting tanker reading for audit {AuditId}, tank {TankId}",
                id, dto.TankId);

            dto.AuditId = id;
            var command = new SubmitTankerReadingCommand(dto);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Calculate audit variances and generate flags
        /// </summary>
        /// <param name="id">Audit ID</param>
        /// <param name="dto">Calculation options</param>
        /// <returns>Updated audit with calculations</returns>
        [HttpPost("{id:long}/calculate")]
        public async Task<IActionResult> CalculateAudit(long id, [FromBody] CalculateAuditDTO dto)
        {
            _logger.LogInformation("Calculating audit {AuditId}", id);

            dto.AuditId = id;
            var command = new CalculateAuditCommand(dto);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Finalize and lock an audit
        /// </summary>
        /// <param name="id">Audit ID</param>
        /// <param name="dto">Finalization data</param>
        /// <returns>Finalized audit</returns>
        [HttpPost("{id:long}/finalize")]
        public async Task<IActionResult> FinalizeAudit(long id, [FromBody] FinalizeAuditDTO dto)
        {
            _logger.LogInformation("Finalizing audit {AuditId}", id);

            dto.AuditId = id;
            var command = new FinalizeAuditCommand(dto);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Cancel an audit
        /// </summary>
        /// <param name="id">Audit ID</param>
        /// <param name="reason">Cancellation reason</param>
        /// <returns>Cancelled audit</returns>
        [HttpPost("{id:long}/cancel")]
        public async Task<IActionResult> CancelAudit(long id, [FromBody] CancelAuditRequest request)
        {
            _logger.LogInformation("Cancelling audit {AuditId}", id);

            // Get the current user ID from claims (or use a default)
            var userId = TryGetCurrentUserId(out var currentUserId) ? currentUserId : "system";

            var command = new CancelAuditCommand(id, userId, request.CancellationReason);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Resolve an audit flag
        /// </summary>
        /// <param name="flagId">Flag ID</param>
        /// <param name="dto">Resolution data</param>
        /// <returns>Resolved flag</returns>
        [HttpPost("flag/{flagId:long}/resolve")]
        public async Task<IActionResult> ResolveFlag(long flagId, [FromBody] ResolveFlagDTO dto)
        {
            _logger.LogInformation("Resolving flag {FlagId}", flagId);

            dto.FlagId = flagId;
            var command = new ResolveFlagCommand(dto);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get audit thresholds configuration
        /// </summary>
        /// <param name="tankId">Optional tank ID for tank-specific thresholds</param>
        /// <returns>Threshold configuration</returns>
        [HttpGet("thresholds")]
        public async Task<IActionResult> GetThresholds([FromQuery] long? tankId = null)
        {
            _logger.LogInformation("Getting thresholds for tank {TankId}", tankId);

            // Note: The query doesn't take tankId parameter; for future enhancement
            var query = new GetAuditThresholdsQuery();
            var result = await _mediator.Send(query);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get fuel refills from selected tanks for a given period
        /// Used in audit wizard step 4 to show vehicles that were fueled
        /// </summary>
        /// <param name="request">Tank IDs and date range</param>
        /// <returns>Vehicle refill summaries grouped by vehicle</returns>
        [HttpPost("tank-refills-preview")]
        public async Task<IActionResult> GetTankRefillsPreview([FromBody] GetTankRefillsPreviewRequest request)
        {
            _logger.LogInformation(
                "Getting tank refills preview for tanks {TankIds} from {StartDate} to {EndDate}",
                string.Join(",", request.TankIds),
                request.StartDate,
                request.EndDate);

            var query = new GetTankRefillsForPeriodQuery(request);
            var result = await _mediator.Send(query);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get tank volume history preview for audit period
        /// Used in audit wizard step 3 to show opening/closing stock, deliveries, transfers
        /// </summary>
        /// <param name="request">Tank IDs and date range</param>
        /// <returns>Tank audit preview data with opening/closing stock and transactions</returns>
        [HttpPost("tank-preview")]
        public async Task<IActionResult> GetTankVolumePreview([FromBody] TankPreviewRequest request)
        {
            _logger.LogInformation(
                "Getting tank preview for tanks {TankIds} from {StartDate} to {EndDate}",
                string.Join(",", request.TankIds ?? new System.Collections.Generic.List<int>()),
                request.StartDate,
                request.EndDate);

            var query = new GetTankPreviewForAuditQuery(
                request.TankIds ?? new System.Collections.Generic.List<int>(),
                request.StartDate,
                request.EndDate,
                request.SiteId);

            var result = await _mediator.Send(query);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }

    /// <summary>
    /// Request model for tank preview endpoint
    /// </summary>
    public class TankPreviewRequest
    {
        public System.Collections.Generic.List<int>? TankIds { get; set; }
        public System.DateTime StartDate { get; set; }
        public System.DateTime EndDate { get; set; }
        public int? SiteId { get; set; }
    }

    /// <summary>
    /// Request model for cancel audit endpoint
    /// </summary>
    public class CancelAuditRequest
    {
        public string CancellationReason { get; set; } = string.Empty;
    }
}
