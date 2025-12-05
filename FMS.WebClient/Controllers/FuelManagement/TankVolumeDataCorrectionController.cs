using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace FMS.WebClient.Controllers.FuelManagement
{
    /// <summary>
    /// Controller for tank volume history validation and correction operations
    ///
    /// This controller provides endpoints to:
    /// 1. DETECT: Validate tank volume sequences and identify breaks
    /// 2. ANALYZE: Generate correction plans
    /// 3. CORRECT: Execute corrections using multiple strategies
    ///
    /// WARNING: Data correction is a critical operation. All corrections are logged and reversible.
    /// Only authorized administrators should use these endpoints.
    /// </summary>
    [ApiController]
    [Route("api/v1/tankvolumedatacorrection")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class TankVolumeDataCorrectionController : ControllerBase
    {
        private readonly ITankVolumeHistoryValidationService _validationService;
        private readonly ITankVolumeCorrectionService _correctionService;
        private readonly ILogger<TankVolumeDataCorrectionController> _logger;

        public TankVolumeDataCorrectionController(
            ITankVolumeHistoryValidationService validationService,
            ITankVolumeCorrectionService correctionService,
            ILogger<TankVolumeDataCorrectionController> logger)
        {
            _validationService = validationService;
            _correctionService = correctionService;
            _logger = logger;
        }

        /// <summary>
        /// DETECT: Validate tank volume sequence for a specific tank
        ///
        /// Returns:
        /// - IsValid: Whether the sequence is valid
        /// - SequenceBreaks: List of all detected breaks with severity
        /// - TotalTransactions: Number of transactions analyzed
        ///
        /// Example: GET /api/tankVolumedatacorrection/validate-tank/5?fromDate=2025-11-01&toDate=2025-11-05
        /// </summary>
        [HttpGet("validate-tank/{tankId}")]
        [ProducesResponseType(typeof(ValidationResult), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ValidateTankVolumeSequence(
            [FromRoute] int tankId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("User {User} requested validation for Tank {TankId} from {FromDate} to {ToDate}",
                    User.Identity?.Name, tankId, fromDate?.Date, toDate?.Date);

                var result = await _validationService.ValidateTankVolumeSequenceAsync(
                    tankId, fromDate, toDate, cancellationToken);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating tank {TankId}", tankId);
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// DETECT: Validate all tanks at a site or entire system
        ///
        /// Returns summary of valid vs invalid tanks and all detected breaks
        ///
        /// Example: GET /api/tankvolumedatacorrection/validate-site/3?fromDate=2025-11-01
        /// Example: GET /api/tankvolumedatacorrection/validate-site - All tanks, all dates
        /// </summary>
        [HttpGet("validate-site/{siteId?}")]
        [ProducesResponseType(typeof(ValidationResult), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ValidateAllTanks(
            [FromRoute] int? siteId = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("User {User} requested validation for SiteId {SiteId}",
                    User.Identity?.Name, siteId);

                var result = await _validationService.ValidateAllTanksAsync(siteId, fromDate, toDate, cancellationToken);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating all tanks");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// DETECT: Get all sequence breaks across system
        ///
        /// Returns list of all detected breaks with:
        /// - Tank ID and transaction IDs
        /// - Expected vs actual volumes
        /// - Variance and severity
        ///
        /// Example: GET /api/tankvolumedatacorrection/detect-breaks
        /// Example: GET /api/tankvolumedatacorrection/detect-breaks?siteId=3&fromDate=2025-11-01
        /// </summary>
        [HttpGet("detect-breaks")]
        [ProducesResponseType(typeof(List<SequenceBreak>), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> DetectAllSequenceBreaks(
            [FromQuery] int? siteId = null,
            [FromQuery] DateTime? fromDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("User {User} requested break detection for SiteId {SiteId}",
                    User.Identity?.Name, siteId);

                var breaks = await _validationService.DetectAllSequenceBreaksAsync(siteId, fromDate, cancellationToken);

                return Ok(breaks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting sequence breaks");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// ANALYZE: Generate correction plan for detected breaks
        ///
        /// Takes list of breaks from DETECT step and generates step-by-step correction plan
        /// Groups breaks by tank and provides action items
        ///
        /// Example POST: /api/tankvolumedatacorrection/generate-plan
        /// </summary>
        [HttpPost("generate-plan")]
        [ProducesResponseType(typeof(CorrectionPlan), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> GenerateCorrectionPlan(
            [FromBody] List<SequenceBreak> breaks,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("User {User} requested correction plan for {BreakCount} breaks",
                    User.Identity?.Name, breaks?.Count ?? 0);

                if (breaks == null || breaks.Count == 0)
                    return BadRequest(new { error = "No breaks provided for plan generation" });

                var plan = await _validationService.GenerateCorrectionPlanAsync(breaks, cancellationToken);

                return Ok(plan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating correction plan");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// CORRECT - STRATEGY 1: RECALCULATE
        ///
        /// Rebuilds all NewVolume values from opening stock through all transactions
        /// Most reliable but requires valid opening stock
        ///
        /// Process:
        /// 1. Get opening stock for fromDate
        /// 2. Calculate expected volume for each transaction: prev_volume + volume_change
        /// 3. Update all NewVolume fields
        /// 4. Validate correction was successful
        ///
        /// Example: POST /api/tankvolumedatacorrection/correct-recalculate
        /// Body: {
        ///   "tankId": 5,
        ///   "fromDate": "2025-11-01",
        ///   "toDate": "2025-11-05"
        /// }
        /// </summary>
        [HttpPost("correct-recalculate")]
        [ProducesResponseType(typeof(CorrectionExecutionResult), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RecalculateTankVolumes(
            [FromBody] RecalculateRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogWarning("User {User} initiated RECALCULATE for Tank {TankId} from {FromDate} to {ToDate}",
                    User.Identity?.Name, request.TankId, request.FromDate, request.ToDate);

                var result = await _correctionService.RecalculateTankVolumesAsync(
                    request.TankId,
                    request.FromDate,
                    request.ToDate,
                    User.Identity?.Name ?? "System",
                    cancellationToken);

                if (result.Success)
                {
                    _logger.LogInformation("RECALCULATE successful: {Message}", result.Message);
                    return Ok(result);
                }
                else
                {
                    _logger.LogError("RECALCULATE failed: {ErrorMessage}", result.ErrorMessage);
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recalculating tank volumes");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// CORRECT - STRATEGY 2: MANUAL
        ///
        /// Admin manually corrects a single transaction, cascading fixes downstream
        /// Use when you know the correct volume for a specific transaction
        ///
        /// Process:
        /// 1. Update transaction's NewVolume to provided value
        /// 2. Calculate volume difference
        /// 3. Apply difference to all downstream transactions
        /// 4. Audit log the change
        ///
        /// Example: POST /api/tankvolumedatacorrection/correct-manual
        /// Body: {
        ///   "transactionId": 1234,
        ///   "newVolume": 5698.00,
        ///   "reason": "Manual correction based on physical count verification"
        /// }
        /// </summary>
        [HttpPost("correct-manual")]
        [ProducesResponseType(typeof(CorrectionExecutionResult), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ManualCorrectTransaction(
            [FromBody] ManualCorrectionRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogWarning("User {User} initiated MANUAL correction for Txn {TransactionId} to volume {NewVolume}: {Reason}",
                    User.Identity?.Name, request.TransactionId, request.NewVolume, request.Reason);

                var result = await _correctionService.ManualCorrectTransactionAsync(
                    request.TransactionId,
                    request.NewVolume,
                    request.Reason,
                    User.Identity?.Name ?? "System",
                    cancellationToken);

                if (result.Success)
                {
                    _logger.LogInformation("MANUAL correction successful: {Message}", result.Message);
                    return Ok(result);
                }
                else
                {
                    _logger.LogError("MANUAL correction failed: {ErrorMessage}", result.ErrorMessage);
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error manually correcting transaction");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// CORRECT - STRATEGY 3: RECALCULATE SINGLE
        ///
        /// Recalculates one transaction based on previous, cascading downstream
        /// Use when a single transaction is detected as broken
        ///
        /// Process:
        /// 1. Get previous transaction's NewVolume
        /// 2. Calculate: expected = prev_volume + this_volume_change
        /// 3. Update this transaction's NewVolume
        /// 4. Cascade correction downstream
        ///
        /// Example: POST /api/tankvolumedatacorrection/correct-single
        /// Body: { "transactionId": 1234 }
        /// </summary>
        [HttpPost("correct-single")]
        [ProducesResponseType(typeof(CorrectionExecutionResult), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RecalculateSingleTransaction(
            [FromBody] SingleTransactionCorrectionRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogWarning("User {User} initiated RECALCULATE_SINGLE for Txn {TransactionId}",
                    User.Identity?.Name, request.TransactionId);

                var result = await _correctionService.RecalculateSingleTransactionAsync(
                    request.TransactionId,
                    User.Identity?.Name ?? "System",
                    cancellationToken);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    _logger.LogError("RECALCULATE_SINGLE failed: {ErrorMessage}", result.ErrorMessage);
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recalculating single transaction");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// CORRECT - STRATEGY 4: RECALCULATE FROM POINT FORWARD
        ///
        /// Recalculates from a starting transaction through end date
        /// Use when you find a specific point where data becomes corrupted
        ///
        /// Process:
        /// 1. Start from specified transaction
        /// 2. Get baseline from previous transaction
        /// 3. Recalculate all transactions forward from there
        ///
        /// Example: POST /api/tankvolumedatacorrection/correct-from-point
        /// Body: {
        ///   "startTransactionId": 1234,
        ///   "toDate": "2025-11-10"
        /// }
        /// </summary>
        [HttpPost("correct-from-point")]
        [ProducesResponseType(typeof(CorrectionExecutionResult), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RecalculateFromTransaction(
            [FromBody] RecalculateFromPointRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogWarning("User {User} initiated RECALCULATE_FROM_POINT starting at Txn {TransactionId}",
                    User.Identity?.Name, request.StartTransactionId);

                var result = await _correctionService.RecalculateFromTransactionAsync(
                    request.StartTransactionId,
                    request.ToDate,
                    User.Identity?.Name ?? "System",
                    cancellationToken);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    _logger.LogError("RECALCULATE_FROM_POINT failed: {ErrorMessage}", result.ErrorMessage);
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recalculating from transaction");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// CORRECT - BULK: Execute multiple corrections in sequence
        ///
        /// Accepts list of correction requests and executes them atomically
        /// Each correction is independent but executed in order
        ///
        /// Example: POST /api/tankvolumedatacorrection/correct-bulk
        /// Body: [
        ///   {
        ///     "correctionType": "RECALCULATE",
        ///     "tankId": 5,
        ///     "fromDate": "2025-11-01",
        ///     "toDate": "2025-11-03"
        ///   },
        ///   {
        ///     "correctionType": "MANUAL",
        ///     "transactionId": 1234,
        ///     "newVolume": 5698.00,
        ///     "reason": "Override based on manual verification"
        ///   }
        /// ]
        /// </summary>
        [HttpPost("correct-bulk")]
        [ProducesResponseType(typeof(BulkCorrectionResult), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ExecuteBulkCorrection(
            [FromBody] List<BulkCorrectionRequest> corrections,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogWarning("User {User} initiated BULK correction with {Count} requests",
                    User.Identity?.Name, corrections?.Count ?? 0);

                if (corrections == null || corrections.Count == 0)
                    return BadRequest(new { error = "No corrections provided" });

                var result = await _correctionService.ExecuteBulkCorrectionAsync(
                    corrections,
                    User.Identity?.Name ?? "System",
                    cancellationToken);

                _logger.LogInformation("BULK correction completed: {Success} successful, {Failed} failed",
                    result.SuccessfulCorrectionCount, result.FailedCorrectionCount);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing bulk correction");
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    // Request DTOs
    public class RecalculateRequest
    {
        public int TankId { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }

    public class ManualCorrectionRequest
    {
        public int TransactionId { get; set; }
        public decimal NewVolume { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class SingleTransactionCorrectionRequest
    {
        public int TransactionId { get; set; }
    }

    public class RecalculateFromPointRequest
    {
        public int StartTransactionId { get; set; }
        public DateTime ToDate { get; set; }
    }
}
