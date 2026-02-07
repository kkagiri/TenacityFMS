/**
 * File: EmailService.cs
 * Purpose: Sends SMTP email notifications with retry logic and optional file attachments.
 * Dependencies: IConfiguration, ILogger, System.Net.Mail
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - SendEmailAsync: Sends email with optional HTML body and attachments.
 * - IsConfigurationValid: Validates SMTP/from-address settings before send attempts.
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Services
{
    //Cursor - Implementation of IEmailService with SMTP functionality
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;
        private readonly EmailSettings _emailSettings;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _emailSettings = GetEmailSettings();
        }

        public async Task<bool> SendEmailAsync(
            string to,
            string subject,
            string body,
            bool isHtml = false,
            CancellationToken cancellationToken = default,
            IReadOnlyCollection<EmailAttachmentDto>? attachments = null)
        {
            if (!IsConfigurationValid())
            {
                _logger.LogWarning("Email configuration is not valid. Cannot send email to {To}", to);
                return false;
            }

            if (string.IsNullOrWhiteSpace(to))
            {
                _logger.LogWarning("Invalid recipient email address");
                return false;
            }

            var attempt = 0;
            var maxAttempts = _emailSettings.MaxRetryAttempts;

            while (attempt < maxAttempts)
            {
                try
                {
                    attempt++;
                    _logger.LogInformation("Attempting to send email to {To} (attempt {Attempt}/{MaxAttempts})", to, attempt, maxAttempts);

                    using var smtpClient = CreateSmtpClient();
                    using var mailMessage = CreateMailMessage(to, subject, body, isHtml, attachments);

                    await smtpClient.SendMailAsync(mailMessage, cancellationToken);

                    _logger.LogInformation("Email sent successfully to {To}", to);
                    return true;

                }
                catch (SmtpException ex)
                {
                    _logger.LogError(ex, "SMTP error sending email to {To} (attempt {Attempt}/{MaxAttempts}): {Message}",
                        to, attempt, maxAttempts, ex.Message);

                    // Don't retry for authentication or configuration errors
                    if (ex.StatusCode == SmtpStatusCode.MailboxBusy ||
                        ex.StatusCode == SmtpStatusCode.InsufficientStorage ||
                        ex.StatusCode == SmtpStatusCode.CommandNotImplemented)
                    {
                        break;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error sending email to {To} (attempt {Attempt}/{MaxAttempts})",
                        to, attempt, maxAttempts);
                }

                // Wait before retrying (except on last attempt)
                if (attempt < maxAttempts)
                {
                    var delay = TimeSpan.FromSeconds(_emailSettings.RetryDelaySeconds * attempt);
                    _logger.LogInformation("Waiting {Delay} seconds before retry", delay.TotalSeconds);
                    await Task.Delay(delay, cancellationToken);
                }
            }

            _logger.LogError("Failed to send email to {To} after {MaxAttempts} attempts", to, maxAttempts);
            return false;
        }

        private SmtpClient CreateSmtpClient()
        {
            var smtpClient = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort)
            {
                EnableSsl = _emailSettings.UseSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = _emailSettings.TimeoutSeconds * 1000 // Convert to milliseconds
            };

            // Configure authentication if credentials are provided
            if (!string.IsNullOrEmpty(_emailSettings.Username) && !string.IsNullOrEmpty(_emailSettings.Password))
            {
                smtpClient.Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password);
                _logger.LogDebug("SMTP client configured with authentication for user: {Username}", _emailSettings.Username);
            }
            else
            {
                // Use default credentials if no username/password provided
                smtpClient.UseDefaultCredentials = true;
                _logger.LogDebug("SMTP client configured to use default credentials");
            }

            return smtpClient;
        }

        private MailMessage CreateMailMessage(
            string to,
            string subject,
            string body,
            bool isHtml,
            IReadOnlyCollection<EmailAttachmentDto>? attachments)
        {
            var fromAddress = new MailAddress(_emailSettings.FromAddress, _emailSettings.FromDisplayName ?? "FMS Notifications");

            var mailMessage = new MailMessage
            {
                From = fromAddress,
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };

            // Handle multiple recipients (comma or semicolon separated)
            var recipients = to.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var recipient in recipients)
            {
                var trimmedRecipient = recipient.Trim();
                if (!string.IsNullOrWhiteSpace(trimmedRecipient))
                {
                    try
                    {
                        mailMessage.To.Add(new MailAddress(trimmedRecipient));
                    }
                    catch (FormatException ex)
                    {
                        _logger.LogWarning(ex, "Invalid email address format: {Email}", trimmedRecipient);
                    }
                }
            }

            if (attachments != null)
            {
                foreach (var attachment in attachments)
                {
                    if (attachment == null ||
                        string.IsNullOrWhiteSpace(attachment.FileName) ||
                        attachment.Content == null ||
                        attachment.Content.Length == 0)
                    {
                        continue;
                    }

                    var contentType = string.IsNullOrWhiteSpace(attachment.ContentType)
                        ? "application/octet-stream"
                        : attachment.ContentType;

                    var attachmentStream = new MemoryStream(attachment.Content, writable: false);
                    var mailAttachment = new Attachment(attachmentStream, attachment.FileName, contentType);
                    mailMessage.Attachments.Add(mailAttachment);
                }
            }

            return mailMessage;
        }

        private EmailSettings GetEmailSettings()
        {
            var settings = new EmailSettings();

            // Bind configuration to EmailSettings object
            _configuration.GetSection("EmailSettings").Bind(settings);

            // Fallback to individual configuration keys if section binding fails
            if (string.IsNullOrEmpty(settings.SmtpServer))
            {
                settings.SmtpServer = _configuration["EmailSettings:SmtpServer"] ?? string.Empty;
                settings.SmtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "25");
                settings.UseSsl = bool.Parse(_configuration["EmailSettings:UseSsl"] ?? "false");
                settings.Username = _configuration["EmailSettings:Username"];
                settings.Password = _configuration["EmailSettings:Password"];
                settings.FromAddress = _configuration["EmailSettings:From"] ?? _configuration["EmailSettings:FromAddress"] ?? string.Empty;
                settings.FromDisplayName = _configuration["EmailSettings:FromDisplayName"];
            }

            return settings;
        }

        public bool IsConfigurationValid()
        {
            if (string.IsNullOrWhiteSpace(_emailSettings.SmtpServer))
            {
                _logger.LogWarning("SMTP server is not configured");
                return false;
            }

            if (string.IsNullOrWhiteSpace(_emailSettings.FromAddress))
            {
                _logger.LogWarning("From address is not configured");
                return false;
            }

            try
            {
                // Validate from address format
                new MailAddress(_emailSettings.FromAddress);
            }
            catch (FormatException)
            {
                _logger.LogWarning("Invalid from address format: {FromAddress}", _emailSettings.FromAddress);
                return false;
            }

            return true;
        }
    }
}
