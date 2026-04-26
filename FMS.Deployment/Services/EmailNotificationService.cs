using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using TenacyFMS.Deployment.Interfaces;
using TenacyFMS.Deployment.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TenacyFMS.Deployment.Services
{
    /// <summary>
    /// Implementation of the Notification Service interface using email
    /// </summary>
    public class EmailNotificationService : INotificationService
    {
        private readonly ILogger<EmailNotificationService> _logger;
        private readonly IConfiguration _config;

        public EmailNotificationService(ILogger<EmailNotificationService> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;
        }

        /// <inheritdoc />
        public async Task SendDeploymentNotificationAsync(DeploymentSummary summary, bool success)
        {
           string subject = success
        ? $"Deployment {summary.VersionNumber} Completed Successfully - {summary.DeploymentType} - {summary.Environment}"
        : $"Deployment {summary.VersionNumber} Failed - {summary.DeploymentType} - {summary.Environment}";

    string body = $@"
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; }}
        .success {{ color: green; font-weight: bold; }}
        .failure {{ color: red; font-weight: bold; }}
        .summary {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
    <h2>Deployment {summary.VersionNumber} {(success ? "<span class='success'>Completed Successfully</span>" : "<span class='failure'>Failed</span>")}</h2>

    <div class='summary'>
        <h3>Deployment Summary</h3>
        <table>
            <tr><th>Property</th><th>Value</th></tr>
            <tr><td>Version</td><td><strong>{summary.VersionNumber}</strong></td></tr>
            <tr><td>Deployment Type</td><td>{summary.DeploymentType}</td></tr>
            <tr><td>Environment</td><td>{summary.Environment}</td></tr>
            <tr><td>Server</td><td>{summary.ServerName}</td></tr>
            <tr><td>Start Time</td><td>{summary.StartTime:yyyy-MM-dd HH:mm:ss}</td></tr>
            <tr><td>End Time</td><td>{summary.EndTime:yyyy-MM-dd HH:mm:ss}</td></tr>
            <tr><td>Duration</td><td>{summary.Duration.TotalMinutes:F2} minutes</td></tr>
            <tr><td>Status</td><td>{(summary.Success ? "<span class='success'>SUCCESS</span>" : "<span class='failure'>FAILED</span>")}</td></tr>
            <tr><td>Health Check</td><td>{(summary.HealthCheckSuccess ? "<span class='success'>PASSED</span>" : "<span class='failure'>FAILED</span>")}</td></tr>
        </table>

        <h3>Deployment Details</h3>
        <table>
            <tr><th>Component</th><th>Details</th></tr>";

            if (summary.DeploymentType.Contains("Frontend") || summary.DeploymentType.Contains("Full"))
            {
                body += $@"
            <tr>
                <td>Frontend</td>
                <td>
                    Site: {summary.FrontendSite}<br/>
                    Files: {summary.FrontendFileCount}
                </td>
            </tr>";
            }

            if (summary.DeploymentType.Contains("Backend") || summary.DeploymentType.Contains("Full"))
            {
                body += $@"
            <tr>
                <td>Backend</td>
                <td>
                    Site: {summary.BackendSite}<br/>
                    Files: {summary.BackendFileCount}
                </td>
            </tr>";
            }

            body += $@"
            <tr>
                <td>Application Pool</td>
                <td>{summary.ApplicationPool}</td>
            </tr>
        </table>
    </div>

    <p>This is an automated message from the TenacyFMS Deployment System.</p>
</body>
</html>";

            await SendEmailAsync(subject, body, isHtml: true);
        }

        /// <inheritdoc />
        public async Task SendErrorNotificationAsync(Exception ex)
        {
            string subject = $"DEPLOYMENT ERROR: {Environment.MachineName} - {DateTime.Now:yyyy-MM-dd HH:mm:ss}";

            string body = $@"
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; }}
        .error {{ color: red; font-weight: bold; }}
        .exception {{ background-color: #fff0f0; padding: 10px; border-radius: 5px; font-family: monospace; }}
    </style>
</head>
<body>
    <h2><span class='error'>Deployment Error</span></h2>

    <p>A fatal error occurred during deployment:</p>

    <div class='exception'>
        <p><strong>Exception:</strong> {WebUtility.HtmlEncode(ex.GetType().Name)}</p>
        <p><strong>Message:</strong> {WebUtility.HtmlEncode(ex.Message)}</p>
        <p><strong>Stack Trace:</strong></p>
        <pre>{WebUtility.HtmlEncode(ex.StackTrace)}</pre>

        {(ex.InnerException != null ? $@"
        <p><strong>Inner Exception:</strong> {WebUtility.HtmlEncode(ex.InnerException.GetType().Name)}</p>
        <p><strong>Inner Message:</strong> {WebUtility.HtmlEncode(ex.InnerException.Message)}</p>
        <p><strong>Inner Stack Trace:</strong></p>
        <pre>{WebUtility.HtmlEncode(ex.InnerException.StackTrace)}</pre>
        " : "")}
    </div>

    <p>This is an automated message from the TenacyFMS Deployment System.</p>
</body>
</html>";

            await SendEmailAsync(subject, body, isHtml: true, isError: true);
        }

        /// <inheritdoc />
        public async Task SendCustomNotificationAsync(string subject, string message, bool isError = false)
        {
            string body = $@"
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; }}
        .message {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; }}
        .error {{ color: red; }}
    </style>
</head>
<body>
    <h2>{(isError ? "<span class='error'>" : "")}{WebUtility.HtmlEncode(subject)}{(isError ? "</span>" : "")}</h2>

    <div class='message'>
        <p>{WebUtility.HtmlEncode(message).Replace(Environment.NewLine, "<br/>")}</p>
    </div>

    <p>This is an automated message from the TenacyFMS Deployment System.</p>
</body>
</html>";

            await SendEmailAsync(subject, body, isHtml: true, isError: isError);
        }

        private async Task SendEmailAsync(string subject, string body, bool isHtml = false, bool isError = false)
        {
            try
            {
                string smtpServer = _config["EmailSettings:SmtpServer"];
                int smtpPort = int.Parse(_config["EmailSettings:SmtpPort"] ?? "25");
                bool useSsl = bool.Parse(_config["EmailSettings:UseSsl"] ?? "false");
                string username = _config["EmailSettings:Username"];
                string password = _config["EmailSettings:Password"];
                string from = _config["EmailSettings:From"];
                string to = _config["EmailSettings:To"];

                if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(from) || string.IsNullOrEmpty(to))
                {
                    _logger.LogWarning("Email settings not configured properly. Cannot send notification.");
                    return;
                }

                _logger.LogInformation($"Sending {(isError ? "error " : "")}email notification to {to}");

                using var client = new SmtpClient(smtpServer, smtpPort)
                {
                    EnableSsl = useSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network
                };

                if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
                {
                    client.Credentials = new NetworkCredential(username, password);
                }

                var message = new MailMessage
                {
                    From = new MailAddress(from),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = isHtml
                };

                foreach (var recipient in to.Split(',', ';'))
                {
                    message.To.Add(recipient.Trim());
                }

                // Attach log file if it exists
                string logFilePath = _config["LogSettings:FilePath"];
                if (!string.IsNullOrEmpty(logFilePath))
                {
                    // Replace timestamp placeholder if present
                    logFilePath = logFilePath.Replace("{timestamp}", DateTime.Now.ToString("yyyyMMdd"));

                    if (File.Exists(logFilePath))
                    {
                        message.Attachments.Add(new Attachment(logFilePath));
                        _logger.LogInformation($"Attached log file: {logFilePath}");
                    }
                    else
                    {
                        // Try to find the most recent log file in the directory
                        string logDir = Path.GetDirectoryName(logFilePath);
                        if (Directory.Exists(logDir))
                        {
                            var logFiles = Directory.GetFiles(logDir, "*.txt")
                                .OrderByDescending(f => new FileInfo(f).LastWriteTime)
                                .Take(1)
                                .ToArray();

                            if (logFiles.Length > 0)
                            {
                                message.Attachments.Add(new Attachment(logFiles[0]));
                                _logger.LogInformation($"Attached most recent log file: {logFiles[0]}");
                            }
                        }
                    }
                }

                await client.SendMailAsync(message);
                _logger.LogInformation("Email notification sent successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email notification");
            }
        }
    }
}