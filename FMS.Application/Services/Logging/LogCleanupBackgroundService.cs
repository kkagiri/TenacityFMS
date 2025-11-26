using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Logging
{
    /// <summary>
    /// Background service that periodically cleans up old log files
    /// Runs daily at 2:00 AM
    /// </summary>
    public class LogCleanupBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LogCleanupBackgroundService> _logger;
        private const int CLEANUP_HOUR = 2; // 2:00 AM
        private const int CHECK_INTERVAL_MINUTES = 60; // Check every hour

        public LogCleanupBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<LogCleanupBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Log Cleanup Background Service started. Will run daily at {Hour}:00", CLEANUP_HOUR);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var nextRun = CalculateNextRunTime(now);
                    var delay = nextRun - now;

                    _logger.LogDebug("Next log cleanup scheduled for: {NextRun}", nextRun);

                    // Wait until the next scheduled run time
                    await Task.Delay(delay, stoppingToken);

                    if (!stoppingToken.IsCancellationRequested)
                    {
                        await PerformCleanupAsync(stoppingToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Log Cleanup Background Service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error in Log Cleanup Background Service");
                    // Wait before retrying to avoid tight error loops
                    await Task.Delay(TimeSpan.FromMinutes(CHECK_INTERVAL_MINUTES), stoppingToken);
                }
            }

            _logger.LogInformation("Log Cleanup Background Service stopped");
        }

        private async Task PerformCleanupAsync(CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Starting scheduled log cleanup");

                using (var scope = _serviceProvider.CreateScope())
                {
                    var cleanupService = scope.ServiceProvider.GetRequiredService<ILogCleanupService>();
                    var deletedCount = await cleanupService.CleanupOldLogsAsync(cancellationToken);

                    _logger.LogInformation("Scheduled log cleanup completed. Files deleted: {DeletedCount}", deletedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during scheduled log cleanup");
            }
        }

        private DateTime CalculateNextRunTime(DateTime currentTime)
        {
            var nextRun = currentTime.Date.AddHours(CLEANUP_HOUR);

            // If the cleanup time has already passed today, schedule for tomorrow
            if (currentTime >= nextRun)
            {
                nextRun = nextRun.AddDays(1);
            }

            return nextRun;
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Log Cleanup Background Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
