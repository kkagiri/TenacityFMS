using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using HyoungFMS.Deployment.Interfaces;
using HyoungFMS.Deployment.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HyoungFMS.Deployment.Services
{
    /// <summary>
    /// Implementation of the Deployment Service interface
    /// </summary>
    public class DeploymentService : IDeploymentService
    {
        private readonly ILogger<DeploymentService> _logger;
        private readonly IConfiguration _config;
        private readonly IIISManager _iisManager;
        private readonly IFileManager _fileManager;
        private readonly INotificationService _notificationService;
        private readonly HttpClient _httpClient;
        private readonly DateTime _startTime;

        public DeploymentService(
            ILogger<DeploymentService> logger,
            IConfiguration config,
            IIISManager iisManager,
            IFileManager fileManager,
            INotificationService notificationService,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _config = config;
            _iisManager = iisManager;
            _fileManager = fileManager;
            _notificationService = notificationService;
            _httpClient = httpClientFactory.CreateClient();
            _startTime = DateTime.Now;
        }

        /// <inheritdoc />
        public async Task<bool> ExecuteDeploymentAsync(bool frontendOnly, bool backendOnly)
        {
            string deploymentType = DetermineDeploymentType(frontendOnly, backendOnly);
            _logger.LogInformation($"Starting {deploymentType} deployment");

            try
            {
                // 1. Validate deployment environment
                if (!await ValidateDeploymentEnvironmentAsync())
                {
                    _logger.LogError("Deployment environment validation failed");
                    return false;
                }

                // 2. Stop IIS services
                _logger.LogInformation("Stopping IIS services");
                if (!await _iisManager.StopRequiredServicesAsync(frontendOnly, backendOnly))
                {
                    _logger.LogWarning("Failed to completely stop IIS services, will try to proceed anyway");
                    await _iisManager.ReleaseLogDirectoryLocksAsync();

                    // Add a pause to give IIS more time to release locks
                    _logger.LogInformation("Waiting 10 seconds for processes to release file handles");
                    await Task.Delay(TimeSpan.FromSeconds(10));
                }

                // 3. Backup current deployment
                _logger.LogInformation("Backing up current deployment");
                await _fileManager.BackupCurrentDeploymentAsync(frontendOnly, backendOnly);

                // 4. Deploy components based on parameters
                bool deploymentSuccess = true;

                if (!backendOnly)
                {
                    _logger.LogInformation("Starting frontend deployment");
                    // Build frontend if needed
                    if (bool.Parse(_config["BuildSettings:BuildFrontendOnServer"] ?? "false"))
                    {
                        if (!await _fileManager.BuildFrontendAsync())
                        {
                            _logger.LogError("Frontend build failed");
                            return false;
                        }
                    }

                    // Deploy frontend
                    if (!await _fileManager.DeployFrontendAsync())
                    {
                        _logger.LogError("Frontend deployment failed");
                        return false;
                    }
                    _logger.LogInformation("Frontend deployment completed successfully");
                }
                else
                {
                    _logger.LogInformation("Skipping frontend deployment (backendOnly flag is set)");
                }

                if (!frontendOnly)
                {
                    _logger.LogInformation("Starting backend deployment");
                    // Build backend if needed
                    if (bool.Parse(_config["BuildSettings:BuildBackendOnServer"] ?? "false"))
                    {
                        if (!await _fileManager.BuildBackendAsync())
                        {
                            _logger.LogError("Backend build failed");
                            return false;
                        }
                    }

                    // Deploy backend
                    if (!await _fileManager.DeployBackendAsync())
                    {
                        _logger.LogError("Backend deployment failed");
                        return false;
                    }
                    _logger.LogInformation("Backend deployment completed successfully");
                }
                else
                {
                    _logger.LogInformation("Skipping backend deployment (frontendOnly flag is set)");
                }

                // 5. Start IIS services
                _logger.LogInformation("Starting IIS services");
                if (!await _iisManager.StartRequiredServicesAsync(frontendOnly, backendOnly))
                {
                    _logger.LogWarning("Failed to start all IIS services, application may not be fully functional");
                }

                // 6. Perform health check
                bool healthCheckSuccess = await PerformHealthCheckAsync();
                if (!healthCheckSuccess)
                {
                    _logger.LogWarning("Health checks failed. Consider manual verification.");
                }

                // 7. Generate deployment summary
                var summary = GenerateDeploymentSummary(frontendOnly, backendOnly, deploymentSuccess, healthCheckSuccess);

                // 8. Send notification
                await _notificationService.SendDeploymentNotificationAsync(summary, deploymentSuccess && healthCheckSuccess);

                return deploymentSuccess && healthCheckSuccess;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"{deploymentType} deployment failed with error");
                await _notificationService.SendErrorNotificationAsync(ex);
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> ValidateDeploymentEnvironmentAsync()
        {
            _logger.LogInformation("Validating deployment environment");

            try
            {
                // 1. Check if required paths exist
                string reactBuildPath = _config["DeploymentSettings:ReactBuildPath"];
                string webApiBuildPath = _config["DeploymentSettings:WebApiBuildPath"];
                string reactDeploymentPath = _config["DeploymentSettings:ReactDeploymentPath"];
                string webApiDeploymentPath = _config["DeploymentSettings:WebApiDeploymentPath"];

                if (string.IsNullOrEmpty(reactBuildPath) || string.IsNullOrEmpty(webApiBuildPath) ||
                    string.IsNullOrEmpty(reactDeploymentPath) || string.IsNullOrEmpty(webApiDeploymentPath))
                {
                    _logger.LogError("One or more required paths are not configured");
                    return false;
                }

                // 2. Check if IIS site and app pool exist
                string frontendSiteName = _config["DeploymentSettings:IisSiteName"];
                string backendSiteName = _config["DeploymentSettings:BackendSiteName"] ?? frontendSiteName;
                string appPoolName = _config["DeploymentSettings:IisAppPool"];

                if (string.IsNullOrEmpty(frontendSiteName) || string.IsNullOrEmpty(appPoolName))
                {
                    _logger.LogError("IIS site or app pool names are not configured");
                    return false;
                }

                if (!await _iisManager.SiteExistsAsync(frontendSiteName))
                {
                    _logger.LogError($"Frontend IIS site '{frontendSiteName}' does not exist");
                    return false;
                }

                if (frontendSiteName != backendSiteName && !await _iisManager.SiteExistsAsync(backendSiteName))
                {
                    _logger.LogError($"Backend IIS site '{backendSiteName}' does not exist");
                    return false;
                }

                if (!await _iisManager.AppPoolExistsAsync(appPoolName))
                {
                    _logger.LogError($"IIS application pool '{appPoolName}' does not exist");
                    return false;
                }

                // 3. Check if build paths exist
                if (!Directory.Exists(reactBuildPath))
                {
                    _logger.LogError($"Frontend build path does not exist: {reactBuildPath}");
                    return false;
                }

                if (!Directory.Exists(webApiBuildPath))
                {
                    _logger.LogError($"Backend build path does not exist: {webApiBuildPath}");
                    return false;
                }

                // 4. Check if deployment paths are accessible
                try
                {
                    if (!Directory.Exists(reactDeploymentPath))
                    {
                        Directory.CreateDirectory(reactDeploymentPath);
                        _logger.LogInformation($"Created frontend deployment directory: {reactDeploymentPath}");
                    }

                    if (!Directory.Exists(webApiDeploymentPath))
                    {
                        Directory.CreateDirectory(webApiDeploymentPath);
                        _logger.LogInformation($"Created backend deployment directory: {webApiDeploymentPath}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create deployment directories");
                    return false;
                }

                _logger.LogInformation("Deployment environment validation passed");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating deployment environment");
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> RollbackDeploymentAsync(bool frontendOnly, bool backendOnly)
        {
            _logger.LogInformation("Starting rollback of deployment");

            try
            {
                // 1. Stop IIS services
                _logger.LogInformation("Stopping IIS services for rollback");
                if (!await _iisManager.StopRequiredServicesAsync(frontendOnly, backendOnly))
                {
                    _logger.LogWarning("Failed to completely stop IIS services for rollback, will try to proceed anyway");
                }

                // 2. Restore from backup
                bool restoreSuccess = await _fileManager.RestoreFromBackupAsync(frontendOnly, backendOnly);

                if (!restoreSuccess)
                {
                    _logger.LogError("Failed to restore from backup");
                    await _notificationService.SendCustomNotificationAsync(
                        "Rollback Failed",
                        "Failed to restore from backup during rollback operation. Manual intervention may be required.",
                        isError: true);
                    return false;
                }

                // 3. Start IIS services
                _logger.LogInformation("Starting IIS services after rollback");
                if (!await _iisManager.StartRequiredServicesAsync(frontendOnly, backendOnly))
                {
                    _logger.LogWarning("Failed to start all IIS services after rollback, application may not be fully functional");
                }

                // 4. Send notification
                await _notificationService.SendCustomNotificationAsync(
                    "Deployment Rolled Back",
                    "The deployment has been rolled back to the previous version due to errors or health check failures.",
                    isError: false);

                _logger.LogInformation("Rollback completed successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during rollback");
                await _notificationService.SendErrorNotificationAsync(ex);
                return false;
            }
        }

        private string DetermineDeploymentType(bool frontendOnly, bool backendOnly)
        {
            if (frontendOnly) return "Frontend Only";
            if (backendOnly) return "Backend Only";
            return "Full (Frontend and Backend)";
        }

        private async Task<bool> PerformHealthCheckAsync()
        {
            string healthCheckUrl = _config["DeploymentSettings:HealthCheckUrl"];
            if (string.IsNullOrEmpty(healthCheckUrl))
            {
                _logger.LogInformation("No health check URL configured, skipping health check");
                return true;
            }

            _logger.LogInformation($"Performing health check against: {healthCheckUrl}");
            int retryCount = int.Parse(_config["DeploymentSettings:HealthCheckRetries"] ?? "3");
            int retryDelaySeconds = int.Parse(_config["DeploymentSettings:HealthCheckRetryDelay"] ?? "5");

            for (int i = 0; i < retryCount; i++)
            {
                try
                {
                    _logger.LogInformation($"Health check attempt {i + 1} of {retryCount}");
                    var response = await _httpClient.GetAsync(healthCheckUrl);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation($"Health check passed: Status {(int)response.StatusCode}");
                        return true;
                    }
                    else
                    {
                        _logger.LogWarning($"Health check returned non-200 status: {(int)response.StatusCode}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Health check failed");
                }

                if (i < retryCount - 1)
                {
                    _logger.LogInformation($"Waiting {retryDelaySeconds} seconds before next retry");
                    await Task.Delay(TimeSpan.FromSeconds(retryDelaySeconds));
                }
            }

            _logger.LogError("All health checks failed. Deployment may be unstable.");
            return false;
        }

        private DeploymentSummary GenerateDeploymentSummary(bool frontendOnly, bool backendOnly, bool deploymentSuccess, bool healthCheckSuccess)
        {
            string deploymentType = DetermineDeploymentType(frontendOnly, backendOnly);
            DateTime endTime = DateTime.Now;
            TimeSpan duration = endTime - _startTime;

            int frontendFileCount = 0;
            int backendFileCount = 0;

            // Count files in deployment directories
            if (!backendOnly && !string.IsNullOrEmpty(_config["DeploymentSettings:ReactDeploymentPath"]))
            {
                string reactPath = _config["DeploymentSettings:ReactDeploymentPath"];
                if (Directory.Exists(reactPath))
                {
                    frontendFileCount = Directory.GetFiles(reactPath, "*", SearchOption.AllDirectories).Length;
                }
            }

            if (!frontendOnly && !string.IsNullOrEmpty(_config["DeploymentSettings:WebApiDeploymentPath"]))
            {
                string webApiPath = _config["DeploymentSettings:WebApiDeploymentPath"];
                if (Directory.Exists(webApiPath))
                {
                    backendFileCount = Directory.GetFiles(webApiPath, "*", SearchOption.AllDirectories).Length;
                }
            }

            return new DeploymentSummary
            {
                DeploymentType = deploymentType,
                StartTime = _startTime,
                EndTime = endTime,
                Duration = duration,
                Success = deploymentSuccess,
                HealthCheckSuccess = healthCheckSuccess,
                Environment = _config["DeploymentSettings:Environment"],
                ServerName = Environment.MachineName,
                FrontendSite = _config["DeploymentSettings:IisSiteName"],
                BackendSite = _config["DeploymentSettings:BackendSiteName"],
                ApplicationPool = _config["DeploymentSettings:IisAppPool"],
                FrontendFileCount = frontendFileCount,
                BackendFileCount = backendFileCount
            };
        }
    }
}