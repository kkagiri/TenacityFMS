/*
 * File: CreateIssueCommand.cs
 * Purpose: Create issue records and notify assigned worker through notification service
 * Dependencies: MediatR, GpsdataContext, INotificationService, IConfiguration
 * Last Modified: 2026-02-16
 *
 * CRITICAL FIX: Explicitly sets CanAutoClose/IsAutoCreated values to avoid EF value-generation issues.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Issuetracker;
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

namespace FMS.Application.Features.IssueTracker.Commands.Issues
{
  public record CreateIssueCommand(IssueTrackerDTO IssueTrackerDto) : IRequest<int>;

  public class IssueCreateCommandHandler : IRequestHandler<CreateIssueCommand, int>
  {
    private readonly GpsdataContext _context;
    private readonly INotificationService _notificationService;
    private readonly IIssueActivityService _activityService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IssueCreateCommandHandler> _logger;

    public IssueCreateCommandHandler(
        GpsdataContext context,
        INotificationService notificationService,
        IIssueActivityService activityService,
        IConfiguration configuration,
        ILogger<IssueCreateCommandHandler> logger)
    {
      _context = context;
      _notificationService = notificationService;
      _activityService = activityService;
      _configuration = configuration;
      _logger = logger;
    }

    public async Task<int> Handle(CreateIssueCommand request, CancellationToken cancellationToken)
    {
      try
      {
        var normalizedCategoryTags = NormalizeCategoryTags(request.IssueTrackerDto.IssueCategoryTags, request.IssueTrackerDto.IssueCategory);

        // Resolve usernames to user IDs
        string? openbyUserId = null;
        User? openbyUser = null;
        var assignToUsers = new List<User>();

        // Find user by username for Openby field
        if (!string.IsNullOrEmpty(request.IssueTrackerDto.Openby))
        {
          openbyUser = await _context.Users
              .FirstOrDefaultAsync(u => u.UserName == request.IssueTrackerDto.Openby, cancellationToken);
          if (openbyUser != null)
          {
            openbyUserId = openbyUser.Id;
          }
          else
          {
            throw new Exception($"User '{request.IssueTrackerDto.Openby}' not found");
          }
        }

        // Find users by username(s) for AssignTo field.
        // Supports comma/semicolon separated usernames for multiple assignees.
        var requestedAssignees = ParseAssignees(request.IssueTrackerDto.AssignTo);
        if (requestedAssignees.Count > 0)
        {
          assignToUsers = await _context.Users
              .Where(u => requestedAssignees.Contains(u.UserName))
              .ToListAsync(cancellationToken);

          var foundUserNames = assignToUsers
              .Select(u => u.UserName)
              .Where(userName => !string.IsNullOrWhiteSpace(userName))
              .ToHashSet(StringComparer.OrdinalIgnoreCase);

          var missingAssignees = requestedAssignees
              .Where(assignee => !foundUserNames.Contains(assignee))
              .ToList();

          if (missingAssignees.Count > 0)
          {
            throw new Exception($"Assignee(s) not found: {string.Join(", ", missingAssignees)}");
          }
        }

        // Validate required fields
        if (string.IsNullOrEmpty(openbyUserId))
        {
          throw new Exception("Openby user is required");
        }
        if (assignToUsers.Count == 0)
        {
          throw new Exception("At least one AssignTo user is required");
        }

        var primaryAssignee = assignToUsers[0];
        var assignToUserId = primaryAssignee.Id;

        // Validate and truncate field lengths to prevent DB overflow
        if (!string.IsNullOrEmpty(request.IssueTrackerDto.ProblemTitle) && request.IssueTrackerDto.ProblemTitle.Length > 255)
        {
          _logger.LogWarning("ProblemTitle truncated from {OriginalLength} to 255 characters", request.IssueTrackerDto.ProblemTitle.Length);
          request.IssueTrackerDto.ProblemTitle = request.IssueTrackerDto.ProblemTitle[..255];
        }
        if (!string.IsNullOrEmpty(request.IssueTrackerDto.ProblemDescription) && request.IssueTrackerDto.ProblemDescription.Length > 2000)
        {
          _logger.LogWarning("ProblemDescription truncated from {OriginalLength} to 2000 characters", request.IssueTrackerDto.ProblemDescription.Length);
          request.IssueTrackerDto.ProblemDescription = request.IssueTrackerDto.ProblemDescription[..2000];
        }

        // Map DTO to Entity
        Issuetracker issueEntity = new Issuetracker
        {
          IssueCategoryId = ResolvePrimaryCategory(normalizedCategoryTags, request.IssueTrackerDto.IssueCategory),
          IssueTemplateId = request.IssueTrackerDto.IssueTemplateId,
          DeviceTypeId = request.IssueTrackerDto.DeviceTypeId ?? request.IssueTrackerDto.DeviceType,
          SiteId = request.IssueTrackerDto.Site,
          Openby = openbyUserId,
          RelatedIssue = request.IssueTrackerDto.RelatedIssue,
          ProblemDescription = request.IssueTrackerDto.ProblemDescription,
          ProblemTitle = request.IssueTrackerDto.ProblemTitle,
          Status = request.IssueTrackerDto.Status,
          Priority = request.IssueTrackerDto.Priority,
          DueDate = request.IssueTrackerDto.DueDate,
          OpenDate = request.IssueTrackerDto.OpenDate ?? DateTime.UtcNow,
          ClosingDate = request.IssueTrackerDto.ClosingDate,
          LastModfield = DateTime.UtcNow,
          VehicleId = request.IssueTrackerDto.Vehicle,
          //DeviceId = request.IssueTrackerDto.Device,
          DeviceType = request.IssueTrackerDto.DeviceType,
          AssignTo = assignToUserId,
          CanAutoClose = request.IssueTrackerDto.CanAutoClose ?? false,
          IsAutoCreated = request.IssueTrackerDto.IsAutoCreated ?? false,
          CompletionNotes = string.IsNullOrWhiteSpace(request.IssueTrackerDto.CompletionNotes) ? null : request.IssueTrackerDto.CompletionNotes.Trim()
        };

        await _context.Issuetrackers.AddAsync(issueEntity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        await ReplaceIssueTagsAsync(issueEntity.Id, normalizedCategoryTags, cancellationToken);

        await PersistIssueAssigneesAsync(
          issueEntity.Id,
          openbyUserId,
          assignToUsers,
          cancellationToken);

        // Log issue creation activity
        await _activityService.LogIssueCreatedAsync(
            issueEntity.Id,
            openbyUserId!,
            openbyUser?.UserName ?? request.IssueTrackerDto.Openby,
            cancellationToken);

        // If created with Complete status, log completion activity with notes
        if (!string.IsNullOrWhiteSpace(issueEntity.CompletionNotes))
        {
          var performerName = openbyUser?.UserName ?? request.IssueTrackerDto.Openby ?? "System";
          await _activityService.LogActivityAsync(
              issueEntity.Id,
              "Completed",
              $"{performerName} created issue as complete: {issueEntity.CompletionNotes.Trim()}",
              openbyUserId!,
              performerName,
              fieldName: "CompletionNotes",
              oldValue: null,
              newValue: issueEntity.CompletionNotes.Trim(),
              cancellationToken: cancellationToken);
        }

        // Only send assignment notification for today's or future issues
        // Past issues (field agents logging completed work) skip notification
        var issueDate = issueEntity.OpenDate?.Date ?? DateTime.UtcNow.Date;
        var today = DateTime.UtcNow.Date;

        if (issueDate >= today)
        {
          await SendAssignmentNotificationAsync(
              issueEntity,
              request.IssueTrackerDto,
              openbyUser,
            assignToUsers,
              openbyUserId,
              cancellationToken);
        }
        else
        {
          _logger.LogInformation(
              "Skipping assignment notification for past issue {IssueId} (open date: {OpenDate})",
              issueEntity.Id, issueDate);
        }

        return issueEntity.Id;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating issue");
        throw new Exception("Error creating issue", ex);
      }
    }

    private async Task SendAssignmentNotificationAsync(
        Issuetracker issueEntity,
        IssueTrackerDTO issueDto,
        User? openbyUser,
        List<User> assignToUsers,
        string? openbyUserId,
        CancellationToken cancellationToken)
    {
      try
      {
        if (assignToUsers == null || assignToUsers.Count == 0)
        {
          return;
        }

        var primaryAssignee = assignToUsers[0];
        var assignToUserId = primaryAssignee.Id;

        // Fetch vehicle and site details for the email
        string? vehicleName = null;
        string? siteName = null;

        if (issueEntity.VehicleId > 0)
        {
          vehicleName = await _context.Vehicles
              .Where(v => v.VehicleId == issueEntity.VehicleId)
              .Select(v => v.VehicleCode ?? v.NumberPlate ?? $"Vehicle #{v.VehicleId}")
              .FirstOrDefaultAsync(cancellationToken);
        }

        if (issueEntity.SiteId > 0)
        {
          siteName = await _context.Sites
              .Where(s => s.Id == issueEntity.SiteId)
              .Select(s => s.Name)
              .FirstOrDefaultAsync(cancellationToken);
        }

        var frontendBaseUrl = GetFrontendBaseUrl();
        var responseUrl = $"{frontendBaseUrl}/issue-tracker/assignment/{issueEntity.Id}/respond";
        var confirmUrl = $"{responseUrl}?action=confirm";
        var scheduleUrl = $"{responseUrl}?action=schedule";
        var issueUrl = $"{frontendBaseUrl}/issue-tracker/details/{issueEntity.Id}";
        var assignedWorkerName = primaryAssignee?.UserName ?? "Assigned Worker";
        var assignedWorkerEmail = primaryAssignee?.Email ?? "N/A";
        var allAssigneeNames = assignToUsers
            .Select(user => user.UserName)
            .Where(userName => !string.IsNullOrWhiteSpace(userName))
            .ToList();
        var allAssigneeNamesText = allAssigneeNames.Count > 0
          ? string.Join(", ", allAssigneeNames)
          : assignedWorkerName;
        var vehicleLabel = !string.IsNullOrWhiteSpace(vehicleName) ? $"[{vehicleName}] " : "";
        var systemMessage = allAssigneeNames.Count > 1
            ? $"Issue has been assigned to multiple users ({string.Join(", ", allAssigneeNames)}). Click here to view details."
            : "You have been assigned this issue. Click here to view details.";

        var priorityName = await _context.Issuepriorities
          .AsNoTracking()
          .Where(p => issueEntity.Priority.HasValue && p.Id == issueEntity.Priority.Value)
          .Select(p => p.Name)
          .FirstOrDefaultAsync(cancellationToken) ?? "Medium";

        var categoryName = await _context.Issuecategories
          .AsNoTracking()
          .Where(c => c.Id == issueEntity.IssueCategoryId)
          .Select(c => c.Name)
          .FirstOrDefaultAsync(cancellationToken) ?? "Issue";

        var issueTypeLabel = "Issue Assignment";
        var createdAt = issueEntity.OpenDate ?? DateTime.UtcNow;
        var createdAtLocalText = FormatLocalDateTime(createdAt);
        var dueDateLocalText = issueDto.DueDate.HasValue ? FormatLocalDateTime(issueDto.DueDate.Value) : null;

        var emailBodyHtml = BuildAssignmentEmailHtmlMessage(
            issueEntity.Id,
            issueEntity.ProblemTitle,
          issueEntity.ProblemDescription,
          issueTypeLabel,
          priorityName,
          categoryName,
            assignedWorkerName,
            assignedWorkerEmail,
            vehicleName,
            siteName,
          allAssigneeNamesText,
            createdAtLocalText,
            issueUrl,
            responseUrl);

        var notificationPriority = await ResolveNotificationPriorityAsync(issueDto.Priority, cancellationToken);

        var issueLink = NotificationLinkBuilder.ForIssue(issueEntity.Id);
        var notificationRequest = new CreateNotificationRequest
        {
          Type = NotificationType.Alert,
          CategoryId = (int)WellKnownCategories.IssueTracker,
          Priority = notificationPriority,
          Title = $"Issue Assigned: {vehicleLabel}{issueEntity.ProblemTitle}",
          Message = systemMessage,
          Link = issueLink.Link,
          LinkLabel = issueLink.Label,
          Data = new
          {
            IssueId = issueEntity.Id,
            IssueTitle = issueEntity.ProblemTitle,
            ActionUrl = issueUrl,
            DueDate = issueDto.DueDate,
            AssignedToUserId = assignToUserId,
            AssignedToUserName = assignedWorkerName,
            AssignedToUserNames = allAssigneeNames,
            AssignedToEmail = assignedWorkerEmail,
            AssignmentResponseUrl = responseUrl,
            AssignmentConfirmUrl = confirmUrl,
            AssignmentScheduleUrl = scheduleUrl,
            IssueUrl = issueUrl,
            CreatedAtLocal = createdAtLocalText,
            DueDateLocal = dueDateLocalText,
            EmailBodyHtml = emailBodyHtml
          },
          TriggerSource = "IssueTrackerAssignment",
          TriggeredBy = openbyUserId ?? openbyUser?.UserName ?? "System",
          SiteId = issueEntity.SiteId,
          VehicleId = issueEntity.VehicleId,
          IssueTrackerId = issueEntity.Id,
          Recipients = assignToUsers
                .Where(user => !string.IsNullOrWhiteSpace(user.Id))
                .Select(user => new NotificationRecipientDto
                {
                  UserId = user.Id,
                  DeliveryMethods = new List<string> { "Email", "System" },
                  ResolvedFrom = "IssueAssignment"
                })
                .GroupBy(recipient => recipient.UserId)
                .Select(group => group.First())
                .ToList(),
          DisableFallbackAllUsers = true
        };

        var notificationResult = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);
        if (!notificationResult.IsSuccess)
        {
          _logger.LogWarning(
              "Issue {IssueId} created but assignment notification failed: {Message}",
              issueEntity.Id,
              notificationResult.Message);
        }
      }
      catch (Exception ex)
      {
        _logger.LogWarning(ex, "Failed to send assignment notification for issue {IssueId}", issueEntity.Id);
      }
    }

    private async Task<NotificationPriority> ResolveNotificationPriorityAsync(int? issuePriorityId, CancellationToken cancellationToken)
    {
      if (!issuePriorityId.HasValue)
      {
        return NotificationPriority.Medium;
      }

      var priorityName = await _context.Issuepriorities
          .Where(p => p.Id == issuePriorityId.Value)
          .Select(p => p.Name)
          .FirstOrDefaultAsync(cancellationToken);

      if (string.IsNullOrWhiteSpace(priorityName))
      {
        return NotificationPriority.Medium;
      }

      if (priorityName.Contains("critical", StringComparison.OrdinalIgnoreCase))
      {
        return NotificationPriority.Critical;
      }

      if (priorityName.Contains("high", StringComparison.OrdinalIgnoreCase))
      {
        return NotificationPriority.High;
      }

      if (priorityName.Contains("low", StringComparison.OrdinalIgnoreCase))
      {
        return NotificationPriority.Low;
      }

      return NotificationPriority.Medium;
    }

    private static List<int> NormalizeCategoryTags(List<int>? issueCategoryTags, int fallbackCategoryId)
    {
      var tags = (issueCategoryTags ?? new List<int>())
        .Where(tagId => tagId > 0)
        .Distinct()
        .ToList();

      if (tags.Count == 0 && fallbackCategoryId > 0)
      {
        tags.Add(fallbackCategoryId);
      }

      return tags;
    }

    private static int ResolvePrimaryCategory(List<int> normalizedTags, int fallbackCategoryId)
    {
      if (normalizedTags.Count > 0)
      {
        return normalizedTags[0];
      }

      return fallbackCategoryId;
    }

    private async Task ReplaceIssueTagsAsync(int issueId, List<int> categoryTags, CancellationToken cancellationToken)
    {
      await _context.Database.ExecuteSqlRawAsync(
        "DELETE FROM issuetracker_tags WHERE IssueID = {0}",
        new object[] { issueId },
        cancellationToken);

      if (categoryTags.Count == 0)
      {
        return;
      }

      foreach (var tagId in categoryTags)
      {
        await _context.Database.ExecuteSqlRawAsync(
          "INSERT IGNORE INTO issuetracker_tags (IssueID, IssueCategoryID) VALUES ({0}, {1})",
          new object[] { issueId, tagId },
          cancellationToken);
      }
    }

    private string GetFrontendBaseUrl()
    {
      var configuredBaseUrl = _configuration["IssueTracker:FrontendBaseUrl"]
          ?? _configuration["Frontend:BaseUrl"]
          ?? _configuration["App:FrontendBaseUrl"];

      if (string.IsNullOrWhiteSpace(configuredBaseUrl))
      {
        throw new InvalidOperationException(
            "Frontend base URL is not configured. Set 'IssueTracker:FrontendBaseUrl' (or 'Frontend:BaseUrl') in appsettings or environment variables.");
      }

      return configuredBaseUrl.TrimEnd('/');
    }

    private static string BuildAssignmentEmailHtmlMessage(
        int issueId,
        string issueTitle,
        string issueDescription,
        string issueTypeLabel,
        string priorityName,
        string categoryName,
        string assignedWorkerName,
        string assignedWorkerEmail,
        string? vehicleName,
        string? siteName,
        string allAssigneeNames,
        string issueTimeLocal,
        string issueUrl,
        string? responseUrl = null)
    {
      var safeTitle = WebUtility.HtmlEncode(issueTitle);
      var safeDesc = WebUtility.HtmlEncode(issueDescription);
      var safeType = WebUtility.HtmlEncode(issueTypeLabel);
      var safePriority = WebUtility.HtmlEncode(priorityName);
      var safeCategory = WebUtility.HtmlEncode(categoryName);
      var safeName = WebUtility.HtmlEncode(assignedWorkerName);
      var safeEmail = WebUtility.HtmlEncode(assignedWorkerEmail);
      var safeVehicle = WebUtility.HtmlEncode(vehicleName ?? "Not specified");
      var safeSite = WebUtility.HtmlEncode(siteName ?? "Not specified");
      var safeAllAssignees = WebUtility.HtmlEncode(allAssigneeNames);
      var safeTime = WebUtility.HtmlEncode(issueTimeLocal);
      var safeUrl = WebUtility.HtmlEncode(issueUrl);
      var safeRespUrl = !string.IsNullOrWhiteSpace(responseUrl)
          ? WebUtility.HtmlEncode(responseUrl) : null;

      var respondButton = safeRespUrl != null
          ? $@"<a href=""{safeRespUrl}"" style=""display:inline-block;padding:10px 24px;border:1px solid #d1d1d1;color:#323130;background:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;margin-left:8px;"">Respond</a>"
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
        <span style=""font-size:20px;font-weight:600;color:#323130;"">Tenacy FMS</span>
      </td>
      <td style=""text-align:right;vertical-align:middle;"">
        <span style=""display:inline-block;padding:4px 12px;background:#e5f1fb;color:#0078d4;font-size:12px;font-weight:600;border-radius:2px;letter-spacing:0.02em;"">NEW ASSIGNMENT</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Title -->
  <tr><td style=""padding:24px 32px 8px;"">
    <a href=""{safeUrl}"" style=""font-size:18px;font-weight:600;color:#0078d4;text-decoration:none;line-height:1.4;"">{safeTitle}</a>
    <span style=""display:block;font-size:13px;color:#605e5c;margin-top:4px;"">Issue #{issueId} &middot; {safeType}</span>
  </td></tr>

  <!-- Body -->
  <tr><td style=""padding:12px 32px 20px;"">
    <p style=""margin:0;font-size:14px;color:#323130;line-height:1.6;"">Hi <strong>{safeName}</strong>,</p>
    <p style=""margin:8px 0 0;font-size:14px;color:#605e5c;line-height:1.6;"">An issue has been assigned to you. Please review the details below and take appropriate action.</p>
  </td></tr>

  <!-- Description -->
  <tr><td style=""padding:0 32px 20px;"">
    <div style=""background:#faf9f8;border:1px solid #edebe9;border-radius:4px;padding:16px;"">
      <span style=""display:block;font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;"">Description</span>
      <p style=""margin:0;font-size:14px;color:#323130;line-height:1.6;"">{safeDesc}</p>
    </div>
  </td></tr>

  <!-- Details Grid -->
  <tr><td style=""padding:0 32px 24px;"">
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border:1px solid #edebe9;border-radius:4px;border-collapse:separate;"">
      <tr>
        <td style=""padding:12px 16px;border-bottom:1px solid #edebe9;width:50%;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Priority</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safePriority}</span>
        </td>
        <td style=""padding:12px 16px;border-bottom:1px solid #edebe9;border-left:1px solid #edebe9;width:50%;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Category</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeCategory}</span>
        </td>
      </tr>
      <tr>
        <td style=""padding:12px 16px;border-bottom:1px solid #edebe9;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Vehicle</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeVehicle}</span>
        </td>
        <td style=""padding:12px 16px;border-bottom:1px solid #edebe9;border-left:1px solid #edebe9;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Site</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeSite}</span>
        </td>
      </tr>
      <tr>
        <td style=""padding:12px 16px;border-bottom:1px solid #edebe9;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Assigned To</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeName}</span>
          <span style=""display:block;font-size:12px;color:#a19f9d;"">{safeEmail}</span>
        </td>
        <td style=""padding:12px 16px;border-bottom:1px solid #edebe9;border-left:1px solid #edebe9;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">Due Date</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeTime}</span>
        </td>
      </tr>
      <tr>
        <td colspan=""2"" style=""padding:12px 16px;"">
          <span style=""display:block;font-size:11px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;"">All Assignees</span>
          <span style=""font-size:14px;color:#323130;font-weight:600;"">{safeAllAssignees}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Action Buttons -->
  <tr><td style=""padding:0 32px 28px;"" align=""center"">
    <a href=""{safeUrl}"" style=""display:inline-block;padding:10px 24px;background:#0078d4;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;"">View Issue</a>
    {respondButton}
  </td></tr>

  <!-- Footer -->
  <tr><td style=""padding:16px 32px;background:#faf9f8;border-top:1px solid #edebe9;border-radius:0 0 4px 4px;"">
    <p style=""margin:0;font-size:12px;color:#a19f9d;text-align:center;line-height:1.5;"">This is an automated notification from <strong style=""color:#605e5c;"">Tenacy FMS</strong>. Do not reply to this email.</p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>";
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

    private async Task PersistIssueAssigneesAsync(
      int issueId,
      string? assignedFromUserId,
      List<User> assignees,
      CancellationToken cancellationToken)
    {
      if (issueId <= 0 || assignees == null || assignees.Count == 0)
      {
        return;
      }

      var assignedFrom = !string.IsNullOrWhiteSpace(assignedFromUserId)
        ? assignedFromUserId
        : assignees[0].Id;

      var existingRows = await _context.Issueassignmenttrackers
        .Where(row => row.Issue == issueId)
        .ToListAsync(cancellationToken);

      if (existingRows.Count > 0)
      {
        _context.Issueassignmenttrackers.RemoveRange(existingRows);
        await _context.SaveChangesAsync(cancellationToken);
      }

      var startId = await _context.Issueassignmenttrackers
        .Select(row => (int?)row.Id)
        .MaxAsync(cancellationToken) ?? 0;

      var nextId = startId;
      var rows = assignees
        .Where(user => !string.IsNullOrWhiteSpace(user.Id))
        .Select(user => new Issueassignmenttracker
        {
          Id = ++nextId,
          Issue = issueId,
          AssignedFrom = assignedFrom,
          AssignedTo = user.Id,
          AssignedDate = DateTime.UtcNow
        })
        .ToList();

      if (rows.Count == 0)
      {
        return;
      }

      await _context.Issueassignmenttrackers.AddRangeAsync(rows, cancellationToken);
      await _context.SaveChangesAsync(cancellationToken);
    }

    private static List<string> ParseAssignees(string? assignToValue)
    {
      if (string.IsNullOrWhiteSpace(assignToValue))
      {
        return new List<string>();
      }

      return assignToValue
        .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        .Select(userName => userName.Trim())
        .Where(userName => !string.IsNullOrWhiteSpace(userName))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();
    }
  }
}
