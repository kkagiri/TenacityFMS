using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using HyoungFMS.Deployment.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HyoungFMS.Deployment.Services
{
    /// <summary>
    /// Implementation of the File Manager interface
    /// </summary>
    public class FileManager : IFileManager
    {
        private readonly ILogger<FileManager> _logger;
        private readonly IConfiguration _config;
        private string _currentFrontendBackup;
        private string _currentBackendBackup;

        public FileManager(ILogger<FileManager> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;
        }

        /// <inheritdoc />
        public async Task<bool> BackupCurrentDeploymentAsync(bool frontendOnly, bool backendOnly)
        {
            _logger.LogInformation("Starting backup of current deployment");

            string backupDir = _config["BackupSettings:BackupDirectory"];
            if (string.IsNullOrEmpty(backupDir))
            {
                backupDir = Path.Combine(Path.GetTempPath(), "HyoungFMS_Backups");
                _logger.LogWarning($"Backup directory not configured, using temporary directory: {backupDir}");
            }

            // Create backup directory if it doesn't exist
            if (!Directory.Exists(backupDir))
            {
                try
                {
                    Directory.CreateDirectory(backupDir);
                    _logger.LogInformation($"Created backup directory: {backupDir}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to create backup directory: {backupDir}");
                    return false;
                }
            }

            // Generate timestamp for backup folders
            string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            bool success = true;

            // Backup frontend if needed
            if (!backendOnly)
            {
                string reactDeploymentPath = _config["DeploymentSettings:ReactDeploymentPath"];
                if (string.IsNullOrEmpty(reactDeploymentPath))
                {
                    _logger.LogError("Frontend deployment path not configured");
                    success = false;
                }
                else if (!Directory.Exists(reactDeploymentPath))
                {
                    _logger.LogWarning($"Frontend deployment path does not exist: {reactDeploymentPath}");
                }
                else
                {
                    string frontendBackupPath = Path.Combine(backupDir, $"frontend_backup_{timestamp}");
                    _logger.LogInformation($"Backing up frontend from {reactDeploymentPath} to {frontendBackupPath}");

                    try
                    {
                        // Use robocopy for reliable copying
                        bool frontendBackupSuccess = await RunRobocopyAsync(reactDeploymentPath, frontendBackupPath, "/MIR /R:3 /W:5 /MT:8 /NFL /NDL");

                        if (frontendBackupSuccess)
                        {
                            _currentFrontendBackup = frontendBackupPath;
                            _logger.LogInformation($"Frontend backup completed successfully: {frontendBackupPath}");
                        }
                        else
                        {
                            _logger.LogError("Frontend backup failed");
                            success = false;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during frontend backup");
                        success = false;
                    }
                }
            }

            // Backup backend if needed
            if (!frontendOnly)
            {
                string webApiDeploymentPath = _config["DeploymentSettings:WebApiDeploymentPath"];
                if (string.IsNullOrEmpty(webApiDeploymentPath))
                {
                    _logger.LogError("Backend deployment path not configured");
                    success = false;
                }
                else if (!Directory.Exists(webApiDeploymentPath))
                {
                    _logger.LogWarning($"Backend deployment path does not exist: {webApiDeploymentPath}");
                }
                else
                {
                    string backendBackupPath = Path.Combine(backupDir, $"backend_backup_{timestamp}");
                    _logger.LogInformation($"Backing up backend from {webApiDeploymentPath} to {backendBackupPath}");

                    try
                    {
                        // Use robocopy for reliable copying
                        bool backendBackupSuccess = await RunRobocopyAsync(webApiDeploymentPath, backendBackupPath, "/MIR /R:3 /W:5 /MT:8 /NFL /NDL");

                        if (backendBackupSuccess)
                        {
                            _currentBackendBackup = backendBackupPath;
                            _logger.LogInformation($"Backend backup completed successfully: {backendBackupPath}");
                        }
                        else
                        {
                            _logger.LogError("Backend backup failed");
                            success = false;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during backend backup");
                        success = false;
                    }
                }
            }

            // Clean up old backups
            int maxBackupsToKeep = int.Parse(_config["BackupSettings:MaxBackupsToKeep"] ?? "5");
            await CleanupOldBackupsAsync(maxBackupsToKeep);

            return success;
        }

        /// <inheritdoc />
        public async Task<bool> DeployFrontendAsync()
        {
            _logger.LogInformation("Starting frontend deployment");

            string reactBuildPath = _config["DeploymentSettings:ReactBuildPath"];
            string reactDeploymentPath = _config["DeploymentSettings:ReactDeploymentPath"];

            if (string.IsNullOrEmpty(reactBuildPath) || string.IsNullOrEmpty(reactDeploymentPath))
            {
                _logger.LogError("Frontend build or deployment path not configured");
                return false;
            }

            if (!Directory.Exists(reactBuildPath))
            {
                _logger.LogError($"Frontend build path does not exist: {reactBuildPath}");
                return false;
            }

            // Create deployment directory if it doesn't exist
            if (!Directory.Exists(reactDeploymentPath))
            {
                try
                {
                    Directory.CreateDirectory(reactDeploymentPath);
                    _logger.LogInformation($"Created frontend deployment directory: {reactDeploymentPath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to create frontend deployment directory: {reactDeploymentPath}");
                    return false;
                }
            }

            _logger.LogInformation($"Deploying frontend from {reactBuildPath} to {reactDeploymentPath}");

            try
            {
                // Use robocopy for reliable copying
                bool deploySuccess = await RunRobocopyAsync(reactBuildPath, reactDeploymentPath, "/MIR /R:3 /W:5 /MT:8");

                if (deploySuccess)
                {
                    _logger.LogInformation("Frontend deployment completed successfully");
                    return true;
                }
                else
                {
                    _logger.LogError("Frontend deployment failed");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during frontend deployment");
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> DeployBackendAsync()
        {
            _logger.LogInformation("Starting backend deployment");

            string webApiBuildPath = _config["DeploymentSettings:WebApiBuildPath"];
            string webApiDeploymentPath = _config["DeploymentSettings:WebApiDeploymentPath"];

            if (string.IsNullOrEmpty(webApiBuildPath) || string.IsNullOrEmpty(webApiDeploymentPath))
            {
                _logger.LogError("Backend build or deployment path not configured");
                return false;
            }

            if (!Directory.Exists(webApiBuildPath))
            {
                _logger.LogError($"Backend build path does not exist: {webApiBuildPath}");
                return false;
            }

            // Create deployment directory if it doesn't exist
            if (!Directory.Exists(webApiDeploymentPath))
            {
                try
                {
                    Directory.CreateDirectory(webApiDeploymentPath);
                    _logger.LogInformation($"Created backend deployment directory: {webApiDeploymentPath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to create backend deployment directory: {webApiDeploymentPath}");
                    return false;
                }
            }

            // Check for web.config in the destination
            string destWebConfig = Path.Combine(webApiDeploymentPath, "web.config");
            string tempWebConfig = null;

            if (File.Exists(destWebConfig))
            {
                // Preserve existing web.config
                _logger.LogInformation("Preserving existing web.config");
                tempWebConfig = Path.Combine(Path.GetTempPath(), $"web.config.backup_{DateTime.Now:yyyyMMdd_HHmmss}");
                File.Copy(destWebConfig, tempWebConfig, true);
            }

            _logger.LogInformation($"Deploying backend from {webApiBuildPath} to {webApiDeploymentPath}");

            try
            {
                // Use robocopy for reliable copying
                bool deploySuccess = await RunRobocopyAsync(webApiBuildPath, webApiDeploymentPath, "/MIR /R:3 /W:5 /MT:8");

                // Restore web.config if needed
                if (tempWebConfig != null)
                {
                    _logger.LogInformation("Restoring web.config");
                    File.Copy(tempWebConfig, destWebConfig, true);
                    File.Delete(tempWebConfig);
                }

                if (deploySuccess)
                {
                    _logger.LogInformation("Backend deployment completed successfully");
                    return true;
                }
                else
                {
                    _logger.LogError("Backend deployment failed");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during backend deployment");

                // Attempt to restore web.config even if deployment failed
                if (tempWebConfig != null && File.Exists(tempWebConfig))
                {
                    try
                    {
                        File.Copy(tempWebConfig, destWebConfig, true);
                        File.Delete(tempWebConfig);
                    }
                    catch (Exception webConfigEx)
                    {
                        _logger.LogError(webConfigEx, "Failed to restore web.config after deployment error");
                    }
                }

                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> BuildFrontendAsync()
        {
            _logger.LogInformation("Building frontend is not implemented in this version");
            return true;
        }

        /// <inheritdoc />
        public async Task<bool> BuildBackendAsync()
        {
            _logger.LogInformation("Building backend is not implemented in this version");
            return true;
        }

        /// <inheritdoc />
        public async Task<bool> RestoreFromBackupAsync(bool frontendOnly, bool backendOnly)
        {
            _logger.LogInformation("Starting rollback to previous deployment");
            bool success = true;

            // Restore frontend if needed
            if (!backendOnly && !string.IsNullOrEmpty(_currentFrontendBackup) && Directory.Exists(_currentFrontendBackup))
            {
                string reactDeploymentPath = _config["DeploymentSettings:ReactDeploymentPath"];
                if (string.IsNullOrEmpty(reactDeploymentPath))
                {
                    _logger.LogError("Frontend deployment path not configured");
                    success = false;
                }
                else
                {
                    _logger.LogInformation($"Restoring frontend from {_currentFrontendBackup} to {reactDeploymentPath}");

                    try
                    {
                        // Use robocopy for reliable copying
                        bool frontendRestoreSuccess = await RunRobocopyAsync(_currentFrontendBackup, reactDeploymentPath, "/MIR /R:3 /W:5 /MT:8");

                        if (frontendRestoreSuccess)
                        {
                            _logger.LogInformation("Frontend restore completed successfully");
                        }
                        else
                        {
                            _logger.LogError("Frontend restore failed");
                            success = false;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during frontend restore");
                        success = false;
                    }
                }
            }
            else if (!backendOnly)
            {
                _logger.LogWarning("No frontend backup available for restore");
            }

            // Restore backend if needed
            if (!frontendOnly && !string.IsNullOrEmpty(_currentBackendBackup) && Directory.Exists(_currentBackendBackup))
            {
                string webApiDeploymentPath = _config["DeploymentSettings:WebApiDeploymentPath"];
                if (string.IsNullOrEmpty(webApiDeploymentPath))
                {
                    _logger.LogError("Backend deployment path not configured");
                    success = false;
                }
                else
                {
                    _logger.LogInformation($"Restoring backend from {_currentBackendBackup} to {webApiDeploymentPath}");

                    try
                    {
                        // Use robocopy for reliable copying
                        bool backendRestoreSuccess = await RunRobocopyAsync(_currentBackendBackup, webApiDeploymentPath, "/MIR /R:3 /W:5 /MT:8");

                        if (backendRestoreSuccess)
                        {
                            _logger.LogInformation("Backend restore completed successfully");
                        }
                        else
                        {
                            _logger.LogError("Backend restore failed");
                            success = false;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during backend restore");
                        success = false;
                    }
                }
            }
            else if (!frontendOnly)
            {
                _logger.LogWarning("No backend backup available for restore");
            }

            return success;
        }

        /// <inheritdoc />
        public async Task<bool> CleanupOldBackupsAsync(int maxBackupsToKeep)
        {
            _logger.LogInformation($"Cleaning up old backups, keeping {maxBackupsToKeep} most recent");

            string backupDir = _config["BackupSettings:BackupDirectory"];
            if (string.IsNullOrEmpty(backupDir) || !Directory.Exists(backupDir))
            {
                _logger.LogWarning("Backup directory not configured or does not exist");
                return false;
            }

            try
            {
                // Get frontend backups
                var frontendBackups = Directory.GetDirectories(backupDir, "frontend_backup_*")
                    .OrderByDescending(d => d)
                    .Skip(maxBackupsToKeep)
                    .ToList();

                // Get backend backups
                var backendBackups = Directory.GetDirectories(backupDir, "backend_backup_*")
                    .OrderByDescending(d => d)
                    .Skip(maxBackupsToKeep)
                    .ToList();

                // Delete old frontend backups
                foreach (var backup in frontendBackups)
                {
                    _logger.LogInformation($"Deleting old frontend backup: {backup}");
                    Directory.Delete(backup, true);
                }

                // Delete old backend backups
                foreach (var backup in backendBackups)
                {
                    _logger.LogInformation($"Deleting old backend backup: {backup}");
                    Directory.Delete(backup, true);
                }

                _logger.LogInformation($"Cleanup completed. Deleted {frontendBackups.Count} frontend backups and {backendBackups.Count} backend backups");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old backups");
                return false;
            }
        }

        private async Task<bool> RunRobocopyAsync(string source, string destination, string arguments)
        {
            return await Task.Run(() =>
            {
                try
                {
                    var startInfo = new ProcessStartInfo
                    {
                        FileName = "robocopy.exe",
                        Arguments = $"\"{source}\" \"{destination}\" {arguments}",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    _logger.LogInformation($"Running robocopy: {startInfo.FileName} {startInfo.Arguments}");

                    using var process = Process.Start(startInfo);
                    var output = process.StandardOutput.ReadToEnd();
                    var error = process.StandardError.ReadToEnd();
                    process.WaitForExit();

                    // Robocopy has special exit codes:
                    // 0 = No files copied
                    // 1 = Files copied successfully
                    // 2 = Extra files or directories detected
                    // 3 = Some files copied, some failed
                    // 4+ = Failure
                    if (process.ExitCode >= 0 && process.ExitCode <= 3)
                    {
                        _logger.LogInformation($"Robocopy completed with exit code {process.ExitCode}");
                        _logger.LogDebug($"Robocopy output: {output}");
                        return true;
                    }
                    else
                    {
                        _logger.LogError($"Robocopy failed with exit code {process.ExitCode}");
                        _logger.LogError($"Robocopy error: {error}");
                        _logger.LogError($"Robocopy output: {output}");
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error executing robocopy");
                    return false;
                }
            });
        }
    }
}