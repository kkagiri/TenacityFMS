using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services
{
    public class DatabaseSeedingHostedService : IHostedService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DatabaseSeedingHostedService> _logger;

        public DatabaseSeedingHostedService(
            IServiceProvider serviceProvider,
            ILogger<DatabaseSeedingHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Database seeding service starting...");

            using var scope = _serviceProvider.CreateScope();
            var seedService = scope.ServiceProvider.GetRequiredService<ISeedDataService>();

            try
            {
                await seedService.SeedInitialDataAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while seeding the database");
                // Don't throw here - allow the application to continue starting
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Database seeding service stopping...");
            return Task.CompletedTask;
        }
    }
}