/**
 * File: NotificationEmailConfigurationController.cs
 * Purpose: Exposes API endpoints to read and persist SMTP email configuration for notifications.
 * Dependencies: IConfiguration, IWebHostEnvironment, ASP.NET Core MVC/Auth
 * Last Modified: 2026-02-03
 *
 * Key Endpoints:
 * - GET api/v1/notifications/email-config: Returns SMTP settings used by the notifications UI.
 * - POST api/v1/notifications/email-config: Saves SMTP settings to appsettings for the current environment.
 */
using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using FMS.Application.Features.Notification.DTOs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/notifications/email-config")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Admin.Users)]
    public class NotificationEmailConfigurationController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly ILogger<NotificationEmailConfigurationController> _logger;

        public NotificationEmailConfigurationController(
            IConfiguration configuration,
            IWebHostEnvironment hostEnvironment,
            ILogger<NotificationEmailConfigurationController> logger)
        {
            _configuration = configuration;
            _hostEnvironment = hostEnvironment;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult GetEmailConfiguration()
        {
            try
            {
                var settings = LoadCurrentEmailSettings();

                var response = new
                {
                    server = settings.SmtpServer,
                    port = settings.SmtpPort > 0 ? settings.SmtpPort : 25,
                    security = settings.UseSsl ? "tls" : "none",
                    username = settings.Username ?? string.Empty,
                    password = string.Empty,
                    fromAddress = settings.FromAddress,
                    fromName = string.IsNullOrWhiteSpace(settings.FromDisplayName)
                        ? "FMS Notification System"
                        : settings.FromDisplayName,
                    replyTo = _configuration["EmailSettings:ReplyTo"] ?? string.Empty,
                    timeout = settings.TimeoutSeconds > 0 ? settings.TimeoutSeconds : 30,
                    enableSsl = settings.UseSsl,
                    requiresAuthentication = !string.IsNullOrWhiteSpace(settings.Username),
                    maxRetries = settings.MaxRetryAttempts > 0 ? settings.MaxRetryAttempts : 3,
                    retryDelay = settings.RetryDelaySeconds > 0 ? settings.RetryDelaySeconds : 5
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading email configuration");
                return StatusCode(500, new { success = false, message = "Failed to load email configuration." });
            }
        }

        [HttpPost]
        public IActionResult SaveEmailConfiguration([FromBody] JsonElement request)
        {
            try
            {
                if (request.ValueKind != JsonValueKind.Object)
                {
                    return BadRequest(new { success = false, message = "Invalid email configuration payload." });
                }

                var existingSettings = LoadCurrentEmailSettings();
                var existingReplyTo = _configuration["EmailSettings:ReplyTo"] ?? string.Empty;

                var security = GetStringProperty(request, "security", existingSettings.UseSsl ? "tls" : "none");
                var useSsl = GetBooleanProperty(request, "enableSsl", IsSecureSecurityMode(security));
                var requiresAuthentication = GetBooleanProperty(
                    request,
                    "requiresAuthentication",
                    !string.IsNullOrWhiteSpace(existingSettings.Username));

                var smtpServer = GetStringProperty(request, "server", existingSettings.SmtpServer);
                var smtpPort = GetIntegerProperty(
                    request,
                    "port",
                    existingSettings.SmtpPort > 0 ? existingSettings.SmtpPort : 25);
                var username = requiresAuthentication
                    ? GetStringProperty(request, "username", existingSettings.Username ?? string.Empty)
                    : string.Empty;
                var postedPassword = requiresAuthentication
                    ? GetStringProperty(request, "password", string.Empty)
                    : string.Empty;
                var password = requiresAuthentication
                    ? (string.IsNullOrWhiteSpace(postedPassword)
                        ? existingSettings.Password ?? string.Empty
                        : postedPassword)
                    : string.Empty;
                var fromAddress = GetStringProperty(request, "fromAddress", existingSettings.FromAddress);
                var fromName = GetStringProperty(
                    request,
                    "fromName",
                    string.IsNullOrWhiteSpace(existingSettings.FromDisplayName)
                        ? "FMS Notification System"
                        : existingSettings.FromDisplayName);
                var replyTo = GetStringProperty(request, "replyTo", existingReplyTo);
                var timeoutSeconds = GetIntegerProperty(
                    request,
                    "timeout",
                    existingSettings.TimeoutSeconds > 0 ? existingSettings.TimeoutSeconds : 30);
                var maxRetryAttempts = GetIntegerProperty(
                    request,
                    "maxRetries",
                    existingSettings.MaxRetryAttempts > 0 ? existingSettings.MaxRetryAttempts : 3);
                var retryDelaySeconds = GetIntegerProperty(
                    request,
                    "retryDelay",
                    existingSettings.RetryDelaySeconds > 0 ? existingSettings.RetryDelaySeconds : 5);

                if (string.IsNullOrWhiteSpace(smtpServer))
                {
                    return BadRequest(new { success = false, message = "SMTP server is required." });
                }

                if (string.IsNullOrWhiteSpace(fromAddress))
                {
                    return BadRequest(new { success = false, message = "From address is required." });
                }

                if (requiresAuthentication && string.IsNullOrWhiteSpace(username))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Username is required when authentication is enabled."
                    });
                }

                var settingsPath = ResolveWritableAppSettingsPath();
                var rootNode = LoadSettingsRoot(settingsPath);

                rootNode["EmailSettings"] = new JsonObject
                {
                    ["SmtpServer"] = smtpServer,
                    ["SmtpPort"] = smtpPort,
                    ["UseSsl"] = useSsl,
                    ["Username"] = username,
                    ["Password"] = password,
                    ["FromAddress"] = fromAddress,
                    ["FromDisplayName"] = fromName,
                    ["ReplyTo"] = replyTo,
                    ["TimeoutSeconds"] = timeoutSeconds,
                    ["MaxRetryAttempts"] = maxRetryAttempts,
                    ["RetryDelaySeconds"] = retryDelaySeconds
                };

                var serializerOptions = new JsonSerializerOptions { WriteIndented = true };
                System.IO.File.WriteAllText(settingsPath, rootNode.ToJsonString(serializerOptions));

                _logger.LogInformation("Email configuration updated in {SettingsPath}", settingsPath);
                return Ok(new { success = true, message = "Email configuration saved successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving email configuration");
                return StatusCode(500, new { success = false, message = "Failed to save email configuration." });
            }
        }

        private static JsonObject LoadSettingsRoot(string settingsPath)
        {
            if (!System.IO.File.Exists(settingsPath))
            {
                return new JsonObject();
            }

            var rawJson = System.IO.File.ReadAllText(settingsPath);
            return JsonNode.Parse(rawJson) as JsonObject ?? new JsonObject();
        }

        private EmailSettings LoadCurrentEmailSettings()
        {
            var settings = new EmailSettings();
            _configuration.GetSection("EmailSettings").Bind(settings);

            if (string.IsNullOrWhiteSpace(settings.SmtpServer))
            {
                settings.SmtpServer = _configuration["EmailSettings:SmtpServer"] ?? string.Empty;
            }

            if (settings.SmtpPort <= 0 &&
                int.TryParse(_configuration["EmailSettings:SmtpPort"], out var smtpPort))
            {
                settings.SmtpPort = smtpPort;
            }

            if (string.IsNullOrWhiteSpace(settings.FromAddress))
            {
                settings.FromAddress =
                    _configuration["EmailSettings:FromAddress"] ??
                    _configuration["EmailSettings:From"] ??
                    string.Empty;
            }

            if (string.IsNullOrWhiteSpace(settings.FromDisplayName))
            {
                settings.FromDisplayName = _configuration["EmailSettings:FromDisplayName"];
            }

            if (settings.TimeoutSeconds <= 0 &&
                int.TryParse(_configuration["EmailSettings:TimeoutSeconds"], out var timeoutSeconds))
            {
                settings.TimeoutSeconds = timeoutSeconds;
            }

            if (settings.MaxRetryAttempts <= 0 &&
                int.TryParse(_configuration["EmailSettings:MaxRetryAttempts"], out var maxRetryAttempts))
            {
                settings.MaxRetryAttempts = maxRetryAttempts;
            }

            if (settings.RetryDelaySeconds <= 0 &&
                int.TryParse(_configuration["EmailSettings:RetryDelaySeconds"], out var retryDelaySeconds))
            {
                settings.RetryDelaySeconds = retryDelaySeconds;
            }

            if (settings.Username == null)
            {
                settings.Username = _configuration["EmailSettings:Username"];
            }

            if (settings.Password == null)
            {
                settings.Password = _configuration["EmailSettings:Password"];
            }

            return settings;
        }

        private string ResolveWritableAppSettingsPath()
        {
            var environmentPath = Path.Combine(
                _hostEnvironment.ContentRootPath,
                $"appsettings.{_hostEnvironment.EnvironmentName}.json");

            if (System.IO.File.Exists(environmentPath))
            {
                return environmentPath;
            }

            var developmentPath = Path.Combine(_hostEnvironment.ContentRootPath, "appsettings.Development.json");
            if (System.IO.File.Exists(developmentPath))
            {
                return developmentPath;
            }

            return Path.Combine(_hostEnvironment.ContentRootPath, "appsettings.json");
        }

        private static string GetStringProperty(JsonElement root, string propertyName, string defaultValue)
        {
            if (!root.TryGetProperty(propertyName, out var value))
            {
                return defaultValue;
            }

            return value.ValueKind switch
            {
                JsonValueKind.String => value.GetString() ?? defaultValue,
                JsonValueKind.Number => value.ToString(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                _ => defaultValue
            };
        }

        private static int GetIntegerProperty(JsonElement root, string propertyName, int defaultValue)
        {
            if (!root.TryGetProperty(propertyName, out var value))
            {
                return defaultValue;
            }

            if (value.ValueKind == JsonValueKind.Number &&
                value.TryGetInt32(out var numberValue))
            {
                return numberValue;
            }

            if (value.ValueKind == JsonValueKind.String &&
                int.TryParse(value.GetString(), out var parsedValue))
            {
                return parsedValue;
            }

            return defaultValue;
        }

        private static bool GetBooleanProperty(JsonElement root, string propertyName, bool defaultValue)
        {
            if (!root.TryGetProperty(propertyName, out var value))
            {
                return defaultValue;
            }

            if (value.ValueKind == JsonValueKind.True)
            {
                return true;
            }

            if (value.ValueKind == JsonValueKind.False)
            {
                return false;
            }

            if (value.ValueKind == JsonValueKind.Number &&
                value.TryGetInt32(out var numberValue))
            {
                return numberValue != 0;
            }

            if (value.ValueKind == JsonValueKind.String &&
                bool.TryParse(value.GetString(), out var parsedValue))
            {
                return parsedValue;
            }

            return defaultValue;
        }

        private static bool IsSecureSecurityMode(string securityMode)
        {
            if (string.IsNullOrWhiteSpace(securityMode))
            {
                return false;
            }

            return string.Equals(securityMode, "ssl", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(securityMode, "tls", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(securityMode, "starttls", StringComparison.OrdinalIgnoreCase);
        }
    }
}
