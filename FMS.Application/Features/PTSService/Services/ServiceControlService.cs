/**
 * File: ServiceControlService.cs
 * Purpose: Reads and controls the Windows PTS service, including runtime status, logs, and uptime details.
 * Dependencies: ServiceController, Process, IConfiguration, ServiceStatusDto
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - GetServiceStatusAsync(): Returns current Windows service status and process health.
 * - ExecuteServiceActionAsync(): Starts, stops, restarts, or inspects the service.
 */
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.ServiceProcess;
using System.Threading.Tasks;
using FMS.Application.Features.PTSService.Commands;
using FMS.Application.Features.PTSService.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTSService.Services {
    public class ServiceControlService : IServiceControlService {
        private readonly ILogger<ServiceControlService> _logger;
        private readonly IConfiguration _configuration;

        public ServiceControlService (ILogger<ServiceControlService> logger, IConfiguration configuration) {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<ServiceStatusDto> ExecuteServiceActionAsync (ServiceAction action, string serviceName) {
            switch (action) {
                case ServiceAction.Start:
                    return await StartServiceAsync (serviceName);
                case ServiceAction.Stop:
                    return await StopServiceAsync (serviceName);
                case ServiceAction.Restart:
                    return await RestartServiceAsync (serviceName);
                case ServiceAction.GetStatus:
                default:
                    return await GetServiceStatusAsync (serviceName);
            }
        }

        public async Task<ServiceStatusDto> GetServiceStatusAsync (string serviceName) {
            try {
                var isInstalled = await IsServiceInstalledAsync (serviceName);
                if (!isInstalled) {
                    return new ServiceStatusDto {
                        ServiceName = serviceName,
                            Status = "Not Installed",
                            LastStatusCheck = DateTime.Now,
                            CanStart = false,
                            CanStop = false,
                            CanRestart = false
                    };
                }

                using var service = new ServiceController (serviceName);
                var status = service.Status.ToString ();
                var canStart = service.Status == ServiceControllerStatus.Stopped;
                var canStop = service.Status == ServiceControllerStatus.Running;

                // Get additional process information
                var processInfo = GetServiceProcessInfo (serviceName);
                var logPath = GetLogFilePath ();
                var recentLogs = await GetRecentLogsAsync (logPath, 20);
                var uptime = processInfo?.StartTime.HasValue == true
                    ? DateTime.Now - processInfo.Value.StartTime.Value
                    : (TimeSpan?) null;

                return new ServiceStatusDto {
                    ServiceName = serviceName,
                        DisplayName = service.DisplayName,
                        Status = status,
                        LastStatusCheck = DateTime.Now,
                        CanStart = canStart,
                        CanStop = canStop,
                        CanRestart = canStop,
                        StartType = service.StartType.ToString (),
                        LastStartTime = processInfo?.StartTime,
                        ProcessId = processInfo?.ProcessId,
                        MemoryUsageMB = processInfo?.MemoryUsageMB,
                        LogFilePath = logPath,
                        RecentLogEntries = recentLogs,
                        AdditionalInfo = new Dictionary<string, object> {
                            ["MachineName"] = service.MachineName,
                            ["ServiceType"] = service.ServiceType.ToString (),
                            ["UptimeHours"] = uptime.HasValue ? Math.Round (uptime.Value.TotalHours, 2) : 0d,
                            ["UptimeMinutes"] = uptime.HasValue ? Math.Round (uptime.Value.TotalMinutes, 2) : 0d
                            }
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting service status for {ServiceName}", serviceName);
                throw;
            }
        }

        public async Task<bool> IsServiceInstalledAsync (string serviceName) {
            try {
                var services = ServiceController.GetServices ();
                return services.Any (s => s.ServiceName.Equals (serviceName, StringComparison.OrdinalIgnoreCase));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error checking if service is installed: {ServiceName}", serviceName);
                return false;
            }
        }

        public async Task<List<string>> GetRecentLogsAsync (string logPath, int lineCount = 50) {
            try {
                if (string.IsNullOrEmpty (logPath) || !File.Exists (logPath)) {
                    return new List<string> { "Log file not found or path not specified" };
                }

                var lines = await File.ReadAllLinesAsync (logPath);
                return lines.TakeLast (lineCount).ToList ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error reading log file: {LogPath}", logPath);
                return new List<string> { $"Error reading log file: {ex.Message}" };
            }
        }

        private async Task<ServiceStatusDto> StartServiceAsync (string serviceName) {
            try {
                using var service = new ServiceController (serviceName);
                if (service.Status != ServiceControllerStatus.Running) {
                    _logger.LogInformation ("Starting service: {ServiceName}", serviceName);
                    service.Start ();

                    // Wait for service to start (with timeout)
                    var timeout = TimeSpan.FromSeconds (30);
                    service.WaitForStatus (ServiceControllerStatus.Running, timeout);
                }

                return await GetServiceStatusAsync (serviceName);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error starting service: {ServiceName}", serviceName);
                throw;
            }
        }

        private async Task<ServiceStatusDto> StopServiceAsync (string serviceName) {
            try {
                using var service = new ServiceController (serviceName);
                if (service.Status != ServiceControllerStatus.Stopped) {
                    _logger.LogInformation ("Stopping service: {ServiceName}", serviceName);
                    service.Stop ();

                    // Wait for service to stop (with timeout)
                    var timeout = TimeSpan.FromSeconds (30);
                    service.WaitForStatus (ServiceControllerStatus.Stopped, timeout);
                }

                return await GetServiceStatusAsync (serviceName);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error stopping service: {ServiceName}", serviceName);
                throw;
            }
        }

        private async Task<ServiceStatusDto> RestartServiceAsync (string serviceName) {
            try {
                _logger.LogInformation ("Restarting service: {ServiceName}", serviceName);
                await StopServiceAsync (serviceName);
                await Task.Delay (2000); // Brief pause between stop and start
                return await StartServiceAsync (serviceName);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error restarting service: {ServiceName}", serviceName);
                throw;
            }
        }

        private (string ProcessId, long MemoryUsageMB, DateTime? StartTime) ? GetServiceProcessInfo (string serviceName) {
            try {
                using var service = new ServiceController (serviceName);
                if (service.Status == ServiceControllerStatus.Running) {
                    // Get the process associated with the service
                    var processes = Process.GetProcessesByName (serviceName.Replace (".", ""));
                    var process = processes.FirstOrDefault ();

                    if (process != null) {
                        return (process.Id.ToString (), process.WorkingSet64 / (1024 * 1024), process.StartTime);
                    }
                }
            } catch (Exception ex) {
                _logger.LogWarning (ex, "Could not get process info for service: {ServiceName}", serviceName);
            }

            return null;
        }

        private string GetLogFilePath () {
            // Try to get log path from configuration
            var logPath = _configuration["PTSService:Logging:FilePath"];
            if (!string.IsNullOrEmpty (logPath)) {
                return logPath;
            }

            // Fallback to default log location
            var logDirectory = "C:\\Logs\\FMS.PTS";
            if (Directory.Exists (logDirectory)) {
                var logFiles = Directory.GetFiles (logDirectory, "pts-service-*.log")
                    .OrderByDescending (f => new FileInfo (f).LastWriteTime)
                    .FirstOrDefault ();
                return logFiles;
            }

            return null;
        }
    }
}