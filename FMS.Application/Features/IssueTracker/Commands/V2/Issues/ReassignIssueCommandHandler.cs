/**
 * File: ReassignIssueCommandHandler.cs
 * Purpose: Handles issue reassignment — updates assignee, creates tracking record, notifies new assignee only
 * Dependencies: MediatR, GpsdataContext, INotificationService, IIssueActivityService, IConfiguration
 * Last Modified: 2026-02-21
 *
 * Key Functions:
 * - Handle: Validates issue/users, updates assignment, creates tracker record, sends notification
 * - SendReassignmentNotificationAsync: Sends email+system notification to the NEW assignee only
 * - BuildReassignmentEmailHtml: Renders a styled HTML email with reassignment details
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Application.Features.IssueTracker.Services;
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

namespace FMS.Application.Features.IssueTracker.Commands.V2.Issues
{
    public class ReassignIssueCommandHandler
        : IRequestHandler<ReassignIssueCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly IIssueActivityService _activityService;
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ReassignIssueCommandHandler> _logger;

        public ReassignIssueCommandHandler(
            GpsdataContext context,
            IIssueActivityService activityService,
            INotificationService notificationService,
            IConfiguration configuration,
            ILogger<ReassignIssueCommandHandler> logger)
        {
            _context = context;
            _activityService = activityService;
            _notificationService = notificationService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(
            ReassignIssueCommand command,
            CancellationToken cancellationToken)
        {
            try
            {
                var request = command.Request;

                if (string.IsNullOrWhiteSpace(request.NewAssigneeUserId))
                {
                    return FMSResponse<bool>.Failed("New assignee is required.");
                }

                // Fetch issue
                var issue = await _context.Issuetrackers
                    .FirstOrDefaultAsync(i => i.Id == command.IssueId, cancellationToken);

                if (issue == null)
                {
                    return FMSResponse<bool>.Failed(
                        $"Issue with ID {command.IssueId} not found.");
                }

                // Resolve new assignee
                var newAssignee = await _context.Users
                    .FirstOrDefaultAsync(
                        u => u.Id == request.NewAssigneeUserId
                            || u.UserName == request.NewAssigneeUserId,
                        cancellationToken);

                if (newAssignee == null)
                {
                    return FMSResponse<bool>.Failed(
                        $"User '{request.NewAssigneeUserId}' not found.");
                }

                // Prevent reassigning to the same user
                if (string.Equals(issue.AssignTo, newAssignee.Id, StringComparison.OrdinalIgnoreCase))
                {
                    return FMSResponse<bool>.Failed(
                        "Issue is already assigned to this user.");
                }

                // Resolve performing user
                User? performedByUser = null;
                if (!string.IsNullOrEmpty(command.PerformedByUserId))
                {
                    performedByUser = await _context.Users
                        .FirstOrDefaultAsync(
                            u => u.Id == command.PerformedByUserId
                                || u.UserName == command.PerformedByUserId,
                            cancellationToken);
                }
                var performedByUserId = performedByUser?.Id ?? command.PerformedByUserId ?? "System";
                var performedByUserName = performedByUser?.UserName
                    ?? command.PerformedByUserName ?? "System";

                // Capture old assignee info for logging
                var oldAssigneeId = issue.AssignTo;
                var oldAssignee = !string.IsNullOrEmpty(oldAssigneeId)
                    ? await _context.Users
                        .FirstOrDefaultAsync(u => u.Id == oldAssigneeId, cancellationToken)
                    : null;
                var oldAssigneeName = oldAssignee?.UserName ?? oldAssigneeId ?? "Unassigned";

                // === Update assignment ===
                issue.AssignTo = newAssignee.Id;
                issue.LastModfield = DateTime.UtcNow;

                // === Create assignment tracker record ===
                var maxTrackerId = await _context.Issueassignmenttrackers
                    .MaxAsync(t => (int?)t.Id, cancellationToken) ?? 0;

                var tracker = new Issueassignmenttracker
                {
                    Id = maxTrackerId + 1,
                    Issue = command.IssueId,
                    AssignedFrom = performedByUserId,
                    AssignedTo = newAssignee.Id,
                    AssignedDate = DateTime.UtcNow
                };

                // Save with duplicate key retry
                var saved = false;
                for (int attempt = 0; attempt < 3 && !saved; attempt++)
                {
                    try
                    {
                        _context.Issueassignmenttrackers.Add(tracker);
                        await _context.SaveChangesAsync(cancellationToken);
                        saved = true;
                    }
                    catch (DbUpdateException ex) when (
                        ex.InnerException?.Message?.Contains("Duplicate entry") == true)
                    {
                        _context.Entry(tracker).State = EntityState.Detached;
                        var newMax = await _context.Issueassignmenttrackers
                            .MaxAsync(t => (int?)t.Id, cancellationToken) ?? 0;
                        tracker.Id = newMax + 1;
                    }
                }

                if (!saved)
                {
                    return FMSResponse<bool>.Failed(
                        "Failed to create assignment tracker record after multiple attempts.");
                }

                // === Activity logging ===
                await _activityService.LogAssignmentChangeAsync(
                    issue.Id,
                    oldAssigneeName,
                    newAssignee.UserName ?? newAssignee.Id,
                    performedByUserId,
                    performedByUserName,
                    cancellationToken);

                if (!string.IsNullOrWhiteSpace(request.Notes))
                {
                    await _activityService.LogActivityAsync(
                        issue.Id,
                        "ReassignmentNote",
                        $"{performedByUserName} reassigned with note: {request.Notes.Trim()}",
                        performedByUserId,
                        performedByUserName,
                        cancellationToken: cancellationToken);
                }

                // === Notification to NEW assignee only ===
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

                await SendReassignmentNotificationAsync(
                    issue, newAssignee, performedByUser,
                    vehicleName, siteName, request.Notes,
                    cancellationToken);

                _logger.LogInformation(
                    "Issue {IssueId} reassigned from {OldAssignee} to {NewAssignee} by {PerformedBy}",
                    command.IssueId,
                    oldAssigneeName,
                    newAssignee.UserName ?? newAssignee.Id,
                    performedByUserId);

                return FMSResponse<bool>.Success(true,
                    $"Issue reassigned to {newAssignee.UserName ?? newAssignee.Id}.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error reassigning issue {IssueId}",
                    command.IssueId);
                return FMSResponse<bool>.Failed($"Error reassigning issue: {ex.Message}");
            }
        }

        private async Task SendReassignmentNotificationAsync(
            Issuetracker issue,
            User newAssignee,
            User? reassignedByUser,
            string? vehicleName,
            string? siteName,
            string? notes,
            CancellationToken cancellationToken)
        {
            try
            {
                var frontendBaseUrl = GetFrontendBaseUrl();
                var issueUrl = $"{frontendBaseUrl}/issue-tracker/details/{issue.Id}";
                var reassignedByName = reassignedByUser?.UserName ?? "System";
                var reassignedAtUtc = DateTime.UtcNow;
                var reassignedAtLocal = FormatLocalDateTime(reassignedAtUtc);
                var dueDateText = issue.DueDate.HasValue
                    ? FormatLocalDateTime(issue.DueDate.Value) : "Not set";

                // Get priority name
                string? priorityName = null;
                if (issue.Priority.HasValue)
                {
                    priorityName = await _context.Issuepriorities
                        .Where(p => p.Id == issue.Priority.Value)
                        .Select(p => p.Name)
                        .FirstOrDefaultAsync(cancellationToken);
                }

                var emailBodyHtml = BuildReassignmentEmailHtml(
                    issue.Id,
                    issue.ProblemTitle ?? "Untitled Issue",
                    newAssignee.UserName ?? "User",
                    reassignedByName,
                    vehicleName ?? "Not specified",
                    siteName ?? "Not specified",
                    dueDateText,
                    priorityName ?? "Not set",
                    notes,
                    issueUrl);

                var notificationRequest = new CreateNotificationRequest
                {
                    Type = NotificationType.Alert,
                    CategoryId = (int)WellKnownCategories.IssueTracker,
                    Priority = NotificationPriority.High,
                    Title = $"Issue Assigned to You: {issue.ProblemTitle}",
                    Message = $"Issue #{issue.Id} has been assigned to you by {reassignedByName}. Please review.",
                    Data = new
                    {
                        IssueId = issue.Id,
                        IssueTitle = issue.ProblemTitle,
                        ReassignedBy = reassignedByName,
                        ReassignedAt = reassignedAtUtc,
                        ReassignedAtLocal = reassignedAtLocal,
                        VehicleName = vehicleName,
                        SiteName = siteName,
                        DueDate = issue.DueDate,
                        IssueUrl = issueUrl,
                        Notes = notes,
                        EmailBodyHtml = emailBodyHtml
                    },
                    TriggerSource = "IssueReassignment",
                    TriggeredBy = reassignedByUser?.Id ?? "System",
                    SiteId = issue.SiteId,
                    VehicleId = issue.VehicleId,
                    IssueTrackerId = issue.Id,
                    Recipients = new List<NotificationRecipientDto>
                    {
                        new()
                        {
                            UserId = newAssignee.Id,
                            DeliveryMethods = new List<string> { "Email", "System" },
                            ResolvedFrom = "IssueNewAssignee"
                        }
                    },
                    DisableFallbackAllUsers = true
                };

                var result = await _notificationService.CreateNotificationAsync(
                    notificationRequest, cancellationToken);

                if (!result.IsSuccess)
                {
                    _logger.LogWarning(
                        "Issue {IssueId} reassigned but notification to new assignee failed: {Message}",
                        issue.Id, result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to send reassignment notification for issue {IssueId}",
                    issue.Id);
            }
        }

        private static string BuildReassignmentEmailHtml(
            int issueId,
            string issueTitle,
            string assigneeName,
            string reassignedByName,
            string vehicleName,
            string siteName,
            string dueDate,
            string priority,
            string? notes,
            string issueUrl)
        {
            var safeTitle = WebUtility.HtmlEncode(issueTitle);
            var safeName = WebUtility.HtmlEncode(assigneeName);
            var safeBy = WebUtility.HtmlEncode(reassignedByName);
            var safeVehicle = WebUtility.HtmlEncode(vehicleName);
            var safeSite = WebUtility.HtmlEncode(siteName);
            var safeDue = WebUtility.HtmlEncode(dueDate);
            var safePriority = WebUtility.HtmlEncode(priority);
            var safeNotes = WebUtility.HtmlEncode(notes ?? "");
            var safeUrl = WebUtility.HtmlEncode(issueUrl);

            var notesBlock = !string.IsNullOrWhiteSpace(notes)
                ? $@"
    <tr><td style=""padding:0 32px 20px;"">
      <div style=""background:#faf9f8;border:1px solid #edebe9;border-radius:4px;padding:16px;"">
        <span style=""display:block;font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;"">Reassignment Notes</span>
        <p style=""margin:0;font-size:14px;color:#323130;line-height:1.6;"">{safeNotes}</p>
      </div>
    </td></tr>"
                : "";

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1.0""></head>
<body style=""margin:0;padding:0;background:#f3f2f1;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;"">
<table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background:#f3f2f1;padding:32px 16px;"">
<tr><td align=""center"">
<table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:640px;background:#ffffff;border:1px solid #edebe9;border-radius:4px;"">

  <!-- Header -->
  <tr><td style=""padding:24px 32px 20px;border-bottom:1px solid #edebe9;"">
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%""><tr>
      <td style=""vertical-align:middle;"">
        <span style=""font-size:20px;font-weight:600;color:#323130;"">Hyoung FMS</span>
      </td>
      <td style=""text-align:right;vertical-align:middle;"">
        <span style=""display:inline-block;padding:4px 12px;background:#fff4ce;color:#835c00;font-size:12px;font-weight:600;border-radius:2px;letter-spacing:0.02em;"">REASSIGNED</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Title -->
  <tr><td style=""padding:24px 32px 8px;"">
    <a href=""{safeUrl}"" style=""font-size:18px;font-weight:600;color:#0078d4;text-decoration:none;line-height:1.4;"">{safeTitle}</a>
    <span style=""display:block;font-size:13px;color:#605e5c;margin-top:4px;"">Issue #{issueId}</span>
  </td></tr>

  <!-- Body -->
  <tr><td style=""padding:12px 32px 20px;"">
    <p style=""margin:0;font-size:14px;color:#323130;line-height:1.6;"">Hi <strong>{safeName}</strong>,</p>
    <p style=""margin:8px 0 0;font-size:14px;color:#605e5c;line-height:1.6;"">This issue has been <strong style=""color:#323130;"">reassigned to you</strong> by <strong>{safeBy}</strong>. Please review the details and take action.</p>
  </td></tr>

  <!-- Notes (conditional) -->
  {notesBlock}

  <!-- Details Grid -->
  <tr><td style=""padding:0 32px 24px;"">
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border:1px solid #edebe9;border-radius:4px;border-collapse:separate;"">
      <tr>
        <td style=""padding:12px 16px;border-bottom:1px solid #edebe9;width:50%;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Vehicle</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeVehicle}</span>
        </td>
        <td style=""padding:12px 16px;border-bottom:1px solid #edebe9;border-left:1px solid #edebe9;width:50%;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Site</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeSite}</span>
        </td>
      </tr>
      <tr>
        <td style=""padding:12px 16px;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Priority</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safePriority}</span>
        </td>
        <td style=""padding:12px 16px;border-left:1px solid #edebe9;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Due Date</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeDue}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Action Button -->
  <tr><td style=""padding:0 32px 28px;"" align=""center"">
    <a href=""{safeUrl}"" style=""display:inline-block;padding:10px 24px;background:#0078d4;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;"">View Issue</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style=""padding:16px 32px;background:#faf9f8;border-top:1px solid #edebe9;border-radius:0 0 4px 4px;"">
    <p style=""margin:0;font-size:12px;color:#a19f9d;text-align:center;line-height:1.5;"">This is an automated notification from <strong style=""color:#605e5c;"">Hyoung FMS</strong>. Do not reply to this email.</p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>";
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

        private static string FormatLocalDateTime(DateTime dateTime)
        {
            var utcDateTime = dateTime.Kind switch
            {
                DateTimeKind.Utc => dateTime,
                DateTimeKind.Local => dateTime.ToUniversalTime(),
                _ => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)
            };

            var localDateTime = utcDateTime.ToLocalTime();
            return localDateTime.ToString("yyyy-MM-dd hh:mm tt") + " (Local)";
        }
    }
}
