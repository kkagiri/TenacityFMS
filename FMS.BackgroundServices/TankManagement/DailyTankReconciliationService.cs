using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging;
using FMS.Persistence.DataAccess;

namespace FMS.BackgroundServices.TankManagement
{
    /// <summary>
    /// Background service to run daily reconciliation between TankStock and TankVolumeHistory
    /// Ensures data consistency for reporting and analysis
    /// </summary>
    public class DailyTankReconciliationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DailyTankReconciliationService> _logger;
        private Timer? _timer;

        public DailyTankReconciliationService(
            IServiceProvider serviceProvider,
            ILogger<DailyTankReconciliationService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Daily Tank Reconciliation Service started");

            // Calculate time until next run (e.g., 2 AM daily)
            var now = DateTime.Now;
            var scheduledTime = new DateTime(now.Year, now.Month, now.Day, 2, 0, 0);

            if (now > scheduledTime)
            {
                scheduledTime = scheduledTime.AddDays(1);
            }

            var initialDelay = scheduledTime - now;
            _logger.LogInformation("Next reconciliation scheduled for {Time} ({Delay} from now)",
                scheduledTime, initialDelay);

            // Wait for initial delay, then run every 24 hours
            _timer = new Timer(
                DoWork,
                null,
                initialDelay,
                TimeSpan.FromHours(24));

            await Task.CompletedTask;
        }

        private async void DoWork(object? state)
        {
            _logger.LogInformation("Starting daily tank reconciliation at {Time}", DateTime.Now);

            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                var reconciliationService = scope.ServiceProvider.GetRequiredService<TankStockReconciliationService>();

                try
                {
                    // Reconcile yesterday's data
                    var yesterday = DateTime.Now.Date.AddDays(-1);

                    _logger.LogInformation("Reconciling data for {Date}", yesterday);

                    // Get distinct tank IDs from Tankstock for yesterday
                    var tankIds = await context.Tankstocks
                        .Where(ts => ts.EntryDate.Date == yesterday.Date &&
                            (ts.IsDeleted == null || ts.IsDeleted == false))
                        .Select(ts => ts.TankId)
                        .Distinct()
                        .ToListAsync();

                    _logger.LogInformation("Processing {Count} tanks", tankIds.Count);

                    int totalDiscrepancies = 0;
                    int totalFixed = 0;
                    int tanksProcessed = 0;

                    foreach (var tankId in tankIds)
                    {
                        try
                        {
                            // Check for discrepancies
                            var reconciliation = await reconciliationService.ReconcileTankStockForDateAsync(
                                tankId, yesterday);

                            if (reconciliation.DiscrepanciesFound > 0)
                            {
                                _logger.LogWarning(
                                    "Tank {TankId}: Found {Count} discrepancies for {Date}",
                                    tankId, reconciliation.DiscrepanciesFound, yesterday);

                                totalDiscrepancies += reconciliation.DiscrepanciesFound;

                                // Auto-fix discrepancies
                                var fixResult = await reconciliationService.FixDiscrepanciesAsync(
                                    reconciliation, "DAILY_RECONCILIATION_SERVICE");

                                if (fixResult.Status == "SUCCESS")
                                {
                                    totalFixed += fixResult.RecordsFixed;
                                    _logger.LogInformation(
                                        "Tank {TankId}: Fixed {Count} records",
                                        tankId, fixResult.RecordsFixed);
                                }
                                else
                                {
                                    _logger.LogError(
                                        "Tank {TankId}: Failed to fix discrepancies - {Message}",
                                        tankId, fixResult.Message);
                                }
                            }

                            tanksProcessed++;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error reconciling Tank {TankId} for {Date}", tankId, yesterday);
                        }
                    }

                    _logger.LogInformation(
                        "Daily reconciliation completed: Processed {TanksCount} tanks, Found {DiscrepancyCount} discrepancies, Fixed {FixedCount} records",
                        tanksProcessed, totalDiscrepancies, totalFixed);

                    // Update DailyTankReconciliation table
                    await UpdateDailyReconciliationTableAsync(context, yesterday);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in daily tank reconciliation");
                }
            }
        }

        private async Task UpdateDailyReconciliationTableAsync(GpsdataContext context, DateTime date)
        {
            try
            {
                _logger.LogInformation("Updating DailyTankReconciliation table for {Date}", date);

                // Get all tanks with TankStock entries for this date
                var tankStockData = await context.Tankstocks
                    .Where(ts => ts.EntryDate.Date == date && !ts.IsDeleted)
                    .Include(ts => ts.Tank)
                    .ToListAsync();

                foreach (var tankStock in tankStockData)
                {
                    var existingReconciliation = await context.Dailytankreconciliations
                        .FirstOrDefaultAsync(r => r.TankId == tankStock.TankId &&
                                                  r.ReconciliationDate.Date == date);

                    if (existingReconciliation == null)
                    {
                        // Create new reconciliation record
                        var reconciliation = new Dailytankreconciliation
                        {
                            TankId = tankStock.TankId,
                            ReconciliationDate = date,
                            CreatedOn = DateTime.UtcNow,
                            OpeningLevel = tankStock.ManualOpeningLevel,
                            ClosingLevel = tankStock.ManualClosingLevel,
                            TotalDeliveries = tankStock.DeliveryAmount,
                            TotalTransfersIn = tankStock.TransferInAmount,
                            TotalTransfersOut = tankStock.TransferOutAmount,
                            // TotalRefills would come from FuelRefill aggregation
                            TotalRefills = await GetTotalRefillsForDateAsync(context, tankStock.TankId, date)
                        };

                        await context.Dailytankreconciliations.AddAsync(reconciliation);
                    }
                    else
                    {
                        // Update existing record
                        existingReconciliation.OpeningLevel = tankStock.ManualOpeningLevel;
                        existingReconciliation.ClosingLevel = tankStock.ManualClosingLevel;
                        existingReconciliation.TotalDeliveries = tankStock.DeliveryAmount;
                        existingReconciliation.TotalTransfersIn = tankStock.TransferInAmount;
                        existingReconciliation.TotalTransfersOut = tankStock.TransferOutAmount;
                        existingReconciliation.TotalRefills = await GetTotalRefillsForDateAsync(context, tankStock.TankId, date);
                    }
                }

                await context.SaveChangesAsync();
                _logger.LogInformation("DailyTankReconciliation table updated for {Date}", date);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating DailyTankReconciliation table for {Date}", date);
            }
        }

        private async Task<decimal?> GetTotalRefillsForDateAsync(GpsdataContext context, int tankId, DateTime date)
        {
            try
            {
                var total = await context.FuelRefills
                    .Where(fr => fr.TankId == tankId &&
                           fr.Date.HasValue &&
                           fr.Date.Value.Date == date &&
                           !fr.IsDeleted)
                    .SumAsync(fr => fr.ManualFuelrefillAmount ?? 0);

                return total > 0 ? total : null;
            }
            catch
            {
                return null;
            }
        }

        public override void Dispose()
        {
            _timer?.Dispose();
            base.Dispose();
        }
    }
}
