using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Configuration;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.TankStock
{
    /// <summary>
    /// Service to handle validation and policy enforcement for tank stock entries with future records
    /// </summary>
    public class TankStockFutureRecordsService
    {
        private readonly GpsdataContext _context;
        private readonly ISystemConfigurationService _configService;
        private readonly ILogger<TankStockFutureRecordsService> _logger;

        public TankStockFutureRecordsService(
            GpsdataContext context,
            ISystemConfigurationService configService,
            ILogger<TankStockFutureRecordsService> logger)
        {
            _context = context;
            _configService = configService;
            _logger = logger;
        }

        /// <summary>
        /// Validates if a historical tank stock entry can be processed based on future records policy
        /// </summary>
        /// <param name="tankId">The tank ID</param>
        /// <param name="entryDate">The date of the historical entry</param>
        /// <param name="entryType">The type of entry (Opening, Closing, Transfer, etc.)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Validation result with policy decision and warning messages</returns>
        public async Task<TankStockFutureRecordsValidationResult> ValidateHistoricalEntryAsync(
            int tankId,
            DateTime entryDate,
            VolumeChangeReasonEnum entryType,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Validating historical entry for tank {TankId}, date {EntryDate}, type {EntryType}",
                    tankId, entryDate, entryType);

                // Input validation
                if (tankId <= 0)
                {
                    return new TankStockFutureRecordsValidationResult
                    {
                        IsAllowed = false,
                        Policy = "VALIDATION_ERROR",
                        Message = "Invalid tank ID. Tank ID must be greater than 0.",
                        WarningType = "VALIDATION_ERROR"
                    };
                }

                if (!Enum.IsDefined(typeof(VolumeChangeReasonEnum), entryType))
                {
                    return new TankStockFutureRecordsValidationResult
                    {
                        IsAllowed = false,
                        Policy = "VALIDATION_ERROR",
                        Message = "Invalid volume change reason type.",
                        WarningType = "VALIDATION_ERROR"
                    };
                }

                // Check if tank exists
                var tankExists = await _context.Tanks
                    .AnyAsync(t => t.Id == tankId, cancellationToken);

                if (!tankExists)
                {
                    return new TankStockFutureRecordsValidationResult
                    {
                        IsAllowed = false,
                        Policy = "VALIDATION_ERROR",
                        Message = $"Tank with ID {tankId} does not exist.",
                        WarningType = "VALIDATION_ERROR"
                    };
                }

                // Get configuration settings
                string policy = await _configService.GetTankStockFutureRecordsPolicyAsync(cancellationToken);
                bool showDetailedWarnings = await _configService.GetTankStockShowDetailedWarningsAsync(cancellationToken);
                int maxHistoricalDays = await _configService.GetTankStockMaxHistoricalDaysAsync(cancellationToken);

                // Check if entry is too far in the past
                if (maxHistoricalDays > 0)
                {
                    DateTime cutoffDate = DateTime.Now.Date.AddDays(-maxHistoricalDays);
                    if (entryDate.Date < cutoffDate)
                    {
                        return new TankStockFutureRecordsValidationResult
                        {
                            IsAllowed = false,
                            Policy = policy,
                            Message = $"Historical entries are only allowed within {maxHistoricalDays} days. Entry date {entryDate:yyyy-MM-dd} is beyond the cutoff date {cutoffDate:yyyy-MM-dd}.",
                            WarningType = "HISTORICAL_CUTOFF"
                        };
                    }
                }

                // Check for future records (records after the proposed entry date)
                List<TankVolumeHistory> futureRecords = await GetFutureRecordsAsync(tankId, entryDate, cancellationToken);

                if (!futureRecords.Any())
                {
                    // No future records - entry is safe
                    return new TankStockFutureRecordsValidationResult
                    {
                        IsAllowed = true,
                        Policy = policy,
                        Message = "No future records found. Entry can proceed without issues.",
                        WarningType = "NONE"
                    };
                }

                // Future records exist - apply policy
                var result = new TankStockFutureRecordsValidationResult
                {
                    Policy = policy,
                    FutureRecordsCount = futureRecords.Count,
                    EarliestFutureRecord = futureRecords.Min(r => r.Timestamp),
                    LatestFutureRecord = futureRecords.Max(r => r.Timestamp)
                };

                switch (policy.ToUpper())
                {
                    case "BLOCK":
                        result.IsAllowed = false;
                        result.WarningType = "BLOCKED";
                        result.Message = BuildBlockMessage(futureRecords, entryDate, showDetailedWarnings);
                        break;

                    case "WARN_RECONCILE":
                        result.IsAllowed = true;
                        result.RequiresUserConfirmation = true;
                        result.WarningType = "WARN_RECONCILE";
                        result.Message = BuildWarningMessage(futureRecords, entryDate, showDetailedWarnings, true);
                        break;

                    case "WARN_RECALCULATE":
                        result.IsAllowed = true;
                        result.RequiresUserConfirmation = true;
                        result.WarningType = "WARN_RECALCULATE";
                        result.Message = BuildWarningMessage(futureRecords, entryDate, showDetailedWarnings, false);
                        break;

                    case "ALLOW_RECALCULATE":
                        result.IsAllowed = true;
                        result.RequiresUserConfirmation = false;
                        result.WarningType = "INFO_RECALCULATE";
                        result.Message = $"Entry will automatically recalculate {futureRecords.Count} future records.";
                        break;

                    default:
                        _logger.LogWarning("Unknown tank stock future records policy: {Policy}. Defaulting to WARN_RECONCILE", policy);
                        result.IsAllowed = true;
                        result.RequiresUserConfirmation = true;
                        result.WarningType = "WARN_RECONCILE";
                        result.Message = BuildWarningMessage(futureRecords, entryDate, showDetailedWarnings, true);
                        break;
                }

                if (showDetailedWarnings && result.RequiresUserConfirmation)
                {
                    result.DetailedWarning = BuildDetailedWarning(futureRecords, entryType);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating historical entry for tank {TankId}", tankId);
                return new TankStockFutureRecordsValidationResult
                {
                    IsAllowed = false,
                    Policy = "ERROR",
                    Message = "Error occurred while validating historical entry. Please try again.",
                    WarningType = "ERROR"
                };
            }
        }

        /// <summary>
        /// Gets all volume history records after the specified date for a tank
        /// </summary>
        private async Task<List<TankVolumeHistory>> GetFutureRecordsAsync(
            int tankId,
            DateTime entryDate,
            CancellationToken cancellationToken)
        {
            return await _context.TankVolumeHistories
                .Where(h => h.TankId == tankId && h.Timestamp > entryDate)
                .OrderBy(h => h.Timestamp)
                .ToListAsync(cancellationToken);
        }

        /// <summary>
        /// Builds a block message for when entries are not allowed
        /// </summary>
        private string BuildBlockMessage(List<TankVolumeHistory> futureRecords, DateTime entryDate, bool showDetails)
        {
            string baseMessage = $"Historical entry blocked: {futureRecords.Count} future records exist after {entryDate:yyyy-MM-dd}.";

            if (showDetails && futureRecords.Any())
            {
                var earliestRecord = futureRecords.First();
                baseMessage += $" Next record: {earliestRecord.Timestamp:yyyy-MM-dd HH:mm} ({earliestRecord.ChangeReason}).";
            }

            baseMessage += " Contact administrator to change policy or remove future records.";
            return baseMessage;
        }

        /// <summary>
        /// Builds a warning message for when entries require confirmation
        /// </summary>
        private string BuildWarningMessage(List<TankVolumeHistory> futureRecords, DateTime entryDate,
            bool showDetails, bool recommendsReconciliation)
        {
            string action = recommendsReconciliation ? "manual reconciliation" : "automatic recalculation";
            string baseMessage = $"Warning: {futureRecords.Count} future records exist after {entryDate:yyyy-MM-dd}. " +
                $"This entry will affect volume calculations and may require {action}.";

            if (showDetails && futureRecords.Any())
            {
                var earliestRecord = futureRecords.First();
                var latestRecord = futureRecords.Last();
                baseMessage += $" Records span from {earliestRecord.Timestamp:yyyy-MM-dd} to {latestRecord.Timestamp:yyyy-MM-dd}.";
            }

            return baseMessage;
        }

        /// <summary>
        /// Builds detailed warning information about the affected records
        /// </summary>
        private string BuildDetailedWarning(List<TankVolumeHistory> futureRecords, VolumeChangeReasonEnum entryType)
        {
            var grouped = futureRecords
                .GroupBy(r => r.ChangeReason)
                .Select(g => new { Reason = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            string details = "Affected future records:\n";
            foreach (var group in grouped)
            {
                details += $"• {group.Count} {group.Reason} record(s)\n";
            }

            details += $"\nImpact: Entering {entryType} will shift the baseline for all subsequent volume calculations.";
            return details;
        }

        /// <summary>
        /// Gets the current tank stock future records policy configuration
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Current policy configuration</returns>
        public async Task<FutureRecordsPolicyConfig> GetFutureRecordsPolicyAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var policy = await _configService.GetTankStockFutureRecordsPolicyAsync(cancellationToken);
                var showDetailedWarnings = await _configService.GetTankStockShowDetailedWarningsAsync(cancellationToken);
                var maxDaysBack = await _configService.GetTankStockMaxHistoricalDaysAsync(cancellationToken);

                // Note: AllowOverride is not in the current interface, using a default or configuration lookup
                var allowOverride = bool.Parse(await _configService.GetConfigurationValueAsync(global::FMS.Application.Configuration.SystemConfiguration.DB_CONFIG_TANK_STOCK_FUTURE_RECORDS_ALLOW_OVERRIDE_KEY, cancellationToken) ?? "true");

                return new FutureRecordsPolicyConfig
                {
                    Policy = policy,
                    AllowOverride = allowOverride,
                    MaxHistoricalDays = maxDaysBack,
                    ShowDetailedWarnings = showDetailedWarnings
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving future records policy configuration");

                // Return default configuration
                return new FutureRecordsPolicyConfig
                {
                    Policy = "WARN_RECALCULATE",
                    AllowOverride = true,
                    MaxHistoricalDays = 0,
                    ShowDetailedWarnings = true
                };
            }
        }
    }

    /// <summary>
    /// Result of future records validation
    /// </summary>
    public class TankStockFutureRecordsValidationResult
    {
        /// <summary>
        /// Whether the entry is allowed to proceed
        /// </summary>
        public bool IsAllowed { get; set; }

        /// <summary>
        /// Whether user confirmation is required
        /// </summary>
        public bool RequiresUserConfirmation { get; set; }

        /// <summary>
        /// The policy that was applied
        /// </summary>
        public string Policy { get; set; } = string.Empty;

        /// <summary>
        /// Main message to display to user
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Type of warning: NONE, BLOCKED, WARN_RECONCILE, WARN_RECALCULATE, INFO_RECALCULATE, ERROR, HISTORICAL_CUTOFF
        /// </summary>
        public string WarningType { get; set; } = string.Empty;

        /// <summary>
        /// Detailed warning information (optional)
        /// </summary>
        public string? DetailedWarning { get; set; }

        /// <summary>
        /// Number of future records that will be affected
        /// </summary>
        public int FutureRecordsCount { get; set; }

        /// <summary>
        /// Earliest future record timestamp
        /// </summary>
        public DateTime? EarliestFutureRecord { get; set; }

        /// <summary>
        /// Latest future record timestamp
        /// </summary>
        public DateTime? LatestFutureRecord { get; set; }
    }

    /// <summary>
    /// Configuration for future records policy
    /// </summary>
    public class FutureRecordsPolicyConfig
    {
        /// <summary>
        /// The policy for handling future records: "BLOCK", "WARN_RECONCILE", "WARN_RECALCULATE", "ALLOW_RECALCULATE"
        /// </summary>
        public string Policy { get; set; } = string.Empty;

        /// <summary>
        /// Whether users can override warnings
        /// </summary>
        public bool AllowOverride { get; set; }

        /// <summary>
        /// Maximum days back to check for future records
        /// </summary>
        public int MaxHistoricalDays { get; set; }

        /// <summary>
        /// Whether to show detailed warning information
        /// </summary>
        public bool ShowDetailedWarnings { get; set; }
    }
}