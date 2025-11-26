using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.BulkImport.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FMS.Persistence.DataAccess;

namespace FMS.Application.Features.TankManagement.BulkImport.Services
{
    /// <summary>
    /// Service for validating bulk import data with 11 advanced anomaly detection algorithms
    /// All validation runs in BACKEND as per requirements
    /// Configuration values loaded from database for flexibility
    /// </summary>
    public class BulkImportValidationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<BulkImportValidationService> _logger;

        // Validation thresholds - loaded from database
        private const decimal DAILY_VARIANCE_THRESHOLD_LITERS = 50m;
        private const decimal DAILY_VARIANCE_THRESHOLD_PERCENT = 2m;

        // Cumulative validation configuration (loaded from database)
        private Dictionary<string, string> _validationConfig;

        public BulkImportValidationService(
            GpsdataContext context,
            ILogger<BulkImportValidationService> logger)
        {
            _context = context;
            _logger = logger;
            _validationConfig = new Dictionary<string, string>();
        }

        /// <summary>
        /// Load validation configuration from database
        /// </summary>
        private async Task LoadValidationConfigAsync(CancellationToken cancellationToken)
        {
            try
            {
                var configs = await _context.SystemConfigurations
                    .Where(c => c.IsActive && c.Category == "BulkImport" &&
                        (c.ConfigurationKey.Contains("StockContinuity") ||
                         c.ConfigurationKey.Contains("BalanceEquation") ||
                         c.ConfigurationKey.Contains("MeterReadings") ||
                         c.ConfigurationKey.Contains("TransferReciprocity")))
                    .Select(c => new { c.ConfigurationKey, c.ConfigurationValue })
                    .ToListAsync(cancellationToken);

                _validationConfig = configs.ToDictionary(
                    c => c.ConfigurationKey,
                    c => c.ConfigurationValue ?? string.Empty
                );

                _logger.LogInformation("Loaded {Count} validation configuration settings", _validationConfig.Count);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load validation configuration, using defaults");
                // Continue with default values if config load fails
            }
        }

        /// <summary>
        /// Get configuration value with fallback to default
        /// </summary>
        private T GetConfigValue<T>(string key, T defaultValue)
        {
            if (_validationConfig.TryGetValue(key, out var value))
            {
                try
                {
                    if (typeof(T) == typeof(bool))
                    {
                        return (T)(object)(value.Equals("true", StringComparison.OrdinalIgnoreCase));
                    }
                    else if (typeof(T) == typeof(decimal))
                    {
                        return (T)(object)decimal.Parse(value);
                    }
                    else if (typeof(T) == typeof(int))
                    {
                        return (T)(object)int.Parse(value);
                    }
                }
                catch
                {
                    _logger.LogWarning("Failed to parse config value for {Key}, using default", key);
                }
            }
            return defaultValue;
        }

        /// <summary>
        /// Main validation method - runs all 11 anomaly detection algorithms
        /// </summary>
        public async Task<BulkImportValidationResult> ValidateImportAsync(
            List<BulkImportRowDTO> entries,
            Dictionary<string, Tank> tanks,
            CancellationToken cancellationToken)
        {
            // Load validation configuration from database
            await LoadValidationConfigAsync(cancellationToken);

            var result = new BulkImportValidationResult
            {
                TotalRows = entries.Count
            };

            _logger.LogInformation("Starting advanced validation with 11 anomaly detectors for {Count} rows", entries.Count);

            // Group entries by tank for sequential validation
            var entriesByTank = entries
                .Where(e => tanks.ContainsKey(e.TankName.ToLower()))
                .GroupBy(e => e.TankName.ToLower())
                .ToDictionary(g => g.Key, g => g.OrderBy(e => e.Date).ToList());

            foreach (var tankGroup in entriesByTank)
            {
                var tankName = tankGroup.Key;
                var tank = tanks[tankName];
                var tankEntries = tankGroup.Value;

                _logger.LogDebug("Validating {Count} entries for tank {Tank}", tankEntries.Count, tank.Name);

                // Run all anomaly detectors
                await ValidateDailyBalance(tank, tankEntries, result);
                await ValidateContinuityBreaks(tank, tankEntries, result, cancellationToken);
                await ValidateCumulativeDrift(tank, tankEntries, result);
                await ValidateMeterReadings(tank, tankEntries, result);
                await ValidateCapacityOverflow(tank, tankEntries, result);
                await ValidateNegativeStock(tank, tankEntries, result);
                await ValidateTransferReciprocity(tankEntries, result);
                await ValidateZeroMovement(tank, tankEntries, result);
                await ValidateImplausibleDispensing(tank, tankEntries, result);
                await ValidateDeliverySpace(tank, tankEntries, result);
            }

            // Count rows with errors
            var rowsWithErrors = result.Anomalies
                .Where(a => a.Severity >= AnomalySeverity.High)
                .Select(a => a.RowNumber)
                .Distinct()
                .Count();
            result.RowsWithErrors = rowsWithErrors;

            _logger.LogInformation("Validation complete: {Total} anomalies found ({Critical} critical, {High} high, {Medium} medium, {Low} low)",
                result.Anomalies.Count, result.CriticalCount, result.HighCount, result.MediumCount, result.LowCount);

            return result;
        }

        #region Anomaly Detector 1: Daily Balance Validation

        /// <summary>
        /// Validates that Closing = Opening + IN - OUT for each day
        /// </summary>
        private Task ValidateDailyBalance(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            // Check if balance equation check is enabled
            if (!GetConfigValue("TankStock.BulkImport.BalanceEquation.Enabled", true))
                return Task.CompletedTask;

            // Get configuration values
            decimal tolerancePercent = GetConfigValue("TankStock.BulkImport.BalanceEquation.TolerancePercent", 2m);
            decimal minVarianceLiters = GetConfigValue("TankStock.BulkImport.BalanceEquation.MinVarianceLiters", 10m);

            foreach (var entry in entries)
            {
                if (!entry.Opening.HasValue || !entry.Closing.HasValue)
                    continue;

                var expectedClosing = entry.CalculateExpectedClosing();
                if (!expectedClosing.HasValue)
                    continue;

                var variance = entry.Closing.Value - expectedClosing.Value;
                var absVariance = Math.Abs(variance);

                // Check if variance exceeds thresholds
                if (absVariance > minVarianceLiters)
                {
                    var percentVariance = expectedClosing.Value != 0
                        ? (absVariance / expectedClosing.Value) * 100
                        : 100;

                    if (percentVariance > tolerancePercent)
                    {
                        result.AddAnomaly(new ValidationAnomaly
                        {
                            Type = AnomalyType.DailyBalance,
                            Severity = absVariance > 200 ? AnomalySeverity.High : AnomalySeverity.Medium,
                            TankName = tank.Name,
                            Date = entry.Date,
                            RowNumber = entry.RowNumber,
                            ExpectedValue = expectedClosing.Value,
                            ActualValue = entry.Closing.Value,
                            Variance = variance,
                            Message = $"Daily balance mismatch: Expected closing {expectedClosing.Value:N0}L, got {entry.Closing.Value:N0}L (variance: {variance:N0}L, {percentVariance:N1}%)",
                            Details = $"Opening: {entry.Opening.Value:N0}L, Delivery: {entry.Delivery ?? 0:N0}L, Transfer IN: {entry.TransferIn ?? 0:N0}L, Dispensing: {entry.Dispensing ?? 0:N0}L, Transfer OUT: {entry.TransferOut ?? 0:N0}L"
                        });
                    }
                }
            }

            return Task.CompletedTask;
        }

        #endregion

        #region Anomaly Detector 2: Continuity Break Detection

        /// <summary>
        /// Validates that each day's Opening matches the previous day's Closing
        /// </summary>
        private async Task ValidateContinuityBreaks(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result,
            CancellationToken cancellationToken)
        {
            for (int i = 0; i < entries.Count; i++)
            {
                var currentEntry = entries[i];
                if (!currentEntry.Opening.HasValue)
                    continue;

                decimal? previousClosing = null;

                // Check previous entry in import
                if (i > 0 && entries[i - 1].Closing.HasValue)
                {
                    var previousEntry = entries[i - 1];
                    // Only check continuity if dates are consecutive
                    if ((currentEntry.Date - previousEntry.Date).Days == 1)
                    {
                        previousClosing = previousEntry.Closing.Value;
                    }
                }
                else
                {
                    // Check database for previous day's closing
                    var previousDay = currentEntry.Date.AddDays(-1);
                    var dbClosing = await _context.Tankstocks
                        .Where(ts => ts.TankId == tank.Id &&
                                   ts.EntryDate.Date == previousDay.Date &&
                                   ts.ManualClosingLevel.HasValue)
                        .OrderByDescending(ts => ts.CreatedOn)
                        .Select(ts => ts.ManualClosingLevel)
                        .FirstOrDefaultAsync(cancellationToken);

                    previousClosing = dbClosing;
                }

                if (previousClosing.HasValue)
                {
                    var variance = currentEntry.Opening.Value - previousClosing.Value;
                    var absVariance = Math.Abs(variance);

                    if (absVariance > DAILY_VARIANCE_THRESHOLD_LITERS)
                    {
                        result.AddAnomaly(new ValidationAnomaly
                        {
                            Type = AnomalyType.ContinuityBreak,
                            Severity = absVariance > 200 ? AnomalySeverity.High : AnomalySeverity.Medium,
                            TankName = tank.Name,
                            Date = currentEntry.Date,
                            RowNumber = currentEntry.RowNumber,
                            ExpectedValue = previousClosing.Value,
                            ActualValue = currentEntry.Opening.Value,
                            Variance = variance,
                            Message = $"Continuity break: Opening {currentEntry.Opening.Value:N0}L doesn't match previous closing {previousClosing.Value:N0}L (variance: {variance:N0}L)",
                            Details = "Opening stock should match previous day's closing stock"
                        });
                    }
                }
            }
        }

        #endregion

        #region Anomaly Detector 3: Cumulative Drift Detection

        /// <summary>
        /// Validates cumulative balance over the entire import period
        /// User example: "0 liters, delivery 10000, after 10 days 7000 dispensing, closing expected to be 3000"
        /// </summary>
        private Task ValidateCumulativeDrift(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            // Check if stock continuity check is enabled
            if (!GetConfigValue("TankStock.BulkImport.StockContinuity.Enabled", true))
                return Task.CompletedTask;

            if (entries.Count < 2)
                return Task.CompletedTask;

            var firstEntry = entries.First();
            var lastEntry = entries.Last();

            if (!firstEntry.Opening.HasValue || !lastEntry.Closing.HasValue)
                return Task.CompletedTask;

            // Get configuration values
            var thresholdLiters = GetConfigValue("TankStock.BulkImport.StockContinuity.ThresholdLiters", 500m);
            var thresholdPercent = GetConfigValue("TankStock.BulkImport.StockContinuity.ThresholdPercent", 10m);

            // Calculate cumulative changes
            decimal totalDelivery = entries.Sum(e => e.Delivery ?? 0);
            decimal totalTransferIn = entries.Sum(e => e.TransferIn ?? 0);
            decimal totalDispensing = entries.Sum(e => e.Dispensing ?? 0);
            decimal totalTransferOut = entries.Sum(e => e.TransferOut ?? 0);

            // Expected final closing = Initial opening + Total IN - Total OUT
            var expectedFinal = firstEntry.Opening.Value + totalDelivery + totalTransferIn - totalDispensing - totalTransferOut;
            var actualFinal = lastEntry.Closing.Value;
            var cumulativeVariance = actualFinal - expectedFinal;
            var absVariance = Math.Abs(cumulativeVariance);

            if (absVariance > thresholdLiters)
            {
                var percentVariance = expectedFinal != 0
                    ? (absVariance / expectedFinal) * 100
                    : 100;

                if (percentVariance > thresholdPercent)
                {
                    var dayCount = (lastEntry.Date - firstEntry.Date).Days + 1;

                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.CumulativeDrift,
                        Severity = absVariance > 500 ? AnomalySeverity.High : AnomalySeverity.Medium,
                        TankName = tank.Name,
                        Date = firstEntry.Date,
                        EndDate = lastEntry.Date,
                        RowNumber = lastEntry.RowNumber,
                        ExpectedValue = expectedFinal,
                        ActualValue = actualFinal,
                        Variance = cumulativeVariance,
                        Message = $"Cumulative drift over {dayCount} days: Expected final {expectedFinal:N0}L, got {actualFinal:N0}L (variance: {cumulativeVariance:N0}L, {percentVariance:N1}%)",
                        Details = $"Starting: {firstEntry.Opening.Value:N0}L | Deliveries: +{totalDelivery:N0}L | Transfer IN: +{totalTransferIn:N0}L | Dispensing: -{totalDispensing:N0}L | Transfer OUT: -{totalTransferOut:N0}L | Expected: {expectedFinal:N0}L | Actual: {actualFinal:N0}L"
                    });
                }
            }

            return Task.CompletedTask;
        }

        #endregion

        #region Anomaly Detector 4 & 5: Meter Reading Validation

        /// <summary>
        /// Validates meter readings for rollbacks and mismatches with dispensing
        /// </summary>
        private Task ValidateMeterReadings(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            // Check if meter reading validation is enabled
            if (!GetConfigValue("TankStock.BulkImport.MeterReadings.Enabled", true))
                return Task.CompletedTask;

            // Get configuration values
            decimal tolerancePercent = GetConfigValue("TankStock.BulkImport.MeterReadings.TolerancePercent", 5m);
            decimal minVarianceLiters = GetConfigValue("TankStock.BulkImport.MeterReadings.MinVarianceLiters", 20m);
            bool allowReset = GetConfigValue("TankStock.BulkImport.MeterReadings.AllowReset", true);

            for (int i = 0; i < entries.Count; i++)
            {
                var entry = entries[i];

                // Check meter rollback (counter reset)
                if (entry.OpeningMeter.HasValue && entry.ClosingMeter.HasValue)
                {
                    if (entry.ClosingMeter.Value < entry.OpeningMeter.Value)
                    {
                        // Possible meter rollback/reset
                        var rollbackAmount = entry.OpeningMeter.Value - entry.ClosingMeter.Value;

                        // Only flag as anomaly if resets are not allowed
                        if (!allowReset)
                        {
                            result.AddAnomaly(new ValidationAnomaly
                            {
                                Type = AnomalyType.MeterRollback,
                                Severity = AnomalySeverity.Medium,
                                TankName = tank.Name,
                                Date = entry.Date,
                                RowNumber = entry.RowNumber,
                                ExpectedValue = entry.OpeningMeter.Value,
                                ActualValue = entry.ClosingMeter.Value,
                                Variance = -rollbackAmount,
                                Message = $"Meter reset detected: Closing meter {entry.ClosingMeter.Value:N0} < Opening meter {entry.OpeningMeter.Value:N0}",
                                Details = "Meter resets are flagged for review but allowed"
                            });
                        }
                    }
                    else
                    {
                        // Check meter mismatch with dispensing
                        var meterDispensing = entry.ClosingMeter.Value - entry.OpeningMeter.Value;

                        if (entry.Dispensing.HasValue && entry.Dispensing.Value > 0)
                        {
                            var recordedDispensing = entry.Dispensing.Value;
                            var variance = Math.Abs(meterDispensing - recordedDispensing);

                            if (variance > minVarianceLiters)
                            {
                                var percentVariance = recordedDispensing != 0
                                    ? (variance / recordedDispensing) * 100
                                    : 100;

                                if (percentVariance > tolerancePercent)
                                {
                                    result.AddAnomaly(new ValidationAnomaly
                                    {
                                        Type = AnomalyType.MeterMismatch,
                                        Severity = percentVariance > 10 ? AnomalySeverity.Medium : AnomalySeverity.Low,
                                        TankName = tank.Name,
                                        Date = entry.Date,
                                        RowNumber = entry.RowNumber,
                                        ExpectedValue = recordedDispensing,
                                        ActualValue = meterDispensing,
                                        Variance = meterDispensing - recordedDispensing,
                                        Message = $"Meter mismatch: Meter shows {meterDispensing:N0}L dispensed, record shows {recordedDispensing:N0}L (variance: {variance:N0}L, {percentVariance:N1}%)",
                                        Details = $"Opening meter: {entry.OpeningMeter.Value:N0}, Closing meter: {entry.ClosingMeter.Value:N0}"
                                    });
                                }
                            }
                        }
                    }
                }
            }

            return Task.CompletedTask;
        }

        #endregion

        #region Anomaly Detector 6: Capacity Overflow

        /// <summary>
        /// Validates that stock levels don't exceed tank capacity
        /// </summary>
        private Task ValidateCapacityOverflow(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            foreach (var entry in entries)
            {
                // Check opening stock
                if (entry.Opening.HasValue && entry.Opening.Value > tank.TankVolume)
                {
                    var overfill = entry.Opening.Value - tank.TankVolume;
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.CapacityOverflow,
                        Severity = AnomalySeverity.Medium,
                        TankName = tank.Name,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        ExpectedValue = tank.TankVolume,
                        ActualValue = entry.Opening.Value,
                        Variance = overfill,
                        Message = $"Opening stock {entry.Opening.Value:N0}L exceeds tank capacity {tank.TankVolume:N0}L by {overfill:N0}L",
                        Details = "Stock level exceeds physical tank capacity (flagged for review)"
                    });
                }

                // Check closing stock
                if (entry.Closing.HasValue && entry.Closing.Value > tank.TankVolume)
                {
                    var overfill = entry.Closing.Value - tank.TankVolume;
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.CapacityOverflow,
                        Severity = AnomalySeverity.Medium,
                        TankName = tank.Name,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        ExpectedValue = tank.TankVolume,
                        ActualValue = entry.Closing.Value,
                        Variance = overfill,
                        Message = $"Closing stock {entry.Closing.Value:N0}L exceeds tank capacity {tank.TankVolume:N0}L by {overfill:N0}L",
                        Details = "Stock level exceeds physical tank capacity (flagged for review)"
                    });
                }
            }

            return Task.CompletedTask;
        }

        #endregion

        #region Anomaly Detector 7: Negative Stock

        /// <summary>
        /// Validates that calculated intermediate stock levels don't go negative
        /// </summary>
        private Task ValidateNegativeStock(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            foreach (var entry in entries)
            {
                if (!entry.Opening.HasValue)
                    continue;

                // Check if any intermediate calculation would result in negative stock
                var stockAfterDispensing = entry.Opening.Value - (entry.Dispensing ?? 0);
                var stockAfterTransferOut = stockAfterDispensing - (entry.TransferOut ?? 0);

                if (stockAfterDispensing < 0)
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.NegativeStock,
                        Severity = AnomalySeverity.Medium,
                        TankName = tank.Name,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        ExpectedValue = 0,
                        ActualValue = stockAfterDispensing,
                        Variance = stockAfterDispensing,
                        Message = $"Negative stock after dispensing: {stockAfterDispensing:N0}L (Opening: {entry.Opening.Value:N0}L, Dispensing: {entry.Dispensing ?? 0:N0}L)",
                        Details = "Dispensing exceeds available stock (flagged for review)"
                    });
                }
                else if (stockAfterTransferOut < 0)
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.NegativeStock,
                        Severity = AnomalySeverity.Medium,
                        TankName = tank.Name,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        ExpectedValue = 0,
                        ActualValue = stockAfterTransferOut,
                        Variance = stockAfterTransferOut,
                        Message = $"Negative stock after transfer out: {stockAfterTransferOut:N0}L",
                        Details = $"Opening: {entry.Opening.Value:N0}L, Dispensing: {entry.Dispensing ?? 0:N0}L, Transfer OUT: {entry.TransferOut ?? 0:N0}L (flagged for review)"
                    });
                }
            }

            return Task.CompletedTask;
        }

        #endregion

        #region Anomaly Detector 8: Transfer Reciprocity

        /// <summary>
        /// Validates that total Transfer OUT roughly matches total Transfer IN across all tanks on same day
        /// </summary>
        private Task ValidateTransferReciprocity(
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            // Check if transfer reciprocity check is enabled
            if (!GetConfigValue("TankStock.BulkImport.TransferReciprocity.Enabled", true))
                return Task.CompletedTask;

            // Get configuration value
            decimal toleranceLiters = GetConfigValue("TankStock.BulkImport.TransferReciprocity.ToleranceLiters", 10m);

            // Group by date
            var entriesByDate = entries.GroupBy(e => e.Date.Date);

            foreach (var dateGroup in entriesByDate)
            {
                var totalTransferOut = dateGroup.Sum(e => e.TransferOut ?? 0);
                var totalTransferIn = dateGroup.Sum(e => e.TransferIn ?? 0);

                if (totalTransferOut > 0 || totalTransferIn > 0)
                {
                    var variance = Math.Abs(totalTransferOut - totalTransferIn);

                    if (variance > toleranceLiters)
                    {
                        // Find a representative entry for this date
                        var entry = dateGroup.First();

                        result.AddAnomaly(new ValidationAnomaly
                        {
                            Type = AnomalyType.TransferImbalance,
                            Severity = AnomalySeverity.Low,
                            TankName = "All Tanks",
                            Date = dateGroup.Key,
                            RowNumber = entry.RowNumber,
                            ExpectedValue = totalTransferOut,
                            ActualValue = totalTransferIn,
                            Variance = totalTransferIn - totalTransferOut,
                            Message = $"Transfer imbalance on {dateGroup.Key:yyyy-MM-dd}: Transfer OUT {totalTransferOut:N0}L doesn't match Transfer IN {totalTransferIn:N0}L (variance: {variance:N0}L)",
                            Details = "Total outgoing transfers should match total incoming transfers on the same day"
                        });
                    }
                }
            }

            return Task.CompletedTask;
        }

        #endregion

        #region Anomaly Detector 9: Zero Movement

        /// <summary>
        /// Detects cases where stock changed but no transactions recorded
        /// </summary>
        private Task ValidateZeroMovement(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            foreach (var entry in entries)
            {
                if (!entry.Opening.HasValue || !entry.Closing.HasValue)
                    continue;

                var stockChange = entry.Closing.Value - entry.Opening.Value;
                var hasTransactions = entry.HasTransactions();

                // Stock changed but no transactions
                if (Math.Abs(stockChange) > 10 && !hasTransactions)
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.ZeroMovement,
                        Severity = AnomalySeverity.Low,
                        TankName = tank.Name,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        ExpectedValue = entry.Opening.Value,
                        ActualValue = entry.Closing.Value,
                        Variance = stockChange,
                        Message = $"Stock changed by {stockChange:N0}L but no transactions recorded (Opening: {entry.Opening.Value:N0}L, Closing: {entry.Closing.Value:N0}L)",
                        Details = "Consider adding delivery, dispensing, or transfer records to explain stock change"
                    });
                }
            }

            return Task.CompletedTask;
        }

        #endregion

        #region Anomaly Detector 10: Implausible Dispensing

        /// <summary>
        /// Detects unrealistically high dispensing volumes
        /// </summary>
        private Task ValidateImplausibleDispensing(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            foreach (var entry in entries)
            {
                if (!entry.Dispensing.HasValue || !entry.Opening.HasValue)
                    continue;

                // Dispensing > tank capacity is physically impossible
                if (entry.Dispensing.Value > tank.TankVolume)
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.ImplausibleDispensing,
                        Severity = AnomalySeverity.Medium,
                        TankName = tank.Name,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        ExpectedValue = tank.TankVolume,
                        ActualValue = entry.Dispensing.Value,
                        Variance = entry.Dispensing.Value - tank.TankVolume,
                        Message = $"Implausible dispensing: {entry.Dispensing.Value:N0}L exceeds tank capacity {tank.TankVolume:N0}L",
                        Details = "Dispensing > tank capacity (flagged for review)"
                    });
                }
                // Dispensing > opening stock + delivery is also problematic
                else
                {
                    var maxPossible = entry.Opening.Value + (entry.Delivery ?? 0) + (entry.TransferIn ?? 0);
                    if (entry.Dispensing.Value > maxPossible)
                    {
                        result.AddAnomaly(new ValidationAnomaly
                        {
                            Type = AnomalyType.ImplausibleDispensing,
                            Severity = AnomalySeverity.Medium,
                            TankName = tank.Name,
                            Date = entry.Date,
                            RowNumber = entry.RowNumber,
                            ExpectedValue = maxPossible,
                            ActualValue = entry.Dispensing.Value,
                            Variance = entry.Dispensing.Value - maxPossible,
                            Message = $"Implausible dispensing: {entry.Dispensing.Value:N0}L exceeds available stock {maxPossible:N0}L",
                            Details = $"Opening: {entry.Opening.Value:N0}L, Delivery: {entry.Delivery ?? 0:N0}L, Transfer IN: {entry.TransferIn ?? 0:N0}L (flagged for review)"
                        });
                    }
                }
            }

            return Task.CompletedTask;
        }

        #endregion

        #region Anomaly Detector 11: Delivery Without Space

        /// <summary>
        /// Validates that deliveries don't exceed available tank space
        /// </summary>
        private Task ValidateDeliverySpace(
            Tank tank,
            List<BulkImportRowDTO> entries,
            BulkImportValidationResult result)
        {
            foreach (var entry in entries)
            {
                if (!entry.Delivery.HasValue || !entry.Opening.HasValue)
                    continue;

                if (entry.Delivery.Value == 0)
                    continue;

                var availableSpace = tank.TankVolume - entry.Opening.Value;

                if (entry.Delivery.Value > availableSpace)
                {
                    var overfill = entry.Delivery.Value - availableSpace;

                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.DeliveryNoSpace,
                        Severity = AnomalySeverity.Medium,
                        TankName = tank.Name,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        ExpectedValue = availableSpace,
                        ActualValue = entry.Delivery.Value,
                        Variance = overfill,
                        Message = $"Delivery {entry.Delivery.Value:N0}L exceeds available space {availableSpace:N0}L by {overfill:N0}L",
                        Details = $"Tank capacity: {tank.TankVolume:N0}L, Opening stock: {entry.Opening.Value:N0}L, Available: {availableSpace:N0}L (flagged for review)"
                    });
                }
            }

            return Task.CompletedTask;
        }

        #endregion
    }
}
