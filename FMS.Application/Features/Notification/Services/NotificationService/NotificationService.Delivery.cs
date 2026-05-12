/**
 * File: NotificationService.Delivery.cs
 * Purpose: Channel-specific delivery logic (System/SignalR, Email, SMS),
 *          email attachment building, scheduled report execution logging,
 *          and delivery helper utilities.
 * Dependencies: GpsdataContext, ILogger, ISignalRNotificationService, IEmailService, ISmsService,
 *               IScheduledReportDeliveryService, IFileHandlingService
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - SendToRecipientAsync(): Routes delivery to the appropriate channel
 * - SendSystemNotificationAsync(): Delivers via SignalR
 * - SendEmailNotificationAsync(): Delivers via email with template and attachments
 * - SendSmsNotificationAsync(): Delivers via SMS
 * - BuildEventAttachmentsAsync(): Builds email attachments from notification data
 * - TryLogScheduledReportExecutionAsync(): Logs scheduled report execution history
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Domain.Entities.Features.Reporting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Noti = FMS.Domain.Entities.Features.Notifications;


namespace FMS.Application.Features.Notification.Services
{
    public partial class NotificationService
    {
        private async Task<bool> SendToRecipientAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                // Try dynamic channel first if available
                if (_channelRegistry != null && _channelRegistry.TryGet(recipient.DeliveryMethod?.ToLower(), out var channel) && channel != null)
                {
                    return await channel.SendAsync(notification, recipient, cancellationToken);
                }

                // Fallback to legacy methods
                switch (recipient.DeliveryMethod?.ToLower())
                {
                    case var method when method == SystemConstants.Notifications.SystemDeliveryMethod.ToLower():
                        return await SendSystemNotificationAsync(notification, recipient, cancellationToken);
                    case "email":
                        return await SendEmailNotificationAsync(notification, recipient, cancellationToken);
                    case "sms":
                        return await SendSmsNotificationAsync(notification, recipient, cancellationToken);
                    default:
                        _logger.LogWarning("Unknown delivery method: {DeliveryMethod}", recipient.DeliveryMethod);
                        return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification via {DeliveryMethod} to {UserId}", recipient.DeliveryMethod, recipient.UserId);
                return false;
            }
        }

        private async Task<bool> SendSystemNotificationAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                // Strip HTML tags — MessageTemplate may contain rich HTML designed for email;
                // system (SignalR) and push must receive clean plain text.
                var plainMessage = StripHtml(notification.Message);

                var notificationPayload = new
                {
                    id = notification.NotificationId,
                    title = notification.Title,
                    message = plainMessage,
                    type = notification.Type.ToLower(),
                    priority = notification.Priority,
                    // Ensure timestamp is in ISO 8601 UTC format with 'Z' suffix
                    timestamp = notification.CreatedAt.ToString("o"),
                    data = notification.Data != null ? JsonConvert.DeserializeObject(notification.Data) : null,
                    // Include target user for frontend filtering when broadcast is used
                    targetUserId = recipient.UserId
                };

                // Try user-targeted notification first
                await _signalRService.SendUserNotificationAsync(
                    recipient.UserId,
                    SystemConstants.Notifications.SystemNotificationType,
                    plainMessage,
                    notificationPayload);

                _logger.LogDebug("Sent targeted system notification {NotificationId} to user {UserId}",
                    notification.NotificationId, recipient.UserId);

                // Also broadcast globally as fallback (frontend will filter by targetUserId)
                // This ensures delivery even if user-targeted routing fails silently
                await _signalRService.SendGlobalNotificationAsync(
                    SystemConstants.Notifications.SystemNotificationType,
                    plainMessage,
                    notificationPayload);

                _logger.LogDebug("Broadcast system notification {NotificationId} globally (target: {UserId})",
                    notification.NotificationId, recipient.UserId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending system notification to {UserId}", recipient.UserId);
                return false;
            }
        }

        private async Task<bool> SendEmailNotificationAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                if (IsScheduledReportNotification(notification) && _scheduledReportDeliveryService != null)
                {
                    var scheduledPayload = await _scheduledReportDeliveryService
                        .BuildEmailPayloadAsync(notification, cancellationToken);

                    if (scheduledPayload != null)
                    {
                        return await _emailService.SendEmailAsync(
                            recipient.RecipientAddress,
                            string.IsNullOrWhiteSpace(scheduledPayload.Subject) ? notification.Title : scheduledPayload.Subject,
                            scheduledPayload.Body,
                            isHtml: scheduledPayload.IsHtml,
                            cancellationToken: cancellationToken,
                            attachments: scheduledPayload.Attachments);
                    }
                }

                // Try to build event report PDF attachment (e.g., TankVolumeHistory for stock discrepancy events)
                var eventAttachments = await BuildEventAttachmentsAsync(notification, cancellationToken);

                var customEmailBody = TryGetCustomEmailBodyFromData(notification.Data);
                if (!string.IsNullOrWhiteSpace(customEmailBody))
                {
                    return await _emailService.SendEmailAsync(
                        recipient.RecipientAddress,
                        notification.Title,
                        customEmailBody,
                        isHtml: true,
                        cancellationToken: cancellationToken,
                        attachments: eventAttachments);
                }

                var policy = notification.NotificationPolicy;
                var emailTemplate = policy?.EmailTemplate ?? GetDefaultEmailTemplate();

                // Use display name for category
                var categoryDisplayName = !string.IsNullOrWhiteSpace(notification.Category)
                    ? notification.Category
                    : GetCategoryDisplayName(notification.NotificationCategoryId);

                var emailContent = FormatTemplate(emailTemplate, new
                {
                    notification.Title,
                    notification.Message,
                    notification.Priority,
                    Category = categoryDisplayName,
                    notification.CreatedAt,
                    RecipientName = recipient.User?.UserName ?? "User"
                });

                return await _emailService.SendEmailAsync(
                    recipient.RecipientAddress,
                    notification.Title,
                    emailContent,
                    isHtml: true,
                    cancellationToken: cancellationToken,
                    attachments: eventAttachments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email notification to {Email}", recipient.RecipientAddress);
                return false;
            }
        }

        /// <summary>
        /// Checks the notification Data JSON for a reportAttachment metadata block
        /// and generates the PDF attachment via ScheduledReportDeliveryService.
        /// Returns an empty list when no report is requested or the service is unavailable.
        /// </summary>
        private async Task<List<EmailAttachmentDto>> BuildEventAttachmentsAsync(
            Noti.Notification notification, CancellationToken cancellationToken)
        {
            var attachments = new List<EmailAttachmentDto>();
            attachments.AddRange(await TryBuildEventReportAttachmentAsync(notification, cancellationToken));
            attachments.AddRange(await TryBuildEventFileAttachmentsAsync(notification, cancellationToken));
            return attachments;
        }

        private async Task<List<EmailAttachmentDto>> TryBuildEventReportAttachmentAsync(
            Noti.Notification notification, CancellationToken cancellationToken)
        {
            if (_scheduledReportDeliveryService == null || string.IsNullOrWhiteSpace(notification.Data))
            {
                return new List<EmailAttachmentDto>();
            }

            try
            {
                var dataObject = JObject.Parse(notification.Data);
                var reportAttachment = dataObject["reportAttachment"];
                if (reportAttachment == null || reportAttachment.Type == JTokenType.Null)
                {
                    return new List<EmailAttachmentDto>();
                }

                var reportType = reportAttachment.Value<string>("reportType");
                var templateName = reportAttachment.Value<string>("templateName");
                if (string.IsNullOrWhiteSpace(reportType) || string.IsNullOrWhiteSpace(templateName))
                {
                    return new List<EmailAttachmentDto>();
                }

                var tankId = reportAttachment.Value<int?>("tankId");
                var siteId = reportAttachment.Value<int?>("siteId");
                var startDateStr = reportAttachment.Value<string>("startDate");
                var endDateStr = reportAttachment.Value<string>("endDate");
                var fileNamePrefix = reportAttachment.Value<string>("fileNamePrefix") ?? "Report";

                if (!DateTime.TryParse(startDateStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out var startDate) ||
                    !DateTime.TryParse(endDateStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out var endDate))
                {
                    _logger.LogWarning("Invalid date range in reportAttachment metadata for notification {NotificationId}",
                        notification.NotificationId);
                    return new List<EmailAttachmentDto>();
                }

                _logger.LogInformation(
                    "Generating event report attachment [{ReportType}] for notification {NotificationId}, Tank={TankId}, Site={SiteId}, Range={Start}-{End}",
                    reportType, notification.NotificationId, tankId, siteId, startDate, endDate);

                var attachments = await _scheduledReportDeliveryService.BuildReportAttachmentAsync(
                    reportType, templateName, tankId, siteId, startDate, endDate, fileNamePrefix, cancellationToken);

                _logger.LogInformation(
                    "Generated {Count} report attachment(s) for notification {NotificationId}",
                    attachments.Count, notification.NotificationId);

                return attachments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to build event report attachment for notification {NotificationId}. Email will be sent without attachment.",
                    notification.NotificationId);
                return new List<EmailAttachmentDto>();
            }
        }

        private async Task<List<EmailAttachmentDto>> TryBuildEventFileAttachmentsAsync(
            Noti.Notification notification,
            CancellationToken cancellationToken)
        {
            if (_fileHandlingService == null || string.IsNullOrWhiteSpace(notification.Data))
            {
                return new List<EmailAttachmentDto>();
            }

            try
            {
                var dataObject = JObject.Parse(notification.Data);
                var fileAttachments = dataObject["fileAttachments"];
                if (fileAttachments == null || fileAttachments.Type != JTokenType.Array)
                {
                    return new List<EmailAttachmentDto>();
                }

                var attachments = new List<EmailAttachmentDto>();
                foreach (var attachmentToken in fileAttachments.Children<JObject>())
                {
                    var filePath = attachmentToken.Value<string>("filePath");
                    if (string.IsNullOrWhiteSpace(filePath))
                    {
                        continue;
                    }

                    var content = await _fileHandlingService.ReadFileAsync(filePath, cancellationToken);
                    if (content == null || content.Length == 0)
                    {
                        continue;
                    }

                    if (content.Length > MaxEventFileAttachmentBytes)
                    {
                        _logger.LogWarning(
                            "Skipping event file attachment for notification {NotificationId} because it exceeds the size limit: {Size}",
                            notification.NotificationId,
                            content.Length);
                        continue;
                    }

                    var fileName = attachmentToken.Value<string>("fileName");
                    var contentType = attachmentToken.Value<string>("contentType");

                    attachments.Add(new EmailAttachmentDto
                    {
                        FileName = string.IsNullOrWhiteSpace(fileName)
                            ? Path.GetFileName(filePath.TrimEnd('/').TrimEnd('\\'))
                            : fileName,
                        ContentType = string.IsNullOrWhiteSpace(contentType)
                            ? GetContentTypeFromFileName(fileName ?? filePath)
                            : contentType,
                        Content = content
                    });
                }

                return attachments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to build event file attachment for notification {NotificationId}. Email will be sent without the direct file attachment.",
                    notification.NotificationId);
                return new List<EmailAttachmentDto>();
            }
        }

        /// <summary>
        /// Strips HTML tags and collapses whitespace to produce clean plain text.
        /// Used for system (SignalR) and push channels where the MessageTemplate
        /// may contain rich HTML intended for email rendering.
        /// </summary>
        private static string StripHtml(string? html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;
            // Remove all HTML tags
            var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
            // Decode common HTML entities
            text = text.Replace("&amp;", "&")
                       .Replace("&lt;", "<")
                       .Replace("&gt;", ">")
                       .Replace("&nbsp;", " ")
                       .Replace("&quot;", "\"");
            // Collapse multiple whitespace / newlines into a single space
            text = System.Text.RegularExpressions.Regex.Replace(text, @"\s{2,}", " ");
            return text.Trim();
        }

        private string? TryGetCustomEmailBodyFromData(string? dataJson)
        {
            if (string.IsNullOrWhiteSpace(dataJson))
            {
                return null;
            }

            try
            {
                var dataObject = JObject.Parse(dataJson);
                var customEmailBody = dataObject.Value<string>("EmailBodyHtml")
                    ?? dataObject.Value<string>("emailBodyHtml");

                return string.IsNullOrWhiteSpace(customEmailBody) ? null : customEmailBody;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not parse notification Data for custom email body");
                return null;
            }
        }

        private static string GetContentTypeFromFileName(string? fileName)
        {
            var extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();

            return extension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }

        private static bool IsScheduledReportNotification(Noti.Notification notification)
        {
            if (notification == null)
            {
                return false;
            }

            if (!string.IsNullOrWhiteSpace(notification.TriggerSource) &&
                notification.TriggerSource.Contains("ReportSchedule", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (string.IsNullOrWhiteSpace(notification.Data))
            {
                return false;
            }

            try
            {
                var dataObject = JObject.Parse(notification.Data);
                var reportType = dataObject.Value<string>("reportType");
                return !string.IsNullOrWhiteSpace(reportType);
            }
            catch
            {
                return false;
            }
        }

        private async Task TryLogScheduledReportExecutionAsync(
            Noti.Notification notification,
            int successCount,
            int failureCount,
            CancellationToken cancellationToken)
        {
            if (notification == null)
            {
                return;
            }

            try
            {
                var reportDefinitionId = await ResolveScheduledReportDefinitionIdAsync(notification.Data, cancellationToken);
                if (reportDefinitionId <= 0)
                {
                    _logger.LogDebug(
                        "Skipping scheduled report execution log for notification {NotificationId} - no matching report definition",
                        notification.NotificationId);
                    return;
                }

                string exportFormat = "pdf";
                if (!string.IsNullOrWhiteSpace(notification.Data))
                {
                    try
                    {
                        var root = JObject.Parse(notification.Data);
                        exportFormat = root.Value<string>("format")?.Trim().ToLowerInvariant() ?? "pdf";
                    }
                    catch
                    {
                        exportFormat = "pdf";
                    }
                }

                var history = new ReportExecutionHistory
                {
                    ReportDefinitionId = reportDefinitionId,
                    ExecutedBy = string.IsNullOrWhiteSpace(notification.TriggeredBy) ? "System" : notification.TriggeredBy,
                    ExecutedAt = DateTime.UtcNow,
                    Filters = notification.Data,
                    ExportFormat = exportFormat,
                    RecordCount = successCount + failureCount,
                    Success = failureCount == 0,
                    ErrorMessage = failureCount > 0 ? notification.ErrorMessage : null
                };

                _context.ReportExecutionHistories.Add(history);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to persist scheduled report execution history for notification {NotificationId}",
                    notification.NotificationId);
            }
        }

        private async Task<int> ResolveScheduledReportDefinitionIdAsync(string? notificationData, CancellationToken cancellationToken)
        {
            var candidates = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (!string.IsNullOrWhiteSpace(notificationData))
            {
                try
                {
                    var root = JObject.Parse(notificationData);
                    AddScheduledCandidate(candidates, root.Value<string>("reportId"));
                    AddScheduledCandidate(candidates, root.Value<string>("sourceId"));
                    AddScheduledCandidate(candidates, root.Value<string>("sourceName"));
                    AddScheduledCandidate(candidates, root.Value<string>("templateName"));
                    AddScheduledCandidate(candidates, root.Value<string>("reportType"));
                }
                catch
                {
                }
            }

            if (candidates.Count == 0)
            {
                return 0;
            }

            var definitions = await _context.ReportDefinitions
                .AsNoTracking()
                .Select(d => new
                {
                    d.ReportDefinitionId,
                    d.ReportId,
                    d.ReportName,
                    d.DataSourceEndpoint
                })
                .ToListAsync(cancellationToken);

            foreach (var candidate in candidates)
            {
                var exact = definitions.FirstOrDefault(d =>
                    string.Equals(d.ReportId, candidate, StringComparison.OrdinalIgnoreCase));
                if (exact != null)
                {
                    return exact.ReportDefinitionId;
                }
            }

            foreach (var candidate in candidates)
            {
                var byName = definitions.FirstOrDefault(d =>
                    string.Equals(d.ReportName, candidate, StringComparison.OrdinalIgnoreCase));
                if (byName != null)
                {
                    return byName.ReportDefinitionId;
                }
            }

            foreach (var candidate in candidates)
            {
                var containsMatch = definitions.FirstOrDefault(d =>
                    (!string.IsNullOrWhiteSpace(d.ReportId) &&
                     d.ReportId.Contains(candidate, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(d.DataSourceEndpoint) &&
                     d.DataSourceEndpoint.Contains(candidate, StringComparison.OrdinalIgnoreCase)));
                if (containsMatch != null)
                {
                    return containsMatch.ReportDefinitionId;
                }
            }

            return 0;
        }

        private static void AddScheduledCandidate(HashSet<string> candidates, string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            var trimmed = value.Trim();
            if (trimmed.Length == 0)
            {
                return;
            }

            candidates.Add(trimmed);

            var kebab = ToScheduledKebabCase(trimmed);
            if (!string.IsNullOrWhiteSpace(kebab))
            {
                candidates.Add(kebab);
                if (!kebab.EndsWith("-report", StringComparison.OrdinalIgnoreCase))
                {
                    candidates.Add($"{kebab}-report");
                }
                else
                {
                    candidates.Add(kebab[..^7]);
                }
            }
        }

        private static string ToScheduledKebabCase(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var chars = new List<char>(value.Length + 8);
            for (var i = 0; i < value.Length; i++)
            {
                var c = value[i];
                if (char.IsUpper(c) && i > 0 && value[i - 1] != '-' && value[i - 1] != '_' && !char.IsUpper(value[i - 1]))
                {
                    chars.Add('-');
                }

                if (c == '_' || c == ' ')
                {
                    chars.Add('-');
                    continue;
                }

                chars.Add(char.ToLowerInvariant(c));
            }

            return new string(chars.ToArray()).Trim('-');
        }

        private async Task<bool> SendSmsNotificationAsync(Noti.Notification notification, NotificationRecipient recipient, CancellationToken cancellationToken)
        {
            try
            {
                var policy = notification.NotificationPolicy;
                var smsTemplate = policy?.SmsTemplate ?? "{Title}: {Message}";

                // Convert category ID back to enum name for display
                var categoryDisplayName = !string.IsNullOrWhiteSpace(notification.Category)
                    ? notification.Category
                    : GetCategoryDisplayName(notification.NotificationCategoryId);

                var smsContent = FormatTemplate(smsTemplate, new
                {
                    Title = notification.Title,
                    Message = notification.Message,
                    Priority = notification.Priority,
                    Category = categoryDisplayName
                });

                return await _smsService.SendSmsAsync(
                    recipient.RecipientAddress,
                    smsContent,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending SMS notification to {Phone}", recipient.RecipientAddress);
                return false;
            }
        }
    }
}
