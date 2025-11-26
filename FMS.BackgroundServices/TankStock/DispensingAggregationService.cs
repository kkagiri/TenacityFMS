using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.TankStock
{
    /// <summary>
    /// Background service that aggregates fuel dispensing from FuelRefills table
    /// and updates TankStock.ManualCalculatedUsage for the current day.
    /// Runs every 15 minutes to keep dispensing data synchronized.
    /// </summary>
    public class DispensingAggregationService : BackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<DispensingAggregationService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromMinutes(15); // Run every 15 minutes

        public DispensingAggregationService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<DispensingAggregationService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DispensingAggregationService started at {Time}", DateTimeOffset.Now);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await AggregateDispensingForToday(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in DispensingAggregationService");
                }

                // Wait for the next interval
                try
                {
                    await Task.Delay(_interval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    // Expected when service is stopping
                    _logger.LogInformation("DispensingAggregationService is stopping");
                    break;
                }
            }

            _logger.LogInformation("DispensingAggregationService stopped at {Time}", DateTimeOffset.Now);
        }

        private async Task AggregateDispensingForToday(CancellationToken cancellationToken)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

            var today = DateTime.Now.Date;

            _logger.LogDebug("Starting dispensing aggregation for {Date}", today);

            try
            {
                // Get all TankStock entries for today that have opening stock
                var tankStocksForToday = await context.Tankstocks
                    .Where(ts => ts.EntryDate.Date == today &&
                                 !ts.IsDeleted &&
                                 ts.ManualOpeningLevel.HasValue)
                    .ToListAsync(cancellationToken);

                if (!tankStocksForToday.Any())
                {
                    _logger.LogDebug("No TankStock entries found for {Date}", today);
                    return;
                }

                _logger.LogDebug("Found {Count} TankStock entries for {Date}", tankStocksForToday.Count, today);

                int updatedCount = 0;
                int unchangedCount = 0;

                foreach (var tankStock in tankStocksForToday)
                {
                    try
                    {
                        // Aggregate FuelRefills for this tank today
                        var totalDispensing = await context.FuelRefills
                            .Where(fr => fr.TankId == tankStock.TankId &&
                                        fr.Date.HasValue &&
                                        fr.Date.Value.Date == today &&
                                        fr.IsDeleted != true)
                            .SumAsync(fr => fr.ManualFuelrefillAmount ?? 0, cancellationToken);

                        // Only update if the value has changed
                        if (tankStock.ManualCalculatedUsage != totalDispensing)
                        {
                            tankStock.ManualCalculatedUsage = totalDispensing;
                            context.Tankstocks.Update(tankStock);
                            updatedCount++;

                            _logger.LogDebug("Updated TankStock EntryID {EntryId} for Tank {TankId}: ManualCalculatedUsage = {Amount}L",
                                tankStock.EntryId, tankStock.TankId, totalDispensing);
                        }
                        else
                        {
                            unchangedCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error aggregating dispensing for TankStock EntryID {EntryId}, Tank {TankId}",
                            tankStock.EntryId, tankStock.TankId);
                    }
                }

                if (updatedCount > 0)
                {
                    await context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Dispensing aggregation completed for {Date}: {UpdatedCount} updated, {UnchangedCount} unchanged",
                        today, updatedCount, unchangedCount);
                }
                else
                {
                    _logger.LogDebug("No changes needed for {Date}: All {Count} entries already up-to-date",
                        today, unchangedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during dispensing aggregation for {Date}", today);
                throw;
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("DispensingAggregationService is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
