/**
 * File: CompleteIssueWithActionsCommandHandler.cs
 * Purpose: Handles structured issue completion — creates completion records, marks issue complete, notifies opener
 * Dependencies: MediatR, GpsdataContext, INotificationService, IIssueActivityService, IConfiguration
 * Last Modified: 2026-04-23
 *
 * Key Functions:
 * - Handle: Validates issue, creates completion records, updates status, sends notification
 * - BuildAutoSummary: Generates backward-compatible CompletionNotes from structured records
 * - SendCompletionNotificationAsync: Sends email+system notification to the issue opener
 * - BuildCompletionEmailHtml: Renders a styled HTML email with completion details
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
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
    public class CompleteIssueWithActionsCommandHandler
        : IRequestHandler<CompleteIssueWithActionsCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly IIssueActivityService _activityService;
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CompleteIssueWithActionsCommandHandler> _logger;

        public CompleteIssueWithActionsCommandHandler(
            GpsdataContext context,
            IIssueActivityService activityService,
            INotificationService notificationService,
            IConfiguration configuration,
            ILogger<CompleteIssueWithActionsCommandHandler> logger)
        {
            _context = context;
            _activityService = activityService;
            _notificationService = notificationService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(
            CompleteIssueWithActionsCommand command,
            CancellationToken cancellationToken)
        {
            try
            {
                var request = command.Request;

                // Validate: completion now requires at least one structured action.
                if (request.Actions == null || request.Actions.Count == 0)
                {
                    return FMSResponse<bool>.Failed(
                        "At least one completion action is required.");
                }

                // Ensure notes columns exist
                await IssueNotesSchemaGuard.EnsureColumnsExistAsync(_context, _logger, cancellationToken);

                // Fetch issue
                var issue = await _context.Issuetrackers
                    .FirstOrDefaultAsync(i => i.Id == command.IssueId, cancellationToken);

                if (issue == null)
                {
                    return FMSResponse<bool>.Failed(
                        $"Issue with ID {command.IssueId} not found.");
                }

                // Find the "Complete" status
                var completeStatus = await _context.Issuestatuses
                    .Where(s => s.Status != null &&
                        (s.Status.ToLower().Contains("complete") ||
                         s.Status.ToLower().Contains("closed") ||
                         s.Status.ToLower().Contains("resolved") ||
                         s.Status.ToLower().Contains("done")))
                    .FirstOrDefaultAsync(cancellationToken);

                if (completeStatus == null)
                {
                    return FMSResponse<bool>.Failed(
                        "No 'Complete' or 'Closed' status found in the system.");
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

                // Capture old status for activity logging
                var oldStatusName = await GetStatusNameAsync(issue.Status, cancellationToken) ?? "Unknown";

                // === Create completion records ===
                var completionRecords = new List<IssueCompletionRecord>();
                var now = DateTime.UtcNow;
                var requestedTemplateActionIds = request.Actions
                    .Where(action => action.TemplateActionId.HasValue)
                    .Select(action => action.TemplateActionId!.Value)
                    .Distinct()
                    .ToList();

                var templateActionsById = requestedTemplateActionIds.Count == 0
                    ? new Dictionary<int, IssueTemplateAction>()
                    : await _context.IssueTemplateActions
                        .Include(action => action.Stage)
                            .ThenInclude(stage => stage!.Workflow)
                        .Where(action => requestedTemplateActionIds.Contains(action.Id))
                        .ToDictionaryAsync(action => action.Id, cancellationToken);

                if (request.Actions != null && request.Actions.Count > 0)
                {
                    foreach (var action in request.Actions)
                    {
                        IssueTemplateAction? templateAction = null;

                        // Resolve action name
                        string actionName;
                        if (action.TemplateActionId.HasValue)
                        {
                            templateActionsById.TryGetValue(action.TemplateActionId.Value, out templateAction);

                            if (templateAction == null)
                            {
                                return FMSResponse<bool>.Failed(
                                    $"Template action with ID {action.TemplateActionId.Value} not found.");
                            }

                            var actionOwnershipError = ValidateTemplateActionSelection(templateAction, issue.IssueTemplateId);
                            if (!string.IsNullOrWhiteSpace(actionOwnershipError))
                            {
                                return FMSResponse<bool>.Failed(actionOwnershipError);
                            }

                            actionName = templateAction.Name;
                        }
                        else
                        {
                            // "Other" action — free text name is required
                            if (string.IsNullOrWhiteSpace(action.ActionName))
                            {
                                return FMSResponse<bool>.Failed(
                                    "ActionName is required when no TemplateActionId is provided (Other action).");
                            }
                            actionName = action.ActionName.Trim();
                        }

                        var validationMessage = ValidateCompletionAction(action, actionName, templateAction?.ActionType);
                        if (!string.IsNullOrWhiteSpace(validationMessage))
                        {
                            return FMSResponse<bool>.Failed(validationMessage);
                        }

                        // Assign ID using max+1 pattern
                        var maxId = await _context.IssueCompletionRecords
                            .MaxAsync(r => (int?)r.Id, cancellationToken) ?? 0;

                        var record = new IssueCompletionRecord
                        {
                            Id = maxId + 1 + completionRecords.Count, // offset for batch
                            IssueId = command.IssueId,
                            TemplateActionId = action.TemplateActionId,
                            ActionName = actionName,
                            RootCause = action.RootCause?.Trim(),
                            Notes = action.Notes?.Trim(),
                            OldDeviceType = action.OldDeviceType?.Trim(),
                            OldDeviceImei = action.OldDeviceImei?.Trim(),
                            NewDeviceType = action.NewDeviceType?.Trim(),
                            NewDeviceImei = action.NewDeviceImei?.Trim(),
                            DevicePhoneNumber = action.DevicePhoneNumber?.Trim(),
                            SourceVehicleId = action.SourceVehicleId,
                            CameraImei = action.CameraImei?.Trim(),
                            CameraPosition = action.CameraPosition?.Trim(),
                            CameraSimNumber = action.CameraSimNumber?.Trim(),
                            OldSensorType = action.OldSensorType?.Trim(),
                            NewSensorType = action.NewSensorType?.Trim(),
                            SensorReason = action.SensorReason?.Trim(),
                            CalibrationResult = action.CalibrationResult?.Trim(),
                            AdditionalNotes = action.AdditionalNotes?.Trim(),
                            CompletedByUserId = performedByUserId,
                            CompletedByUserName = performedByUserName,
                            CompletedAt = now
                        };

                        completionRecords.Add(record);
                    }

                    // Add records to context with duplicate key retry
                    foreach (var record in completionRecords)
                    {
                        var saved = false;
                        for (int attempt = 0; attempt < 3 && !saved; attempt++)
                        {
                            try
                            {
                                _context.IssueCompletionRecords.Add(record);
                                await _context.SaveChangesAsync(cancellationToken);
                                saved = true;
                            }
                            catch (DbUpdateException ex) when (
                                ex.InnerException?.Message?.Contains("Duplicate entry") == true)
                            {
                                _context.Entry(record).State = EntityState.Detached;
                                var newMaxId = await _context.IssueCompletionRecords
                                    .MaxAsync(r => (int?)r.Id, cancellationToken) ?? 0;
                                record.Id = newMaxId + 1;
                            }
                        }
                        if (!saved)
                        {
                            return FMSResponse<bool>.Failed(
                                "Failed to save completion record after multiple attempts.");
                        }
                    }
                }

                // === Update issue status and notes ===
                var previousStatusId = issue.Status;
                issue.Status = completeStatus.Id;
                issue.ClosingDate = now;
                issue.LastModfield = now;

                // Build auto-summary for backward compatibility
                issue.CompletionNotes = BuildAutoSummary(completionRecords, performedByUserName);

                await _context.SaveChangesAsync(cancellationToken);

                // === Activity logging ===
                var newStatusName = await GetStatusNameAsync(issue.Status, cancellationToken) ?? "Complete";

                await _activityService.LogStatusChangeAsync(
                    issue.Id,
                    oldStatusName,
                    newStatusName,
                    performedByUserId,
                    performedByUserName,
                    cancellationToken);

                // Log each completion action as activity
                foreach (var record in completionRecords)
                {
                    var desc = $"Action: {record.ActionName}";
                    if (!string.IsNullOrWhiteSpace(record.RootCause))
                        desc += $" | Root Cause: {record.RootCause}";
                    if (!string.IsNullOrWhiteSpace(record.NewDeviceImei))
                        desc += $" | New Device: {record.NewDeviceImei}";
                    if (!string.IsNullOrWhiteSpace(record.NewSensorType))
                        desc += $" | New Sensor: {record.NewSensorType}";
                    if (!string.IsNullOrWhiteSpace(record.CalibrationResult))
                        desc += $" | Calibration: {record.CalibrationResult}";

                    await _activityService.LogActivityAsync(
                        issue.Id,
                        "CompletionAction",
                        desc,
                        performedByUserId,
                        performedByUserName,
                        cancellationToken: cancellationToken);
                }

                await _activityService.LogActivityAsync(
                    issue.Id,
                    "Completed",
                    $"{performedByUserName} has marked issue as complete",
                    performedByUserId,
                    performedByUserName,
                    fieldName: "Status",
                    oldValue: oldStatusName,
                    newValue: newStatusName,
                    cancellationToken: cancellationToken);

                // === Notification to opener ===
                var openbyUser = !string.IsNullOrEmpty(issue.Openby)
                    ? await _context.Users
                        .FirstOrDefaultAsync(u => u.Id == issue.Openby, cancellationToken)
                    : null;

                if (openbyUser != null && !string.IsNullOrEmpty(openbyUser.Id))
                {
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

                    await SendCompletionNotificationAsync(
                        issue, openbyUser, performedByUser,
                        vehicleName, siteName,
                        completionRecords,
                        cancellationToken);
                }

                _logger.LogInformation(
                    "Issue {IssueId} completed with {ActionCount} structured action(s) by {UserId}",
                    command.IssueId,
                    completionRecords.Count,
                    performedByUserId);

                return FMSResponse<bool>.Success(true, "Issue successfully completed.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error completing issue {IssueId} with actions",
                    command.IssueId);
                return FMSResponse<bool>.Failed($"Error completing issue: {ex.Message}");
            }
        }

        /// <summary>
        /// Builds a human-readable summary from structured records for backward compatibility
        /// </summary>
        private static string BuildAutoSummary(
            List<IssueCompletionRecord> records,
            string completedBy)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"Completed by {completedBy} on {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC");
            sb.AppendLine();

            if (records.Count > 0)
            {
                for (int i = 0; i < records.Count; i++)
                {
                    var r = records[i];
                    sb.AppendLine($"--- Action {i + 1}: {r.ActionName} ---");

                    if (!string.IsNullOrWhiteSpace(r.RootCause))
                        sb.AppendLine($"Root Cause: {r.RootCause}");

                    if (!string.IsNullOrWhiteSpace(r.Notes))
                        sb.AppendLine($"Notes: {r.Notes}");

                    if (!string.IsNullOrWhiteSpace(r.OldDeviceImei) || !string.IsNullOrWhiteSpace(r.NewDeviceImei))
                    {
                        sb.AppendLine($"Device Change: {r.OldDeviceType} ({r.OldDeviceImei}) -> {r.NewDeviceType} ({r.NewDeviceImei})");
                        if (!string.IsNullOrWhiteSpace(r.DevicePhoneNumber))
                            sb.AppendLine($"Phone: {r.DevicePhoneNumber}");
                    }

                    if (!string.IsNullOrWhiteSpace(r.CameraImei))
                    {
                        sb.AppendLine($"Camera: {r.CameraImei} (Position: {r.CameraPosition}, SIM: {r.CameraSimNumber})");
                    }

                    if (!string.IsNullOrWhiteSpace(r.NewSensorType) || !string.IsNullOrWhiteSpace(r.OldSensorType))
                    {
                        sb.AppendLine($"Sensor Replacement: {r.OldSensorType} -> {r.NewSensorType}" +
                            (!string.IsNullOrWhiteSpace(r.SensorReason) ? $" (Reason: {r.SensorReason})" : string.Empty));
                    }

                    if (!string.IsNullOrWhiteSpace(r.CalibrationResult))
                    {
                        sb.AppendLine($"Calibration Result: {r.CalibrationResult}");
                    }

                    if (!string.IsNullOrWhiteSpace(r.AdditionalNotes))
                        sb.AppendLine($"Additional: {r.AdditionalNotes}");

                    sb.AppendLine();
                }
            }
            return sb.ToString().Trim();
        }

        private static string? ValidateCompletionAction(
            CreateIssueCompletionRecordDTO action,
            string actionName,
            string? actionType)
        {
            if (string.IsNullOrWhiteSpace(action.RootCause))
            {
                return $"Root cause is required for action '{actionName}'.";
            }

            if (string.Equals(actionType, "DeviceChange", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(action.NewDeviceType))
                {
                    return $"New device type is required for action '{actionName}'.";
                }

                if (string.IsNullOrWhiteSpace(action.NewDeviceImei))
                {
                    return $"New IMEI is required for action '{actionName}'.";
                }
            }

            if (string.Equals(actionType, "CameraInstall", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(action.CameraImei))
                {
                    return $"Camera IMEI is required for action '{actionName}'.";
                }

                if (string.IsNullOrWhiteSpace(action.CameraPosition))
                {
                    return $"Camera position is required for action '{actionName}'.";
                }
            }

            if (string.Equals(actionType, "SensorReplacement", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(action.NewSensorType))
                {
                    return $"New sensor type is required for action '{actionName}'.";
                }

                if (string.IsNullOrWhiteSpace(action.SensorReason))
                {
                    return $"Sensor replacement reason is required for action '{actionName}'.";
                }
            }

            if (string.Equals(actionType, "SensorCalibration", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(action.CalibrationResult))
                {
                    return $"Calibration result is required for action '{actionName}'.";
                }
            }

            return null;
        }

        private static string? ValidateTemplateActionSelection(IssueTemplateAction templateAction, int? issueTemplateId)
        {
            if (!issueTemplateId.HasValue)
            {
                return $"Action '{templateAction.Name}' cannot be used because the issue has no assigned template.";
            }

            if (templateAction.IssueTemplateId != issueTemplateId.Value)
            {
                return $"Action '{templateAction.Name}' does not belong to the issue template.";
            }

            if (!templateAction.IsActive)
            {
                return $"Action '{templateAction.Name}' is inactive and cannot be used for completion.";
            }

            if (!templateAction.StageId.HasValue || templateAction.Stage == null)
            {
                return $"Action '{templateAction.Name}' is not assigned to an active workflow stage.";
            }

            if (!templateAction.Stage.IsActive)
            {
                return $"Action '{templateAction.Name}' belongs to an inactive workflow stage.";
            }

            if (templateAction.Stage.Workflow == null
                || templateAction.Stage.Workflow.IssueTemplateId != issueTemplateId.Value
                || !templateAction.Stage.Workflow.IsActive)
            {
                return $"Action '{templateAction.Name}' does not belong to an active workflow for the issue template.";
            }

            return null;
        }

        private async Task SendCompletionNotificationAsync(
            Issuetracker issue,
            User openbyUser,
            User? completedByUser,
            string? vehicleName,
            string? siteName,
            List<IssueCompletionRecord> records,
            CancellationToken cancellationToken)
        {
            try
            {
                var frontendBaseUrl = GetFrontendBaseUrl();
                var issueUrl = $"{frontendBaseUrl}/issue-tracker/details/{issue.Id}";
                var completedByName = completedByUser?.UserName ?? "System";
                var completedAtUtc = DateTime.UtcNow;
                var completedAtLocal = FormatLocalDateTime(completedAtUtc);

                var emailBodyHtml = BuildCompletionEmailHtml(
                    issue.Id,
                    issue.ProblemTitle ?? "Untitled Issue",
                    openbyUser.UserName ?? "User",
                    completedByName,
                    vehicleName ?? "Not specified",
                    siteName ?? "Not specified",
                    completedAtLocal,
                    records,
                    issueUrl);

                var issueLink = NotificationLinkBuilder.ForIssue(issue.Id);
                var notificationRequest = new CreateNotificationRequest
                {
                    Type = NotificationType.Alert,
                    CategoryId = (int)WellKnownCategories.IssueTracker,
                    Priority = NotificationPriority.Medium,
                    Title = $"Issue Completed: {issue.ProblemTitle}",
                    Message = $"Your issue #{issue.Id} has been marked as complete by {completedByName}.",
                    Link = issueLink.Link,
                    LinkLabel = issueLink.Label,
                    Data = new
                    {
                        IssueId = issue.Id,
                        IssueTitle = issue.ProblemTitle,
                        CompletedBy = completedByName,
                        CompletedAt = completedAtUtc,
                        CompletedAtLocal = completedAtLocal,
                        VehicleName = vehicleName,
                        SiteName = siteName,
                        IssueUrl = issueUrl,
                        ActionCount = records.Count,
                        EmailBodyHtml = emailBodyHtml
                    },
                    TriggerSource = "IssueCompletionWithActions",
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

                var result = await _notificationService.CreateNotificationAsync(
                    notificationRequest, cancellationToken);

                if (!result.IsSuccess)
                {
                    _logger.LogWarning(
                        "Issue {IssueId} completed but notification to opener failed: {Message}",
                        issue.Id, result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to send completion notification for issue {IssueId}",
                    issue.Id);
            }
        }

        private static string BuildCompletionEmailHtml(
            int issueId,
            string issueTitle,
            string openerName,
            string completedByName,
            string vehicleName,
            string siteName,
            string completedAt,
            List<IssueCompletionRecord> records,
            string issueUrl)
        {
            var safeIssueTitle = WebUtility.HtmlEncode(issueTitle);
            var safeOpenerName = WebUtility.HtmlEncode(openerName);
            var safeCompletedBy = WebUtility.HtmlEncode(completedByName);
            var safeVehicle = WebUtility.HtmlEncode(vehicleName);
            var safeSite = WebUtility.HtmlEncode(siteName);
            var safeCompletedAt = WebUtility.HtmlEncode(completedAt);
            var safeIssueUrl = WebUtility.HtmlEncode(issueUrl);

            // Build actions summary rows
            var actionRows = new StringBuilder();
            foreach (var r in records)
            {
                var safeName = WebUtility.HtmlEncode(r.ActionName);
                var safeRootCause = WebUtility.HtmlEncode(r.RootCause ?? "—");
                var details = new List<string>();

                if (!string.IsNullOrWhiteSpace(r.NewDeviceImei))
                    details.Add($"New Device: {WebUtility.HtmlEncode(r.NewDeviceType)} ({WebUtility.HtmlEncode(r.NewDeviceImei)})");

                if (!string.IsNullOrWhiteSpace(r.CameraImei))
                    details.Add($"Camera: {WebUtility.HtmlEncode(r.CameraImei)} [{WebUtility.HtmlEncode(r.CameraPosition)}]");

                if (!string.IsNullOrWhiteSpace(r.NewSensorType) || !string.IsNullOrWhiteSpace(r.OldSensorType))
                    details.Add($"Sensor: {WebUtility.HtmlEncode(r.OldSensorType ?? "—")} → {WebUtility.HtmlEncode(r.NewSensorType ?? "—")}" +
                        (!string.IsNullOrWhiteSpace(r.SensorReason) ? $" ({WebUtility.HtmlEncode(r.SensorReason)})" : string.Empty));

                if (!string.IsNullOrWhiteSpace(r.CalibrationResult))
                    details.Add($"Calibration: {WebUtility.HtmlEncode(r.CalibrationResult)}");

                var detailText = details.Count > 0
                    ? string.Join("<br/>", details)
                    : "—";

                actionRows.Append($@"
                        <tr>
                          <td style=""padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:600;"">{safeName}</td>
                          <td style=""padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;"">{safeRootCause}</td>
                          <td style=""padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;"">{detailText}</td>
                        </tr>");
            }

            return $@"
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"">
                  <tr>
                    <td style=""padding:24px 24px 16px;background:linear-gradient(135deg,#059669 0%,#10b981 100%);border-radius:12px 12px 0 0;"">
                      <div style=""font-size:11px;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;"">
                        <span style=""display:inline-block;background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;"">Issue Completed</span>
                      </div>
                      <div style=""font-size:22px;color:#ffffff;font-weight:700;line-height:1.3;"">Issue #{issueId}: {safeIssueTitle}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style=""padding:0;background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;"">
                      <div style=""padding:20px 24px;border-bottom:1px solid #f3f4f6;"">
                        <p style=""margin:0;font-size:15px;color:#374151;line-height:1.6;"">
                          Hi <strong>{safeOpenerName}</strong>,<br/><br/>
                          Your issue has been marked as <strong style=""color:#059669;"">completed</strong> by <strong>{safeCompletedBy}</strong>.
                        </p>
                      </div>
                      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-collapse:collapse;"">
                        <tr>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">Vehicle</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeVehicle}</div>
                          </td>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">Site</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeSite}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">Completed By</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeCompletedBy}</div>
                          </td>
                          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
                            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">Completed At</div>
                            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeCompletedAt}</div>
                          </td>
                        </tr>
                      </table>
                      {(records.Count > 0 ? $@"
                      <div style=""padding:16px 24px;"">
                        <div style=""font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;"">Actions Taken ({records.Count})</div>
                        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;"">
                          <tr style=""background:#f9fafb;"">
                            <th style=""padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;"">Action</th>
                            <th style=""padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;"">Root Cause</th>
                            <th style=""padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;"">Details</th>
                          </tr>
                          {actionRows}
                        </table>
                      </div>" : "")}
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

        private async Task<string?> GetStatusNameAsync(int? statusId, CancellationToken cancellationToken)
        {
            if (!statusId.HasValue) return null;
            return await _context.Issuestatuses
                .Where(s => s.Id == statusId.Value)
                .Select(s => s.Status)
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
