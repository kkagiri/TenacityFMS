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

                // Log issue creation activity
                await _activityService.LogIssueCreatedAsync(
                    issueEntity.Id,
                    openbyUserId!,
                    openbyUser?.UserName ?? request.IssueTrackerDto.Openby,
                    cancellationToken);

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

                // Fetch vehicle and site details for the email
                string? vehicleName = null;
                string? siteName = null;

                if (issueEntity.VehicleId > 0)
                {
                    vehicleName = await _context.Vehicles
                        .Where(v => v.VehicleId == issueEntity.VehicleId)
                        .Select(v => v.HyoungNo ?? v.NumberPlate ?? $"Vehicle #{v.VehicleId}")
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
                    vehicleName,
                    siteName,
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
            string? vehicleName,
            string? siteName,
            string confirmUrl,
            string scheduleUrl,
            string issueUrl)
        {
            var safeIssueTitle = WebUtility.HtmlEncode(issueTitle);
            var safeWorkerName = WebUtility.HtmlEncode(assignedWorkerName);
            var safeWorkerEmail = WebUtility.HtmlEncode(assignedWorkerEmail);
            var safeDueDate = WebUtility.HtmlEncode(dueDateText);
            var safeVehicleName = WebUtility.HtmlEncode(vehicleName ?? "Not specified");
            var safeSiteName = WebUtility.HtmlEncode(siteName ?? "Not specified");
            var safeConfirmUrl = WebUtility.HtmlEncode(confirmUrl);
            var safeScheduleUrl = WebUtility.HtmlEncode(scheduleUrl);
            var safeIssueUrl = WebUtility.HtmlEncode(issueUrl);

            return $@"
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;"">
                  <!-- Header -->
                  <tr>
                    <td style=""padding:24px 24px 16px;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);border-radius:12px 12px 0 0;"">
                      <div style=""font-size:11px;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;"">
                        <span style=""display:inline-block;background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;"">Issue Assignment</span>
                      </div>
                      <div style=""font-size:22px;color:#ffffff;font-weight:700;line-height:1.3;"">Issue #{issueId}: {safeIssueTitle}</div>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style=""padding:0;background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"">
                      <!-- Message -->
                      <div style=""padding:20px 24px;border-bottom:1px solid #f3f4f6;"">
                        <p style=""margin:0;font-size:15px;color:#374151;line-height:1.6;"">
                          You have been assigned this issue in <strong style=""color:#1e40af;"">Hyoung FMS</strong>. Please confirm your availability or schedule your start date before the due date.
                        </p>
                      </div>

                      <!-- Details Grid -->
                      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-collapse:collapse;"">
                        <tr>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">
                              <span style=""display:inline-block;margin-right:6px;"">👤</span>Assigned To
                            </div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeWorkerName}</div>
                            <div style=""font-size:13px;color:#6b7280;"">{safeWorkerEmail}</div>
                          </td>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">
                              <span style=""display:inline-block;margin-right:6px;"">📅</span>Due Date
                            </div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeDueDate}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">
                              <span style=""display:inline-block;margin-right:6px;"">🚗</span>Vehicle
                            </div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeVehicleName}</div>
                          </td>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">
                              <span style=""display:inline-block;margin-right:6px;"">📍</span>Site/Location
                            </div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeSiteName}</div>
                          </td>
                        </tr>
                      </table>

                      <!-- Action Buttons - Improved Layout -->
                      <div style=""padding:24px;text-align:center;"">
                        <!-- Primary Action -->
                        <div style=""margin-bottom:12px;"">
                          <a href=""{safeConfirmUrl}"" style=""display:inline-block;width:100%;max-width:280px;padding:16px 24px;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 6px rgba(5,150,105,0.25);text-align:center;"">
                            ✓ Accept &amp; Start Working
                          </a>
                        </div>
                        <!-- Secondary Actions Row -->
                        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" style=""margin:0 auto;"">
                          <tr>
                            <td style=""padding-right:8px;"">
                              <a href=""{safeScheduleUrl}"" style=""display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#2563eb 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 6px rgba(37,99,235,0.25);"">
                                📆 Schedule Date
                              </a>
                            </td>
                            <td>
                              <a href=""{safeIssueUrl}"" style=""display:inline-block;padding:12px 20px;background:#ffffff;color:#374151;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;border:2px solid #d1d5db;"">
                                View Details →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style=""padding:16px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center;"">
                      <p style=""margin:0;font-size:12px;color:#6b7280;"">
                        This is an automated notification from <strong>Hyoung Fleet Management System</strong>.<br/>
                        Please do not reply directly to this email.
                      </p>
                    </td>
                  </tr>
                </table>";
        }
    }
}
