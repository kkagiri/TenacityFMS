/**
 * File: TankStockReconciliationController.cs
 * Purpose: Provides endpoints to reconcile and fix tank stock/history discrepancies.
 * Dependencies: TankStockReconciliationService, ILogger, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - CheckReconciliation(): Compares stock and history for a given tank/day.
 * - FixDiscrepancies(): Repairs detected discrepancies with audit user context.
 * - FixBatchReconciliation(): Reconciles and auto-fixes across date ranges.
 */
using System;
using System.Threading.Tasks;
using System.Security.Claims;
using FMS.Application.Features.TankManagement.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.FuelManagement
{
    /// <summary>
    /// API endpoints for reconciling TankStock and TankVolumeHistory data
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
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

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? string.Empty;

            return !string.IsNullOrWhiteSpace(userId);
        }

        private string GetCurrentUserIdOrDefault(string fallback = "SYSTEM")
        {
            if (TryGetCurrentUserId(out var userId))
            {
                return userId;
            }

            return User.Identity?.Name ?? fallback;
        }

        /// <summary>
        /// Reconcile TankStock with TankVolumeHistory for a specific tank and date
        /// </summary>
        [HttpGet("check")]
        [RequirePermission(Permissions.TankStock.Read)]
        public async Task<IActionResult> CheckReconciliation(
            [FromQuery] int tankId,
            [FromQuery] DateTime date)
        {
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
        [RequirePermission(Permissions.TankStock.Update)]
        public async Task<IActionResult> FixDiscrepancies(
            [FromBody] FixDiscrepanciesRequest request)
        {
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
                var userId = GetCurrentUserIdOrDefault();

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
        [RequirePermission(Permissions.TankStock.Read)]
        public async Task<IActionResult> CheckBatchReconciliation(
            [FromBody] BatchReconciliationRequest request)
        {
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
        [RequirePermission(Permissions.TankStock.Update)]
        public async Task<IActionResult> FixBatchReconciliation(
            [FromBody] BatchReconciliationRequest request)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault();

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
        [RequirePermission(Permissions.TankStock.Read)]
        public async Task<IActionResult> CheckAllTanks(
            [FromQuery] DateTime date)
        {
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
        [RequirePermission(Permissions.TankStock.Read)]
        public async Task<IActionResult> GetReconciliationStatistics(
            [FromQuery] int tankId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
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
