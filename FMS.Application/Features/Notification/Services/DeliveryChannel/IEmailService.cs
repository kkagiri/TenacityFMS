/**
 * File: IEmailService.cs
 * Purpose: Contract for sending notification emails with optional attachments.
 * Dependencies: EmailAttachmentDto
 * Last Modified: 2026-02-07
 */
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using FMS.Application.Features.Notification.DTOs;

namespace FMS.Application.Features.Notification.Services
{
    /// <summary>
    /// Email service interface for sending email notifications
    /// </summary>
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(
            string to,
            string subject,
            string body,
            bool isHtml = false,
            CancellationToken cancellationToken = default,
            IReadOnlyCollection<EmailAttachmentDto>? attachments = null);

        /// <summary>
        /// Check if email configuration is valid
        /// </summary>
        /// <returns>True if configuration is valid</returns>
        bool IsConfigurationValid();
    }
}
