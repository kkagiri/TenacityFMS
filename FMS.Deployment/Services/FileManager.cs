using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
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
        private string? _currentVersionNumber;

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
                _logger.LogWarning(
                    $"Backup directory not configured, using temporary directory: {backupDir}"
                );
            }

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

            _currentVersionNumber = GetNextVersionNumber(backupDir, "backup");
            _logger.LogInformation($"Using version {_currentVersionNumber} for this backup");

            bool success = true;

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
                    _logger.LogWarning(
                        $"Frontend deployment path does not exist: {reactDeploymentPath}"
                    );
                }
                else
                {
                    string frontendBackupPath = Path.Combine(
                        backupDir,
                        $"frontend_backup_{_currentVersionNumber}"
                    );
                    _logger.LogInformation(
                        $"Backing up frontend from {reactDeploymentPath} to {frontendBackupPath}"
                    );

                    try
                    {
                        bool frontendBackupSuccess = await RunRobocopyAsync(
                            reactDeploymentPath,
                            frontendBackupPath,
                            "/MIR /R:3 /W:5 /MT:8 /NFL /NDL"
                        );

                        if (frontendBackupSuccess)
                        {
                            _currentFrontendBackup = frontendBackupPath;
                            _logger.LogInformation(
                                $"Frontend backup completed successfully: {frontendBackupPath}"
                            );

                            File.WriteAllText(
                                Path.Combine(frontendBackupPath, "version.txt"),
                                $"Version: {_currentVersionNumber}\nTimestamp: {DateTime.Now}\nType: Frontend"
                            );
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
                    _logger.LogWarning(
                        $"Backend deployment path does not exist: {webApiDeploymentPath}"
                    );
                }
                else
                {
                    string backendBackupPath = Path.Combine(
                        backupDir,
                        $"backend_backup_{_currentVersionNumber}"
                    );
                    _logger.LogInformation(
                        $"Backing up backend from {webApiDeploymentPath} to {backendBackupPath}"
                    );

                    try
                    {
                        bool backendBackupSuccess = await RunRobocopyAsync(
                            webApiDeploymentPath,
                            backendBackupPath,
                            "/MIR /R:3 /W:5 /MT:8 /NFL /NDL"
                        );

                        if (backendBackupSuccess)
                        {
                            _currentBackendBackup = backendBackupPath;
                            _logger.LogInformation(
                                $"Backend backup completed successfully: {backendBackupPath}"
                            );

                            File.WriteAllText(
                                Path.Combine(backendBackupPath, "version.txt"),
                                $"Version: {_currentVersionNumber}\nTimestamp: {DateTime.Now}\nType: Backend"
                            );
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
                    _logger.LogInformation(
                        $"Created frontend deployment directory: {reactDeploymentPath}"
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        $"Failed to create frontend deployment directory: {reactDeploymentPath}"
                    );
                    return false;
                }
            }

            _logger.LogInformation(
                $"Deploying frontend from {reactBuildPath} to {reactDeploymentPath}"
            );

            try
            {
                // Use robocopy for reliable copying
                bool deploySuccess = await RunRobocopyAsync(
                    reactBuildPath,
                    reactDeploymentPath,
                    "/MIR /R:3 /W:5 /MT:8"
                );

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
                    _logger.LogInformation(
                        $"Created backend deployment directory: {webApiDeploymentPath}"
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        $"Failed to create backend deployment directory: {webApiDeploymentPath}"
                    );
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
                tempWebConfig = Path.Combine(
                    Path.GetTempPath(),
                    $"web.config.backup_{DateTime.Now:yyyyMMdd_HHmmss}"
                );
                File.Copy(destWebConfig, tempWebConfig, true);
            }

            _logger.LogInformation(
                $"Deploying backend from {webApiBuildPath} to {webApiDeploymentPath}"
            );

            try
            {
                // Use robocopy for reliable copying
                bool deploySuccess = await RunRobocopyAsync(
                    webApiBuildPath,
                    webApiDeploymentPath,
                    "/MIR /R:3 /W:5 /MT:8"
                );

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
                        _logger.LogError(
                            webConfigEx,
                            "Failed to restore web.config after deployment error"
                        );
                    }
                }

                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> BuildFrontendAsync()
        {
            _logger.LogInformation("Building frontend using NPM...");

            string frontendPath = _config["BuildSettings:FrontendSourcePath"];
            if (string.IsNullOrEmpty(frontendPath))
            {
                _logger.LogError("Frontend source path not configured");
                return false;
            }

            if (!Directory.Exists(frontendPath))
            {
                _logger.LogError($"Frontend source path does not exist: {frontendPath}");
                return false;
            }

            try
            {
                // First run npm install to ensure dependencies are up to date
                // bool npmInstallSuccess = await RunProcessAsync("npm", "install", frontendPath);
                // if (!npmInstallSuccess)
                // {
                //     _logger.LogError("NPM install failed");
                //     return false;
                // }

                // Then run npm build
                bool npmBuildSuccess = await RunProcessAsync("npm", "run build", frontendPath);
                if (!npmBuildSuccess)
                {
                    _logger.LogError("NPM build failed");
                    return false;
                }

                _logger.LogInformation("Frontend build completed successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during frontend build");
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> BuildBackendAsync()
        {
            _logger.LogInformation("Building backend using dotnet...");

            string backendSolutionPath = _config["BuildSettings:BackendSolutionPath"];
            if (string.IsNullOrEmpty(backendSolutionPath))
            {
                _logger.LogError("Backend solution path not configured");
                return false;
            }

            if (!File.Exists(backendSolutionPath))
            {
                _logger.LogError($"Backend solution file does not exist: {backendSolutionPath}");
                return false;
            }

            string buildConfiguration = _config["BuildSettings:BuildConfiguration"] ?? "Release";
            string outputPath = _config["DeploymentSettings:WebApiBuildPath"];

            try
            {
                // Clean and restore first
                bool restoreSuccess = await RunProcessAsync(
                    "dotnet",
                    $"restore \"{backendSolutionPath}\"",
                    Path.GetDirectoryName(backendSolutionPath)
                );
                if (!restoreSuccess)
                {
                    _logger.LogError("Dotnet restore failed");
                    return false;
                }

                // Then build with output to the specified directory
                string buildArgs =
                    $"build \"{backendSolutionPath}\" --configuration {buildConfiguration} --no-restore";
                if (!string.IsNullOrEmpty(outputPath))
                {
                    buildArgs += $" --output \"{outputPath}\"";
                }

                bool buildSuccess = await RunProcessAsync(
                    "dotnet",
                    buildArgs,
                    Path.GetDirectoryName(backendSolutionPath)
                );
                if (!buildSuccess)
                {
                    _logger.LogError("Dotnet build failed");
                    return false;
                }

                // Also publish the WebClient project (which is the actual API)
                string webClientPath = Path.Combine(
                    Path.GetDirectoryName(backendSolutionPath),
                    "FMS.WebClient",
                    "FMS.WebClient.csproj"
                );
                if (File.Exists(webClientPath))
                {
                    string publishArgs =
                        $"publish \"{webClientPath}\" --configuration {buildConfiguration} --no-build --output \"{outputPath}\"";
                    bool publishSuccess = await RunProcessAsync(
                        "dotnet",
                        publishArgs,
                        Path.GetDirectoryName(backendSolutionPath)
                    );
                    if (!publishSuccess)
                    {
                        _logger.LogError("Dotnet publish failed");
                        return false;
                    }
                }
                else
                {
                    _logger.LogWarning(
                        $"WebClient project not found at {webClientPath}. Skipping publish step."
                    );
                }

                _logger.LogInformation("Backend build completed successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during backend build");
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> RestoreFromBackupAsync(bool frontendOnly, bool backendOnly)
        {
            _logger.LogInformation("Starting rollback to previous deployment");
            bool success = true;

            // Restore frontend if needed
            if (
                !backendOnly
                && !string.IsNullOrEmpty(_currentFrontendBackup)
                && Directory.Exists(_currentFrontendBackup)
            )
            {
                string reactDeploymentPath = _config["DeploymentSettings:ReactDeploymentPath"];
                if (string.IsNullOrEmpty(reactDeploymentPath))
                {
                    _logger.LogError("Frontend deployment path not configured");
                    success = false;
                }
                else
                {
                    _logger.LogInformation(
                        $"Restoring frontend from {_currentFrontendBackup} to {reactDeploymentPath}"
                    );

                    try
                    {
                        // Use robocopy for reliable copying
                        bool frontendRestoreSuccess = await RunRobocopyAsync(
                            _currentFrontendBackup,
                            reactDeploymentPath,
                            "/MIR /R:3 /W:5 /MT:8"
                        );

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
            if (
                !frontendOnly
                && !string.IsNullOrEmpty(_currentBackendBackup)
                && Directory.Exists(_currentBackendBackup)
            )
            {
                string webApiDeploymentPath = _config["DeploymentSettings:WebApiDeploymentPath"];
                if (string.IsNullOrEmpty(webApiDeploymentPath))
                {
                    _logger.LogError("Backend deployment path not configured");
                    success = false;
                }
                else
                {
                    _logger.LogInformation(
                        $"Restoring backend from {_currentBackendBackup} to {webApiDeploymentPath}"
                    );

                    try
                    {
                        // Use robocopy for reliable copying
                        bool backendRestoreSuccess = await RunRobocopyAsync(
                            _currentBackendBackup,
                            webApiDeploymentPath,
                            "/MIR /R:3 /W:5 /MT:8"
                        );

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

        private async Task<bool> RunRobocopyAsync(
            string source,
            string destination,
            string arguments
        )
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
                        CreateNoWindow = true,
                    };

                    _logger.LogInformation(
                        $"Running robocopy: {startInfo.FileName} {startInfo.Arguments}"
                    );

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
                    if (process.ExitCode is >= 0 and <= 3)
                    {
                        _logger.LogInformation(
                            $"Robocopy completed with exit code {process.ExitCode}"
                        );
                        _logger.LogDebug($"Robocopy output: {output}");
                        return true;
                    }

                    _logger.LogError($"Robocopy failed with exit code {process.ExitCode}");
                    _logger.LogError($"Robocopy error: {error}");
                    _logger.LogError($"Robocopy output: {output}");
                    return false;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error executing robocopy");
                    return false;
                }
            });
        }

        /// <summary>
        /// Gets the next version number for backups
        /// </summary>
        private string GetNextVersionNumber(string backupDir, string prefix)
        {
            if (!Directory.Exists(backupDir))
            {
                return "v1.0.0";
            }

            var versionPattern = new Regex($@"{prefix}_v(\d+)\.(\d+)\.(\d+)");
            int major = 0,
                minor = 0,
                patch = 0;

            // Find existing versions
            var existingVersions = Directory
                .GetDirectories(backupDir, $"{prefix}_v*")
                .Select(d => Path.GetFileName(d))
                .Where(d => versionPattern.IsMatch(d))
                .ToList();

            foreach (var version in existingVersions)
            {
                var match = versionPattern.Match(version);
                if (match.Success)
                {
                    int currMajor = int.Parse(match.Groups[1].Value);
                    int currMinor = int.Parse(match.Groups[2].Value);
                    int currPatch = int.Parse(match.Groups[3].Value);

                    // Find highest version
                    if (
                        currMajor > major
                        || (currMajor == major && currMinor > minor)
                        || (currMajor == major && currMinor == minor && currPatch > patch)
                    )
                    {
                        major = currMajor;
                        minor = currMinor;
                        patch = currPatch;
                    }
                }
            }

            // Increment the patch version
            patch++;

            // Every 10 patches, increment minor version and reset patch
            if (patch > 9)
            {
                minor++;
                patch = 0;
            }

            // Every 10 minor versions, increment major version
            if (minor > 9)
            {
                major++;
                minor = 0;
            }

            return $"v{major}.{minor}.{patch}";
        }

        public string GetCurrentVersionNumber()
        {
            return _currentVersionNumber ?? "v0.0.0";
        }

        /// <inheritdoc />
        public async Task<bool> CleanupOldBackupsAsync(int maxBackupsToKeep)
        {
            _logger.LogInformation(
                $"Cleaning up old backups, keeping {maxBackupsToKeep} most recent"
            );

            string backupDir = _config["BackupSettings:BackupDirectory"];
            if (string.IsNullOrEmpty(backupDir) || !Directory.Exists(backupDir))
            {
                _logger.LogWarning("Backup directory not configured or does not exist");
                return false;
            }

            try
            {
                var frontendPattern = new Regex(@"frontend_backup_v(\d+)\.(\d+)\.(\d+)");
                var backendPattern = new Regex(@"backend_backup_v(\d+)\.(\d+)\.(\d+)");

                var frontendBackups = Directory
                    .GetDirectories(backupDir, "frontend_backup_v*")
                    .Select(d => new
                    {
                        Path = d,
                        Match = frontendPattern.Match(Path.GetFileName(d)),
                    })
                    .Where(x => x.Match.Success)
                    .Select(x => new
                    {
                        x.Path,
                        Major = int.Parse(x.Match.Groups[1].Value),
                        Minor = int.Parse(x.Match.Groups[2].Value),
                        Patch = int.Parse(x.Match.Groups[3].Value),
                    })
                    .OrderByDescending(x => x.Major)
                    .ThenByDescending(x => x.Minor)
                    .ThenByDescending(x => x.Patch)
                    .Skip(maxBackupsToKeep)
                    .Select(x => x.Path)
                    .ToList();

                var backendBackups = Directory
                    .GetDirectories(backupDir, "backend_backup_v*")
                    .Select(d => new
                    {
                        Path = d,
                        Match = backendPattern.Match(Path.GetFileName(d)),
                    })
                    .Where(x => x.Match.Success)
                    .Select(x => new
                    {
                        x.Path,
                        Major = int.Parse(x.Match.Groups[1].Value),
                        Minor = int.Parse(x.Match.Groups[2].Value),
                        Patch = int.Parse(x.Match.Groups[3].Value),
                    })
                    .OrderByDescending(x => x.Major)
                    .ThenByDescending(x => x.Minor)
                    .ThenByDescending(x => x.Patch)
                    .Skip(maxBackupsToKeep)
                    .Select(x => x.Path)
                    .ToList();

                foreach (var backup in frontendBackups)
                {
                    _logger.LogInformation($"Deleting old frontend backup: {backup}");
                    Directory.Delete(backup, true);
                }

                foreach (var backup in backendBackups)
                {
                    _logger.LogInformation($"Deleting old backend backup: {backup}");
                    Directory.Delete(backup, true);
                }

                _logger.LogInformation(
                    $"Cleanup completed. Deleted {frontendBackups.Count} frontend backups and {backendBackups.Count} backend backups"
                );
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old backups");
                return false;
            }
        }

        private async Task<bool> RunProcessAsync(
            string fileName,
            string arguments,
            string workingDirectory
        )
        {
            return await Task.Run(() =>
            {
                try
                {
                    var startInfo = new ProcessStartInfo
                    {
                        FileName = fileName,
                        Arguments = arguments,
                        WorkingDirectory = workingDirectory,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    };

                    _logger.LogInformation(
                        $"Running process: {fileName} {arguments} in {workingDirectory}"
                    );

                    using var process = Process.Start(startInfo);
                    var output = process.StandardOutput.ReadToEnd();
                    var error = process.StandardError.ReadToEnd();
                    process.WaitForExit();

                    if (process.ExitCode == 0)
                    {
                        _logger.LogInformation("Process completed successfully");
                        _logger.LogDebug($"Process output: {output}");
                        return true;
                    }
                    else
                    {
                        _logger.LogError($"Process failed with exit code {process.ExitCode}");
                        _logger.LogError($"Process error: {error}");
                        _logger.LogError($"Process output: {output}");
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error executing process {fileName}");
                    return false;
                }
            });
        }
    }
}
