using System;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.FuelManagement
{
    /// <summary>
    /// API endpoints for reconciling TankStock and TankVolumeHistory data
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class TankStockReconciliationController : ControllerBase
    {
        private readonly TankStockReconciliationService _reconciliationService;
        private readonly ILogger<TankStockReconciliationController> _logger;

        public TankStockReconciliationController(
            TankStockReconciliationService reconciliationService,
            ILogger<TankStockReconciliationController> logger)
        {
            _reconciliationService = reconciliationService;
            _logger = logger;
        }

        /// <summary>
        /// Reconcile TankStock with TankVolumeHistory for a specific tank and date
        /// </summary>
        [HttpGet("check")]
        public async Task<IActionResult> CheckReconciliation(
            [FromQuery] int tankId,
            [FromQuery] DateTime date)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                var result = await _reconciliationService.ReconcileTankStockForDateAsync(tankId, date);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking reconciliation for Tank {TankId} on {Date}", tankId, date);
                return StatusCode(500, new { error = "Error checking reconciliation", details = ex.Message });
            }
        }

        /// <summary>
        /// Fix discrepancies by updating TankVolumeHistory to match TankStock
        /// TankStock is considered the source of truth
        /// </summary>
        [HttpPost("fix")]
        public async Task<IActionResult> FixDiscrepancies(
            [FromBody] FixDiscrepanciesRequest request)
        {
            var hasPermission = User.HasClaim("permissions", "_Update_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                // First check for discrepancies
                var reconciliation = await _reconciliationService.ReconcileTankStockForDateAsync(
                    request.TankId, request.Date);

                if (reconciliation.DiscrepanciesFound == 0)
                {
                    return Ok(new { message = "No discrepancies found to fix", reconciliation });
                }

                // Get user ID from claims
                var userId = User.FindFirst("sub")?.Value ?? User.Identity?.Name ?? "SYSTEM";

                // Fix the discrepancies
                var fixResult = await _reconciliationService.FixDiscrepanciesAsync(
                    reconciliation, userId);

                return Ok(new
                {
                    reconciliation,
                    fixResult,
                    message = $"Fixed {fixResult.RecordsFixed} records"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fixing discrepancies for Tank {TankId} on {Date}",
                    request.TankId, request.Date);
                return StatusCode(500, new { error = "Error fixing discrepancies", details = ex.Message });
            }
        }

        /// <summary>
        /// Reconcile a date range for a specific tank
        /// </summary>
        [HttpPost("batch/check")]
        public async Task<IActionResult> CheckBatchReconciliation(
            [FromBody] BatchReconciliationRequest request)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                var result = await _reconciliationService.ReconcileDateRangeAsync(
                    request.TankId,
                    request.StartDate,
                    request.EndDate,
                    autoFix: false);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch reconciliation check for Tank {TankId}", request.TankId);
                return StatusCode(500, new { error = "Error in batch reconciliation", details = ex.Message });
            }
        }

        /// <summary>
        /// Reconcile and auto-fix a date range for a specific tank
        /// </summary>
        [HttpPost("batch/fix")]
        public async Task<IActionResult> FixBatchReconciliation(
            [FromBody] BatchReconciliationRequest request)
        {
            var hasPermission = User.HasClaim("permissions", "_Update_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                var userId = User.FindFirst("sub")?.Value ?? User.Identity?.Name ?? "SYSTEM";

                var result = await _reconciliationService.ReconcileDateRangeAsync(
                    request.TankId,
                    request.StartDate,
                    request.EndDate,
                    autoFix: true,
                    fixedBy: userId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch reconciliation fix for Tank {TankId}", request.TankId);
                return StatusCode(500, new { error = "Error in batch reconciliation fix", details = ex.Message });
            }
        }

        /// <summary>
        /// Reconcile all tanks for a specific date (use with caution)
        /// </summary>
        [HttpGet("check-all")]
        public async Task<IActionResult> CheckAllTanks(
            [FromQuery] DateTime date)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                var results = await _reconciliationService.ReconcileAllTanksForDateAsync(date);

                var summary = new
                {
                    date,
                    totalTanks = results.Count,
                    tanksWithDiscrepancies = results.Count(r => r.DiscrepanciesFound > 0),
                    totalDiscrepancies = results.Sum(r => r.DiscrepanciesFound),
                    results
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking all tanks for {Date}", date);
                return StatusCode(500, new { error = "Error checking all tanks", details = ex.Message });
            }
        }

        /// <summary>
        /// Get reconciliation statistics for a tank
        /// </summary>
        [HttpGet("statistics")]
        public async Task<IActionResult> GetReconciliationStatistics(
            [FromQuery] int tankId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                var result = await _reconciliationService.ReconcileDateRangeAsync(
                    tankId, startDate, endDate, autoFix: false);

                var statistics = new
                {
                    tankId,
                    period = new { startDate, endDate },
                    totalDays = result.TotalDaysProcessed,
                    daysWithDiscrepancies = result.DaysWithDiscrepancies,
                    totalDiscrepancies = result.TotalDiscrepancies,
                    dataQualityScore = result.TotalDaysProcessed > 0
                        ? Math.Round((1 - (double)result.DaysWithDiscrepancies / result.TotalDaysProcessed) * 100, 2)
                        : 100,
                    discrepanciesByField = result.Results
                        .SelectMany(r => r.Discrepancies)
                        .GroupBy(d => d.Field)
                        .Select(g => new
                        {
                            field = g.Key,
                            count = g.Count(),
                            averageDifference = Math.Round(g.Average(d => d.Difference), 2),
                            maxDifference = g.Max(d => d.Difference)
                        })
                        .ToList()
                };

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reconciliation statistics for Tank {TankId}", tankId);
                return StatusCode(500, new { error = "Error getting statistics", details = ex.Message });
            }
        }
    }

    #region Request Models

    public class FixDiscrepanciesRequest
    {
        public int TankId { get; set; }
        public DateTime Date { get; set; }
    }

    public class BatchReconciliationRequest
    {
        public int TankId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    #endregion
}
