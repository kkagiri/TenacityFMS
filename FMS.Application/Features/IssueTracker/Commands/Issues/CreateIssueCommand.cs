/*
 * File: CreateIssueCommand.cs
 * Purpose: Create issue records and notify assigned worker through notification service
 * Dependencies: MediatR, GpsdataContext, INotificationService, IConfiguration
 * Last Modified: 2026-02-03
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
        private readonly IConfiguration _configuration;
        private readonly ILogger<IssueCreateCommandHandler> _logger;

        public IssueCreateCommandHandler(
            GpsdataContext context,
            INotificationService notificationService,
            IConfiguration configuration,
            ILogger<IssueCreateCommandHandler> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<int> Handle(CreateIssueCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Resolve usernames to user IDs
                string? openbyUserId = null;
                string? assignToUserId = null;
                User? openbyUser = null;
                User? assignToUser = null;

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

                // Find user by username for AssignTo field
                if (!string.IsNullOrEmpty(request.IssueTrackerDto.AssignTo))
                {
                    assignToUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.UserName == request.IssueTrackerDto.AssignTo, cancellationToken);
                    if (assignToUser != null)
                    {
                        assignToUserId = assignToUser.Id;
                    }
                    else
                    {
                        throw new Exception($"User '{request.IssueTrackerDto.AssignTo}' not found");
                    }
                }

                // Validate required fields
                if (string.IsNullOrEmpty(openbyUserId))
                {
                    throw new Exception("Openby user is required");
                }
                if (string.IsNullOrEmpty(assignToUserId))
                {
                    throw new Exception("AssignTo user is required");
                }

                // Map DTO to Entity
                Issuetracker issueEntity = new Issuetracker
                {
                    IssueCategoryId = request.IssueTrackerDto.IssueCategory,
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
                    IsAutoCreated = request.IssueTrackerDto.IsAutoCreated ?? false
                };

                await _context.Issuetrackers.AddAsync(issueEntity, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                await SendAssignmentNotificationAsync(
                    issueEntity,
                    request.IssueTrackerDto,
                    openbyUser,
                    assignToUser,
                    openbyUserId,
                    assignToUserId,
                    cancellationToken);

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
            User? assignToUser,
            string? openbyUserId,
            string? assignToUserId,
            CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(assignToUserId))
                {
                    return;
                }

                var frontendBaseUrl = GetFrontendBaseUrl();
                var responseUrl = $"{frontendBaseUrl}/issue-tracker/assignment/{issueEntity.Id}/respond";
                var confirmUrl = $"{responseUrl}?action=confirm";
                var scheduleUrl = $"{responseUrl}?action=schedule";
                var issueUrl = $"{frontendBaseUrl}/issue-tracker/edit/{issueEntity.Id}";
                var dueDateText = issueDto.DueDate?.ToString("yyyy-MM-dd") ?? "Not set";
                var assignedWorkerName = assignToUser?.UserName ?? "Assigned Worker";
                var assignedWorkerEmail = assignToUser?.Email ?? "N/A";
                var systemMessage = "You have been assigned this issue.";
                var emailBodyHtml = BuildAssignmentEmailHtmlMessage(
                    issueEntity.Id,
                    issueEntity.ProblemTitle,
                    dueDateText,
                    assignedWorkerName,
                    assignedWorkerEmail,
                    confirmUrl,
                    scheduleUrl,
                    issueUrl);

                var notificationPriority = await ResolveNotificationPriorityAsync(issueDto.Priority, cancellationToken);

                var notificationRequest = new CreateNotificationRequest
                {
                    Type = NotificationType.Alert,
                    CategoryId = (int)WellKnownCategories.IssueTracker,
                    Priority = notificationPriority,
                    Title = $"Issue Assigned: {issueEntity.ProblemTitle}",
                    Message = systemMessage,
                    Data = new
                    {
                        IssueId = issueEntity.Id,
                        IssueTitle = issueEntity.ProblemTitle,
                        DueDate = issueDto.DueDate,
                        AssignedToUserId = assignToUserId,
                        AssignedToUserName = assignedWorkerName,
                        AssignedToEmail = assignedWorkerEmail,
                        AssignmentResponseUrl = responseUrl,
                        AssignmentConfirmUrl = confirmUrl,
                        AssignmentScheduleUrl = scheduleUrl,
                        IssueUrl = issueUrl,
                        EmailBodyHtml = emailBodyHtml
                    },
                    TriggerSource = "IssueTrackerAssignment",
                    TriggeredBy = openbyUserId ?? openbyUser?.UserName ?? "System",
                    SiteId = issueEntity.SiteId,
                    VehicleId = issueEntity.VehicleId,
                    IssueTrackerId = issueEntity.Id,
                    Recipients = new List<NotificationRecipientDto>
                    {
                        new()
                        {
                            UserId = assignToUserId,
                            DeliveryMethods = new List<string> { "Email", "System" },
                            ResolvedFrom = "IssueAssignment"
                        }
                    },
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
            string dueDateText,
            string assignedWorkerName,
            string assignedWorkerEmail,
            string confirmUrl,
            string scheduleUrl,
            string issueUrl)
        {
            var safeIssueTitle = WebUtility.HtmlEncode(issueTitle);
            var safeWorkerName = WebUtility.HtmlEncode(assignedWorkerName);
            var safeWorkerEmail = WebUtility.HtmlEncode(assignedWorkerEmail);
            var safeDueDate = WebUtility.HtmlEncode(dueDateText);
            var safeConfirmUrl = WebUtility.HtmlEncode(confirmUrl);
            var safeScheduleUrl = WebUtility.HtmlEncode(scheduleUrl);
            var safeIssueUrl = WebUtility.HtmlEncode(issueUrl);

            return $@"
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;margin:8px 0 12px;"">
                  <tr>
                    <td style=""padding:16px 18px;"">
                      <div style=""font-size:12px;color:#64748b;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;"">Issue Assignment</div>
                      <div style=""font-size:18px;color:#111827;font-weight:700;margin-top:6px;"">Issue #{issueId}: {safeIssueTitle}</div>
                      <div style=""font-size:13px;color:#475569;margin-top:8px;"">
                        You have been assigned this issue in <strong>Hyoung FMS</strong>. Please confirm your work or schedule your start date before the due date.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style=""padding:0 18px 8px;"">
                      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""font-size:13px;color:#334155;background:#f8fafc;border-radius:8px;"">
                        <tr>
                          <td style=""padding:10px 12px;width:150px;color:#64748b;"">Assigned Worker</td>
                          <td style=""padding:10px 12px;font-weight:600;"">{safeWorkerName} ({safeWorkerEmail})</td>
                        </tr>
                        <tr>
                          <td style=""padding:10px 12px;width:150px;color:#64748b;"">Due Date</td>
                          <td style=""padding:10px 12px;font-weight:600;"">{safeDueDate}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style=""padding:8px 18px 16px;"">
                      <a href=""{safeConfirmUrl}"" style=""display:inline-block;padding:10px 14px;margin:0 8px 8px 0;background:#059669;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;"">Confirm I Am Working</a>
                      <a href=""{safeScheduleUrl}"" style=""display:inline-block;padding:10px 14px;margin:0 8px 8px 0;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;"">Schedule Working Date</a>
                      <a href=""{safeIssueUrl}"" style=""display:inline-block;padding:10px 14px;margin:0 8px 8px 0;background:#ffffff;color:#1f2937;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;border:1px solid #d1d5db;"">Open Issue</a>
                    </td>
                  </tr>
                </table>";
        }
    }
}
