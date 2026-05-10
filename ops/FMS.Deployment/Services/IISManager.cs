using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Principal;
using System.Threading.Tasks;
using TenacyFMS.Deployment.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Web.Administration;

namespace TenacyFMS.Deployment.Services
{
    /// <summary>
    /// Implementation of the IIS Manager interface
    /// </summary>
    public class IISManager : IIISManager
    {
        private readonly ILogger<IISManager> _logger;
        private readonly IConfiguration _config;

        public IISManager(ILogger<IISManager> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;
        }

        /// <inheritdoc />
        public async Task<bool> StopRequiredServicesAsync(bool frontendOnly, bool backendOnly)
        {
            _logger.LogInformation("Performing complete IIS shutdown");

            if (!IsAdministrator())
            {
                _logger.LogWarning("Not running as Administrator. IIS operations will likely fail.");
            }

            // Use Task.Run to move the blocking IIS operations to a background thread
            return await Task.Run(() =>
            {
                try
                {
                    using (ServerManager serverManager = new ServerManager())
                    {
                        // 1. Stop all running websites first
                        _logger.LogInformation("Stopping ALL running websites");
                        foreach (var site in serverManager.Sites)
                        {
                            if (site.State == ObjectState.Started)
                            {
                                _logger.LogInformation($"Stopping site: {site.Name}");
                                try
                                {
                                    site.Stop();
                                    _logger.LogInformation($"Successfully stopped site: {site.Name}");
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogWarning(ex, $"Failed to stop site {site.Name}");
                                    // Try using appcmd as fallback
                                    TryStopSiteWithAppCmd(site.Name);
                                }
                            }
                        }

                        // 2. Stop all application pools
                        _logger.LogInformation("Stopping ALL application pools");
                        foreach (var appPool in serverManager.ApplicationPools)
                        {
                            if (appPool.State == ObjectState.Started)
                            {
                                _logger.LogInformation($"Stopping application pool: {appPool.Name}");
                                try
                                {
                                    appPool.Stop();
                                    _logger.LogInformation($"Successfully stopped application pool: {appPool.Name}");
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogWarning(ex, $"Failed to stop application pool {appPool.Name}");
                                    // Try using appcmd as fallback
                                    TryStopAppPoolWithAppCmd(appPool.Name);
                                }
                            }
                        }

                        // 3. Verify all sites are stopped
                        bool allSitesStopped = true;
                        foreach (var site in serverManager.Sites)
                        {
                            if (site.State == ObjectState.Started)
                            {
                                _logger.LogWarning($"Site still running: {site.Name}");
                                allSitesStopped = false;
                            }
                        }

                        // 4. Verify all app pools are stopped
                        bool allPoolsStopped = true;
                        foreach (var appPool in serverManager.ApplicationPools)
                        {
                            if (appPool.State == ObjectState.Started)
                            {
                                _logger.LogWarning($"Application pool still running: {appPool.Name}");
                                allPoolsStopped = false;
                            }
                        }

                        // 5. Last resort - kill w3wp.exe processes
                        if (!allSitesStopped || !allPoolsStopped)
                        {
                            _logger.LogWarning("Attempting to terminate IIS worker processes (w3wp.exe)");
                            try
                            {
                                var w3wpProcesses = Process.GetProcessesByName("w3wp");
                                if (w3wpProcesses.Length > 0)
                                {
                                    foreach (var process in w3wpProcesses)
                                    {
                                        _logger.LogWarning($"Terminating w3wp process with ID: {process.Id}");
                                        process.Kill();
                                        process.WaitForExit(5000);
                                    }
                                    _logger.LogInformation("All w3wp processes terminated");
                                }
                                else
                                {
                                    _logger.LogInformation("No w3wp processes found running");
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error terminating w3wp processes");
                            }
                        }

                        // 6. Check for file locks on deployment directories
                        CheckDeploymentDirectoryLocks();

                        if (allSitesStopped && allPoolsStopped)
                        {
                            _logger.LogInformation("All IIS components successfully stopped");
                            return true;
                        }
                        else
                        {
                            _logger.LogWarning("Some IIS components could not be stopped. Deployment may experience file locking issues.");
                            return false;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error stopping IIS services");
                    return false;
                }
            });
        }

        /// <inheritdoc />
        public async Task<bool> StartRequiredServicesAsync(bool frontendOnly, bool backendOnly)
        {
            _logger.LogInformation("Starting IIS services");

            string frontendSiteName = _config["DeploymentSettings:IisSiteName"];
            string backendSiteName = _config["DeploymentSettings:BackendSiteName"] ?? frontendSiteName;
            string appPoolName = _config["DeploymentSettings:IisAppPool"];

            if (string.IsNullOrEmpty(frontendSiteName) || string.IsNullOrEmpty(appPoolName))
            {
                _logger.LogError("Missing required IIS configuration settings");
                return false;
            }

            // Use Task.Run to move the blocking IIS operations to a background thread
            return await Task.Run(() =>
            {
                bool allSuccess = true;

                try
                {
                    using (ServerManager serverManager = new ServerManager())
                    {
                        // 1. Start app pool first
                        try
                        {
                            var appPool = serverManager.ApplicationPools[appPoolName];
                            if (appPool != null)
                            {
                                _logger.LogInformation($"Starting application pool: {appPoolName}");
                                if (appPool.State != ObjectState.Started)
                                {
                                    appPool.Start();
                                    _logger.LogInformation($"Application pool {appPoolName} started");
                                }
                                else
                                {
                                    _logger.LogInformation($"Application pool {appPoolName} already started");
                                }
                            }
                            else
                            {
                                _logger.LogError($"Application pool {appPoolName} not found");
                                allSuccess = false;
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error starting application pool {appPoolName}");
                            allSuccess = false;
                            // Try using appcmd as fallback
                            TryStartAppPoolWithAppCmd(appPoolName);
                        }

                        // 2. Start websites
                        if (!backendOnly)
                        {
                            try
                            {
                                var frontendSite = serverManager.Sites[frontendSiteName];
                                if (frontendSite != null)
                                {
                                    _logger.LogInformation($"Starting frontend website: {frontendSiteName}");
                                    if (frontendSite.State != ObjectState.Started)
                                    {
                                        frontendSite.Start();
                                        _logger.LogInformation($"Frontend website {frontendSiteName} started");
                                    }
                                    else
                                    {
                                        _logger.LogInformation($"Frontend website {frontendSiteName} already started");
                                    }
                                }
                                else
                                {
                                    _logger.LogError($"Frontend website {frontendSiteName} not found");
                                    allSuccess = false;
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Error starting frontend website {frontendSiteName}");
                                allSuccess = false;
                                // Try using appcmd as fallback
                                TryStartSiteWithAppCmd(frontendSiteName);
                            }
                        }

                        if (!frontendOnly && backendSiteName != frontendSiteName)
                        {
                            try
                            {
                                var backendSite = serverManager.Sites[backendSiteName];
                                if (backendSite != null)
                                {
                                    _logger.LogInformation($"Starting backend website: {backendSiteName}");
                                    if (backendSite.State != ObjectState.Started)
                                    {
                                        backendSite.Start();
                                        _logger.LogInformation($"Backend website {backendSiteName} started");
                                    }
                                    else
                                    {
                                        _logger.LogInformation($"Backend website {backendSiteName} already started");
                                    }
                                }
                                else
                                {
                                    _logger.LogError($"Backend website {backendSiteName} not found");
                                    allSuccess = false;
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Error starting backend website {backendSiteName}");
                                allSuccess = false;
                                // Try using appcmd as fallback
                                TryStartSiteWithAppCmd(backendSiteName);
                            }
                        }
                    }

                    if (!allSuccess)
                    {
                        _logger.LogWarning("Some IIS services could not be started. Application may not be fully functional.");
                    }

                    return allSuccess;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error starting IIS services");
                    return false;
                }
            });
        }

        /// <inheritdoc />
        public async Task ReleaseLogDirectoryLocksAsync()
        {
            _logger.LogInformation("Attempting to release locks on log directories");

            await Task.Run(() =>
            {
                string webApiDeploymentPath = _config["DeploymentSettings:WebApiDeploymentPath"];
                if (string.IsNullOrEmpty(webApiDeploymentPath))
                {
                    _logger.LogWarning("WebAPI deployment path not configured, skipping log directory lock release");
                    return;
                }

                string logDir = Path.Combine(webApiDeploymentPath, "logs");
                if (!Directory.Exists(logDir))
                {
                    _logger.LogInformation($"Log directory does not exist: {logDir}");
                    return;
                }

                _logger.LogInformation($"Checking log directory: {logDir}");

                try
                {
                    // Try to create and delete a test file
                    string testFile = Path.Combine(logDir, "_test_delete_me.tmp");
                    File.WriteAllText(testFile, "Test");
                    File.Delete(testFile);
                    _logger.LogInformation("Log directory appears accessible");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Log directory appears locked");

                    try
                    {
                        // Try to handle each log file specifically
                        foreach (var file in Directory.GetFiles(logDir, "*", SearchOption.AllDirectories))
                        {
                            try
                            {
                                // Force GC to release any handles
                                GC.Collect();
                                GC.WaitForPendingFinalizers();

                                // Try to rename the file temporarily to release locks
                                string tempName = $"{file}.old";
                                if (File.Exists(tempName))
                                {
                                    File.Delete(tempName);
                                }
                                File.Move(file, tempName);
                                File.Move(tempName, file);

                                _logger.LogInformation($"Successfully released locks on: {Path.GetFileName(file)}");
                            }
                            catch (Exception fileEx)
                            {
                                _logger.LogWarning(fileEx, $"Could not release locks on: {Path.GetFileName(file)}");
                            }
                        }
                    }
                    catch (Exception dirEx)
                    {
                        _logger.LogError(dirEx, "Error processing log files");
                    }

                    // Last resort - try to use robocopy to clear the directory
                    try
                    {
                        string tempDir = $"{logDir}.temp";
                        if (!Directory.Exists(tempDir))
                        {
                            Directory.CreateDirectory(tempDir);
                        }

                        // Use Process to run robocopy
                        var startInfo = new ProcessStartInfo
                        {
                            FileName = "robocopy.exe",
                            Arguments = $"\"{tempDir}\" \"{logDir}\" /MIR /R:1 /W:1",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        };

                        using var process = Process.Start(startInfo);
                        var output = process.StandardOutput.ReadToEnd();
                        var error = process.StandardError.ReadToEnd();
                        process.WaitForExit();

                        _logger.LogInformation($"Robocopy output: {output}");
                        if (!string.IsNullOrEmpty(error))
                        {
                            _logger.LogWarning($"Robocopy error: {error}");
                        }

                        // Clean up temp dir
                        Directory.Delete(tempDir, true);
                        _logger.LogInformation("Used robocopy to clear locked log directory");
                    }
                    catch (Exception robocopyEx)
                    {
                        _logger.LogError(robocopyEx, "Failed to use robocopy to clear log directory");
                    }
                }
            });
        }

        /// <inheritdoc />
        public async Task<bool> SiteExistsAsync(string siteName)
        {
            return await Task.Run(() =>
            {
                try
                {
                    using (ServerManager serverManager = new ServerManager())
                    {
                        return serverManager.Sites.Any(s => s.Name.Equals(siteName, StringComparison.OrdinalIgnoreCase));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error checking if site {siteName} exists");
                    return false;
                }
            });
        }

        /// <inheritdoc />
        public async Task<bool> AppPoolExistsAsync(string appPoolName)
        {
            return await Task.Run(() =>
            {
                try
                {
                    using (ServerManager serverManager = new ServerManager())
                    {
                        return serverManager.ApplicationPools.Any(a => a.Name.Equals(appPoolName, StringComparison.OrdinalIgnoreCase));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error checking if application pool {appPoolName} exists");
                    return false;
                }
            });
        }

        private void CheckDeploymentDirectoryLocks()
        {
            string webApiDeploymentPath = _config["DeploymentSettings:WebApiDeploymentPath"];
            string reactDeploymentPath = _config["DeploymentSettings:ReactDeploymentPath"];

            var pathsToCheck = new[]
            {
                webApiDeploymentPath,
                reactDeploymentPath
            }.Where(p => !string.IsNullOrEmpty(p) && Directory.Exists(p)).ToList();

            foreach (var path in pathsToCheck)
            {
                _logger.LogInformation($"Checking for file locks on deployment directory: {path}");
                try
                {
                    // Try to create a temporary file to check if directory is locked
                    string testFilePath = Path.Combine(path, "_locktest.tmp");
                    File.WriteAllText(testFilePath, "Test file to check for locks");
                    File.Delete(testFilePath);
                    _logger.LogInformation($"Directory {path} is accessible and not locked");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Warning: Directory {path} appears to be locked");

                    // Try to identify what's locking the directory if handle.exe is available
                    try
                    {
                        if (File.Exists("handle.exe"))
                        {
                            _logger.LogInformation("Checking locks with handle.exe...");
                            var startInfo = new ProcessStartInfo
                            {
                                FileName = "handle.exe",
                                Arguments = $"\"{path}\"",
                                RedirectStandardOutput = true,
                                UseShellExecute = false,
                                CreateNoWindow = true
                            };

                            using var process = Process.Start(startInfo);
                            var output = process.StandardOutput.ReadToEnd();
                            process.WaitForExit();

                            _logger.LogInformation($"Handle.exe output: {output}");
                        }
                        else
                        {
                            _logger.LogInformation("Handle.exe not found. Cannot check locks in detail.");
                        }
                    }
                    catch (Exception handleEx)
                    {
                        _logger.LogError(handleEx, "Error checking file locks");
                    }
                }
            }
        }

        private void TryStopSiteWithAppCmd(string siteName)
        {
            _logger.LogInformation($"Attempting to stop site {siteName} using appcmd.exe");
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "inetsrv", "appcmd.exe"),
                    Arguments = $"stop site \"{siteName}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();
                process.WaitForExit();

                if (process.ExitCode == 0)
                {
                    _logger.LogInformation($"Successfully stopped site {siteName} using appcmd.exe");
                }
                else
                {
                    _logger.LogWarning($"Failed to stop site {siteName} using appcmd.exe. Error: {error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error using appcmd.exe to stop site {siteName}");
            }
        }

        private void TryStopAppPoolWithAppCmd(string appPoolName)
        {
            _logger.LogInformation($"Attempting to stop application pool {appPoolName} using appcmd.exe");
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "inetsrv", "appcmd.exe"),
                    Arguments = $"stop apppool \"{appPoolName}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();
                process.WaitForExit();

                if (process.ExitCode == 0)
                {
                    _logger.LogInformation($"Successfully stopped application pool {appPoolName} using appcmd.exe");
                }
                else
                {
                    _logger.LogWarning($"Failed to stop application pool {appPoolName} using appcmd.exe. Error: {error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error using appcmd.exe to stop application pool {appPoolName}");
            }
        }

        private void TryStartSiteWithAppCmd(string siteName)
        {
            _logger.LogInformation($"Attempting to start site {siteName} using appcmd.exe");
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "inetsrv", "appcmd.exe"),
                    Arguments = $"start site \"{siteName}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();
                process.WaitForExit();

                if (process.ExitCode == 0)
                {
                    _logger.LogInformation($"Successfully started site {siteName} using appcmd.exe");
                }
                else
                {
                    _logger.LogWarning($"Failed to start site {siteName} using appcmd.exe. Error: {error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error using appcmd.exe to start site {siteName}");
            }
        }

        private void TryStartAppPoolWithAppCmd(string appPoolName)
        {
            _logger.LogInformation($"Attempting to start application pool {appPoolName} using appcmd.exe");
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "inetsrv", "appcmd.exe"),
                    Arguments = $"start apppool \"{appPoolName}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();
                process.WaitForExit();

                if (process.ExitCode == 0)
                {
                    _logger.LogInformation($"Successfully started application pool {appPoolName} using appcmd.exe");
                }
                else
                {
                    _logger.LogWarning($"Failed to start application pool {appPoolName} using appcmd.exe. Error: {error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error using appcmd.exe to start application pool {appPoolName}");
            }
        }

        private bool IsAdministrator()
        {
            try
            {
                WindowsIdentity identity = WindowsIdentity.GetCurrent();
                WindowsPrincipal principal = new WindowsPrincipal(identity);
                return principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking administrator privileges");
                return false;
            }
        }
    }
}