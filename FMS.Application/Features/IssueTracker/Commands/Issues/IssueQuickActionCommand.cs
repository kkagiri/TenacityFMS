/*
 * File: IssueQuickActionCommand.cs
 * Purpose: Handles quick actions on issues (Mark Complete, Escalate Priority) with notifications and timeline updates
 * Dependencies: MediatR, GpsdataContext, INotificationService, IConfiguration
 * Last Modified: 2026-02-05
 *
 * Key Functions:
 * - MarkComplete: Sets status to complete/closed, notifies the opener, updates timeline
 * - EscalatePriority: Sets priority to high, notifies the assigned user, updates timeline
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues
{
    public enum IssueQuickActionType
    {
        MarkComplete,
        EscalateToHigh
    }

    public class IssueQuickActionRequest
    {
        public int IssueId { get; set; }
        public IssueQuickActionType ActionType { get; set; }
        public string? PerformedByUserId { get; set; }
        public string? Notes { get; set; }
    }

    public record IssueQuickActionCommand(IssueQuickActionRequest Request) : IRequest<FMSResponse<bool>>;

    public class IssueQuickActionCommandHandler : IRequestHandler<IssueQuickActionCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<IssueQuickActionCommandHandler> _logger;

        public IssueQuickActionCommandHandler(
            GpsdataContext context,
            INotificationService notificationService,
            IConfiguration configuration,
            ILogger<IssueQuickActionCommandHandler> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(IssueQuickActionCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var request = command.Request;

                // Fetch the issue with related data
                var issue = await _context.Issuetrackers
                    .FirstOrDefaultAsync(i => i.Id == request.IssueId, cancellationToken);

                if (issue == null)
                {
                    return FMSResponse<bool>.Failed($"Issue with ID {request.IssueId} not found.");
                }

                // Get user who performed the action
                User? performedByUser = null;
                if (!string.IsNullOrEmpty(request.PerformedByUserId))
                {
                    performedByUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.Id == request.PerformedByUserId || u.UserName == request.PerformedByUserId, cancellationToken);
                }

                // Get issue opener and assigned user
                var openbyUser = !string.IsNullOrEmpty(issue.Openby)
                    ? await _context.Users.FirstOrDefaultAsync(u => u.Id == issue.Openby, cancellationToken)
                    : null;

                var assignedUser = !string.IsNullOrEmpty(issue.AssignTo)
                    ? await _context.Users.FirstOrDefaultAsync(u => u.Id == issue.AssignTo, cancellationToken)
                    : null;

                // Get vehicle and site names for notifications
                string? vehicleName = null;
                string? siteName = null;

                if (issue.VehicleId > 0)
                {
                    vehicleName = await _context.Vehicles
                        .Where(v => v.VehicleId == issue.VehicleId)
                        .Select(v => v.HyoungNo ?? v.NumberPlate ?? $"Vehicle #{v.VehicleId}")
                        .FirstOrDefaultAsync(cancellationToken);
                }

                if (issue.SiteId > 0)
                {
                    siteName = await _context.Sites
                        .Where(s => s.Id == issue.SiteId)
                        .Select(s => s.Name)
                        .FirstOrDefaultAsync(cancellationToken);
                }

                string actionDescription;
                string previousValue;

                switch (request.ActionType)
                {
                    case IssueQuickActionType.MarkComplete:
                        var result = await HandleMarkCompleteAsync(issue, openbyUser, performedByUser, vehicleName, siteName, request.Notes, cancellationToken);
                        if (!result.IsSuccess) return result;
                        actionDescription = "marked as complete";
                        previousValue = await GetStatusNameAsync(issue.Status, cancellationToken) ?? "Unknown";
                        break;

                    case IssueQuickActionType.EscalateToHigh:
                        previousValue = await GetPriorityNameAsync(issue.Priority, cancellationToken) ?? "Unknown";
                        var escalateResult = await HandleEscalateToHighAsync(issue, assignedUser, performedByUser, vehicleName, siteName, request.Notes, cancellationToken);
                        if (!escalateResult.IsSuccess) return escalateResult;
                        actionDescription = "escalated to high priority";
                        break;

                    default:
                        return FMSResponse<bool>.Failed($"Unknown action type: {request.ActionType}");
                }

                // Update the issue's last modified timestamp
                issue.LastModfield = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Issue {IssueId} {ActionDescription} by user {UserId}",
                    request.IssueId,
                    actionDescription,
                    request.PerformedByUserId ?? "System");

                return FMSResponse<bool>.Success(true, $"Issue successfully {actionDescription}.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing quick action on issue {IssueId}", command.Request.IssueId);
                return FMSResponse<bool>.Failed($"Error performing action: {ex.Message}");
            }
        }

        private async Task<FMSResponse<bool>> HandleMarkCompleteAsync(
            Issuetracker issue,
            User? openbyUser,
            User? performedByUser,
            string? vehicleName,
            string? siteName,
            string? notes,
            CancellationToken cancellationToken)
        {
            // Find the "Complete" or "Closed" status
            var completeStatus = await _context.Issuestatuses
                .Where(s => s.Status != null &&
                    (s.Status.ToLower().Contains("complete") ||
                     s.Status.ToLower().Contains("closed") ||
                     s.Status.ToLower().Contains("resolved") ||
                     s.Status.ToLower().Contains("done")))
                .FirstOrDefaultAsync(cancellationToken);

            if (completeStatus == null)
            {
                return FMSResponse<bool>.Failed("No 'Complete' or 'Closed' status found in the system.");
            }

            var previousStatusId = issue.Status;
            issue.Status = completeStatus.Id;
            issue.ClosingDate = DateTime.UtcNow;

            // Send notification to the opener
            if (openbyUser != null && !string.IsNullOrEmpty(openbyUser.Id))
            {
                await SendCompletionNotificationAsync(
                    issue,
                    openbyUser,
                    performedByUser,
                    vehicleName,
                    siteName,
                    notes,
                    cancellationToken);
            }

            return FMSResponse<bool>.Success(true);
        }

        private async Task<FMSResponse<bool>> HandleEscalateToHighAsync(
            Issuetracker issue,
            User? assignedUser,
            User? performedByUser,
            string? vehicleName,
            string? siteName,
            string? notes,
            CancellationToken cancellationToken)
        {
            // Find the "High" priority
            var highPriority = await _context.Issuepriorities
                .Where(p => p.Name != null && p.Name.ToLower().Contains("high"))
                .FirstOrDefaultAsync(cancellationToken);

            if (highPriority == null)
            {
                return FMSResponse<bool>.Failed("No 'High' priority found in the system.");
            }

            var previousPriorityId = issue.Priority;
            issue.Priority = highPriority.Id;

            // Send notification to the assigned user
            if (assignedUser != null && !string.IsNullOrEmpty(assignedUser.Id))
            {
                await SendEscalationNotificationAsync(
                    issue,
                    assignedUser,
                    performedByUser,
                    vehicleName,
                    siteName,
                    notes,
                    cancellationToken);
            }

            return FMSResponse<bool>.Success(true);
        }

        private async Task SendCompletionNotificationAsync(
            Issuetracker issue,
            User openbyUser,
            User? completedByUser,
            string? vehicleName,
            string? siteName,
            string? notes,
            CancellationToken cancellationToken)
        {
            try
            {
                var frontendBaseUrl = GetFrontendBaseUrl();
                var issueUrl = $"{frontendBaseUrl}/issue-tracker/details/{issue.Id}";
                var completedByName = completedByUser?.UserName ?? "System";

                var emailBodyHtml = BuildCompletionEmailHtml(
                    issue.Id,
                    issue.ProblemTitle ?? "Untitled Issue",
                    openbyUser.UserName ?? "User",
                    completedByName,
                    vehicleName ?? "Not specified",
                    siteName ?? "Not specified",
                    DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm"),
                    notes,
                    issueUrl);

                var notificationRequest = new CreateNotificationRequest
                {
                    Type = NotificationType.Alert,
                    CategoryId = (int)WellKnownCategories.IssueTracker,
                    Priority = NotificationPriority.Medium,
                    Title = $"Issue Completed: {issue.ProblemTitle}",
                    Message = $"Your issue #{issue.Id} has been marked as complete by {completedByName}.",
                    Data = new
                    {
                        IssueId = issue.Id,
                        IssueTitle = issue.ProblemTitle,
                        CompletedBy = completedByName,
                        CompletedAt = DateTime.UtcNow,
                        VehicleName = vehicleName,
                        SiteName = siteName,
                        IssueUrl = issueUrl,
                        Notes = notes,
                        EmailBodyHtml = emailBodyHtml
                    },
                    TriggerSource = "IssueCompletion",
                    TriggeredBy = completedByUser?.Id ?? "System",
                    SiteId = issue.SiteId,
                    VehicleId = issue.VehicleId,
                    IssueTrackerId = issue.Id,
                    Recipients = new List<NotificationRecipientDto>
                    {
                        new()
                        {
                            UserId = openbyUser.Id,
                            DeliveryMethods = new List<string> { "Email", "System" },
                            ResolvedFrom = "IssueOpener"
                        }
                    },
                    DisableFallbackAllUsers = true
                };

                var result = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);
                if (!result.IsSuccess)
                {
                    _logger.LogWarning(
                        "Issue {IssueId} completed but notification to opener failed: {Message}",
                        issue.Id,
                        result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send completion notification for issue {IssueId}", issue.Id);
            }
        }

        private async Task SendEscalationNotificationAsync(
            Issuetracker issue,
            User assignedUser,
            User? escalatedByUser,
            string? vehicleName,
            string? siteName,
            string? notes,
            CancellationToken cancellationToken)
        {
            try
            {
                var frontendBaseUrl = GetFrontendBaseUrl();
                var issueUrl = $"{frontendBaseUrl}/issue-tracker/details/{issue.Id}";
                var escalatedByName = escalatedByUser?.UserName ?? "System";
                var dueDateText = issue.DueDate?.ToString("yyyy-MM-dd") ?? "Not set";

                var emailBodyHtml = BuildEscalationEmailHtml(
                    issue.Id,
                    issue.ProblemTitle ?? "Untitled Issue",
                    assignedUser.UserName ?? "User",
                    escalatedByName,
                    vehicleName ?? "Not specified",
                    siteName ?? "Not specified",
                    dueDateText,
                    notes,
                    issueUrl);

                var notificationRequest = new CreateNotificationRequest
                {
                    Type = NotificationType.Alert,
                    CategoryId = (int)WellKnownCategories.IssueTracker,
                    Priority = NotificationPriority.High,
                    Title = $"⚠️ Priority Escalated: {issue.ProblemTitle}",
                    Message = $"Issue #{issue.Id} has been escalated to HIGH priority by {escalatedByName}. Please review immediately.",
                    Data = new
                    {
                        IssueId = issue.Id,
                        IssueTitle = issue.ProblemTitle,
                        EscalatedBy = escalatedByName,
                        EscalatedAt = DateTime.UtcNow,
                        NewPriority = "High",
                        VehicleName = vehicleName,
                        SiteName = siteName,
                        DueDate = issue.DueDate,
                        IssueUrl = issueUrl,
                        Notes = notes,
                        EmailBodyHtml = emailBodyHtml
                    },
                    TriggerSource = "IssuePriorityEscalation",
                    TriggeredBy = escalatedByUser?.Id ?? "System",
                    SiteId = issue.SiteId,
                    VehicleId = issue.VehicleId,
                    IssueTrackerId = issue.Id,
                    Recipients = new List<NotificationRecipientDto>
                    {
                        new()
                        {
                            UserId = assignedUser.Id,
                            DeliveryMethods = new List<string> { "Email", "System" },
                            ResolvedFrom = "IssueAssignee"
                        }
                    },
                    DisableFallbackAllUsers = true
                };

                var result = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);
                if (!result.IsSuccess)
                {
                    _logger.LogWarning(
                        "Issue {IssueId} escalated but notification to assignee failed: {Message}",
                        issue.Id,
                        result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send escalation notification for issue {IssueId}", issue.Id);
            }
        }

        private async Task<string?> GetStatusNameAsync(int? statusId, CancellationToken cancellationToken)
        {
            if (!statusId.HasValue) return null;
            return await _context.Issuestatuses
                .Where(s => s.Id == statusId.Value)
                .Select(s => s.Status)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private async Task<string?> GetPriorityNameAsync(int? priorityId, CancellationToken cancellationToken)
        {
            if (!priorityId.HasValue) return null;
            return await _context.Issuepriorities
                .Where(p => p.Id == priorityId.Value)
                .Select(p => p.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private string GetFrontendBaseUrl()
        {
            var configuredBaseUrl = _configuration["IssueTracker:FrontendBaseUrl"]
                ?? _configuration["Frontend:BaseUrl"]
                ?? _configuration["App:FrontendBaseUrl"];

            if (string.IsNullOrWhiteSpace(configuredBaseUrl))
            {
                throw new InvalidOperationException(
                    "Frontend base URL is not configured. Set 'IssueTracker:FrontendBaseUrl' in appsettings.");
            }

            return configuredBaseUrl.TrimEnd('/');
        }

        private static string BuildCompletionEmailHtml(
            int issueId,
            string issueTitle,
            string openerName,
            string completedByName,
            string vehicleName,
            string siteName,
            string completedAt,
            string? notes,
            string issueUrl)
        {
            var safeIssueTitle = WebUtility.HtmlEncode(issueTitle);
            var safeOpenerName = WebUtility.HtmlEncode(openerName);
            var safeCompletedBy = WebUtility.HtmlEncode(completedByName);
            var safeVehicle = WebUtility.HtmlEncode(vehicleName);
            var safeSite = WebUtility.HtmlEncode(siteName);
            var safeCompletedAt = WebUtility.HtmlEncode(completedAt);
            var safeNotes = WebUtility.HtmlEncode(notes ?? "No additional notes");
            var safeIssueUrl = WebUtility.HtmlEncode(issueUrl);

            return $@"
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"">
                  <tr>
                    <td style=""padding:24px 24px 16px;background:linear-gradient(135deg,#059669 0%,#10b981 100%);border-radius:12px 12px 0 0;"">
                      <div style=""font-size:11px;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;"">
                        <span style=""display:inline-block;background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;"">✓ Issue Completed</span>
                      </div>
                      <div style=""font-size:22px;color:#ffffff;font-weight:700;line-height:1.3;"">Issue #{issueId}: {safeIssueTitle}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style=""padding:0;background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"">
                      <div style=""padding:20px 24px;border-bottom:1px solid #f3f4f6;"">
                        <p style=""margin:0;font-size:15px;color:#374151;line-height:1.6;"">
                          Hi <strong>{safeOpenerName}</strong>,<br/><br/>
                          Great news! Your issue has been marked as <strong style=""color:#059669;"">completed</strong> by <strong>{safeCompletedBy}</strong>.
                        </p>
                      </div>
                      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-collapse:collapse;"">
                        <tr>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">🚗 Vehicle</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeVehicle}</div>
                          </td>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">📍 Site</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeSite}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">✅ Completed By</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeCompletedBy}</div>
                          </td>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">📅 Completed At</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeCompletedAt}</div>
                          </td>
                        </tr>
                      </table>
                      <div style=""padding:24px;text-align:center;"">
                        <a href=""{safeIssueUrl}"" style=""display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 6px rgba(5,150,105,0.25);"">
                          View Issue Details
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style=""padding:16px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center;"">
                      <p style=""margin:0;font-size:12px;color:#6b7280;"">
                        This is an automated notification from <strong>Hyoung FMS</strong>.
                      </p>
                    </td>
                  </tr>
                </table>";
        }

        private static string BuildEscalationEmailHtml(
            int issueId,
            string issueTitle,
            string assigneeName,
            string escalatedByName,
            string vehicleName,
            string siteName,
            string dueDate,
            string? notes,
            string issueUrl)
        {
            var safeIssueTitle = WebUtility.HtmlEncode(issueTitle);
            var safeAssigneeName = WebUtility.HtmlEncode(assigneeName);
            var safeEscalatedBy = WebUtility.HtmlEncode(escalatedByName);
            var safeVehicle = WebUtility.HtmlEncode(vehicleName);
            var safeSite = WebUtility.HtmlEncode(siteName);
            var safeDueDate = WebUtility.HtmlEncode(dueDate);
            var safeNotes = WebUtility.HtmlEncode(notes ?? "No additional notes");
            var safeIssueUrl = WebUtility.HtmlEncode(issueUrl);

            return $@"
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"">
                  <tr>
                    <td style=""padding:24px 24px 16px;background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);border-radius:12px 12px 0 0;"">
                      <div style=""font-size:11px;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;"">
                        <span style=""display:inline-block;background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;"">⚠️ Priority Escalated</span>
                      </div>
                      <div style=""font-size:22px;color:#ffffff;font-weight:700;line-height:1.3;"">Issue #{issueId}: {safeIssueTitle}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style=""padding:0;background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"">
                      <div style=""padding:20px 24px;border-bottom:1px solid #f3f4f6;"">
                        <p style=""margin:0;font-size:15px;color:#374151;line-height:1.6;"">
                          Hi <strong>{safeAssigneeName}</strong>,<br/><br/>
                          This issue has been escalated to <strong style=""color:#dc2626;"">HIGH PRIORITY</strong> by <strong>{safeEscalatedBy}</strong>. Please review and take action immediately.
                        </p>
                      </div>
                      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-collapse:collapse;"">
                        <tr>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">🚗 Vehicle</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeVehicle}</div>
                          </td>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">📍 Site</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeSite}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">🔴 New Priority</div>
                            <div style=""font-size:14px;color:#dc2626;font-weight:700;"">HIGH</div>
                          </td>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">📅 Due Date</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeDueDate}</div>
                          </td>
                        </tr>
                      </table>
                      <div style=""padding:24px;text-align:center;"">
                        <a href=""{safeIssueUrl}"" style=""display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 6px rgba(220,38,38,0.25);"">
                          View Issue Now →
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style=""padding:16px 24px;background:#fef2f2;border:1px solid #fecaca;border-top:none;border-radius:0 0 12px 12px;text-align:center;"">
                      <p style=""margin:0;font-size:12px;color:#991b1b;"">
                        <strong>Action Required:</strong> Please prioritize this issue immediately.
                      </p>
                    </td>
                  </tr>
                </table>";
        }
    }
}
