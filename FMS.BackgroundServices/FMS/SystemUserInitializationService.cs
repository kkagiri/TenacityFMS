using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services {
    /// <summary>
    /// Background service that ensures system users exist when the application starts
    /// </summary>
    ///
    namespace FMS.BackgroundServices.FMS {
        public class SystemUserInitializationService : BackgroundService {
            private readonly IServiceProvider _serviceProvider;
            private readonly ILogger<SystemUserInitializationService> _logger;

            public SystemUserInitializationService (
                IServiceProvider serviceProvider,
                ILogger<SystemUserInitializationService> logger) {
                _serviceProvider = serviceProvider;
                _logger = logger;
            }

            protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
                try {
                    // Wait a bit for the application to fully start
                    await Task.Delay (5000, stoppingToken);

                    _logger.LogInformation ("Starting system user initialization...");

                    using var scope = _serviceProvider.CreateScope ();
                    var systemUserService = scope.ServiceProvider.GetService<ISystemUserService> ();

                    if (systemUserService == null) {
                        _logger.LogWarning ("SystemUserService is not registered, skipping system user initialization");
                        return;
                    }

                    // Ensure system user exists
                    var systemUserResult = await systemUserService.EnsureSystemUserExistsAsync (stoppingToken);
                    if (systemUserResult.IsSuccess) {
                        _logger.LogInformation ("System user ensured: {Message}", systemUserResult.Message);
                    } else {
                        _logger.LogError ("Failed to ensure system user exists: {Message}", systemUserResult.Message);
                    }

                    // Ensure system administrator exists
                    var systemAdminResult = await systemUserService.EnsureSystemAdministratorExistsAsync (stoppingToken);
                    if (systemAdminResult.IsSuccess) {
                        _logger.LogInformation ("System administrator ensured: {Message}", systemAdminResult.Message);
                    } else {
                        _logger.LogError ("Failed to ensure system administrator exists: {Message}", systemAdminResult.Message);
                    }

                    _logger.LogInformation ("System user initialization completed");
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error during system user initialization");
                }
            }
        }
    }
}