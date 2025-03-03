using FMS.PTS.WindowsService.Core.Configuration;
using FMS.PTS.WindowsService.Core.Protocal.Authentication;
using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.PTS.WindowsService
{
    public class PTSServiceSettings
    {
        public const string ConfigurationSection = "PTSService";

        public WebSocketSettings WebSocket { get; set; } = new();
        public DeviceSettings Device { get; set; } = new();
        public LoggingSettings Logging { get; set; } = new();
        public SecuritySettings Security { get; set; } = new();

        public ReconnectionSettings ReconnectionSettings { get; set; } = new();


        public class WebSocketSettings
        {
            [Range(1, 65535)]
            public int ListenPort { get; set; } = 54098;

            [Range(1, 1000)]
            public int MaxConcurrentConnections { get; set; } = 100;

            [Range(1024, 1048576)]
            public int BufferSize { get; set; } = 65536;
            public TimeSpan ConnectionTimeout { get; set; } = TimeSpan.FromMinutes(5);

            [Required]
            public string Host { get; set; } = "*";
            public string BasePath { get; set; } = "/ptsWebSocket";
        }

        public class DeviceSettings
        {
            public string[] AllowedDevices { get; set; } = Array.Empty<string>();
            public bool AutoReconnect { get; set; } = true;
            public int ReconnectIntervalSeconds { get; set; } = 30;
            public int HealthCheckIntervalSeconds { get; set; } = 60;
        }

        public class LoggingSettings
        {
            public string FilePath { get; set; } = "C:\\Logs\\FMS.PTS\\pts-service.log";
            public int MaxFileSizeInMB { get; set; } = 10;
            public int RetainedFileCount { get; set; } = 31;
            public string MinimumLevel { get; set; } = "Information";
        }

        public class SecuritySettings
        {
            public bool RequireAuthentication { get; set; } = true;
            public string ApiKey { get; set; } = string.Empty;
            public string[] AllowedIPs { get; set; } = Array.Empty<string>();
            public AuthenticationMode AuthMode { get; set; } = AuthenticationMode.Basic;
            public DefaultUserSettings DefaultUser { get; set; } = new();

        }

        public class QueueSettings
        {
            public int MaxQueueSize { get; set; } = 1000;
            public int MaxRetryAttempts { get; set; } = 3;
            public TimeSpan RetryDelay { get; set; } = TimeSpan.FromSeconds(5);
        }

        public class DefaultUserSettings
        {
            public string Username { get; set; } = "admin";
            public string Password { get; set; } = "admin";
        }

    }
}