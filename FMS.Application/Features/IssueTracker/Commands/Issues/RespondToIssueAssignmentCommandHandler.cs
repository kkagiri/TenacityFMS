/*
 * File: RespondToIssueAssignmentCommandHandler.cs
 * Purpose: Handles issue assignment acknowledgement and scheduling responses from assigned workers
 * Dependencies: MediatR, Entity Framework Core, GpsdataContext, FMSResponse
 * Last Modified: 2026-02-03
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues;

public class RespondToIssueAssignmentCommandHandler : IRequestHandler<RespondToIssueAssignmentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<RespondToIssueAssignmentCommandHandler> _logger;
    private readonly IIssueActivityService _activityService;

    public RespondToIssueAssignmentCommandHandler(
        GpsdataContext context,
        ILogger<RespondToIssueAssignmentCommandHandler> logger,
        IIssueActivityService activityService)
    {
        _context = context;
        _logger = logger;
        _activityService = activityService;
    }

    public async Task<FMSResponse<bool>> Handle(RespondToIssueAssignmentCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var request = command.Request;
            var normalizedAction = request.Action?.Trim().ToLowerInvariant();

            if (normalizedAction != "confirm" && normalizedAction != "schedule" && normalizedAction != "ongoing")
            {
                return FMSResponse<bool>.Failed("Action must be 'confirm', 'ongoing', or 'schedule'.");
            }

            // Treat "ongoing" as alias for "confirm"
            if (normalizedAction == "ongoing")
                normalizedAction = "confirm";

            if (string.IsNullOrWhiteSpace(request.RespondedByUserId))
            {
                return FMSResponse<bool>.Failed("Authenticated user is required.");
            }

            var issue = await _context.Issuetrackers
                .FirstOrDefaultAsync(i => i.Id == command.IssueId, cancellationToken);

            if (issue == null)
            {
                return FMSResponse<bool>.NotFound($"Issue with ID {command.IssueId} was not found.");
            }

            var responderUserId = request.RespondedByUserId;
            if (!string.Equals(issue.AssignTo, responderUserId, StringComparison.OrdinalIgnoreCase))
            {
                var responder = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u =>
                        u.Id == responderUserId ||
                        u.UserName == responderUserId,
                        cancellationToken);

                if (responder == null || !string.Equals(issue.AssignTo, responder.Id, StringComparison.OrdinalIgnoreCase))
                {
                    return FMSResponse<bool>.Failed("Only the assigned worker can respond to this issue.");
                }

                request.RespondedByUserId = responder.Id;
            }

            if (normalizedAction == "schedule")
            {
                if (!request.ScheduledDate.HasValue)
                {
                    return FMSResponse<bool>.Failed("Scheduled date is required when action is 'schedule'.");
                }

                var scheduledDate = request.ScheduledDate.Value.Date;
                var today = DateTime.UtcNow.Date;

                if (scheduledDate < today)
                {
                    return FMSResponse<bool>.Failed("Scheduled date cannot be in the past.");
                }

                if (issue.DueDate.HasValue && scheduledDate > issue.DueDate.Value.Date)
                {
                    return FMSResponse<bool>.Failed("Scheduled date must be on or before the current due date.");
                }

                issue.DueDate = scheduledDate;
            }

            if (!string.IsNullOrWhiteSpace(request.Note))
            {
                var notePrefix = normalizedAction == "schedule" ? "[Schedule Note]" : "[Assignment Note]";
                var noteText = request.Note.Trim();
                issue.ProblemDescription = string.IsNullOrWhiteSpace(issue.ProblemDescription)
                    ? $"{notePrefix} {noteText}"
                    : $"{issue.ProblemDescription}\n\n{notePrefix} {noteText}";
            }

            var inProgressStatusId = await ResolveInProgressStatusIdAsync(cancellationToken);
            if (inProgressStatusId.HasValue)
            {
                issue.Status = inProgressStatusId.Value;
            }

            // Handle new due date (independent of action — can be sent with confirm/ongoing/schedule)
            if (request.NewDueDate.HasValue)
            {
                var newDueDate = request.NewDueDate.Value.Date;
                if (newDueDate < DateTime.UtcNow.Date)
                {
                    return FMSResponse<bool>.Failed("New due date cannot be in the past.");
                }
                issue.DueDate = newDueDate;
            }

            // Handle vehicle status change
            if (request.VehicleStatusChange.HasValue)
            {
                var validStatuses = new[] { 0, 1, 2 }; // Working=0, ParkedYard=1, Workshop=2
                if (!validStatuses.Contains(request.VehicleStatusChange.Value))
                {
                    return FMSResponse<bool>.Failed("Invalid vehicle status. Use 0 (Working), 1 (Parked Yard), or 2 (Workshop).");
                }

                var vehicle = await _context.Vehicles
                    .FirstOrDefaultAsync(v => v.VehicleId == issue.VehicleId, cancellationToken);

                if (vehicle != null)
                {
                    var newStatus = (VehicleStatus)request.VehicleStatusChange.Value;
                    vehicle.VehicleStatusValue = newStatus;

                    _logger.LogInformation(
                        "Vehicle status changed via issue response. VehicleId: {VehicleId}, NewStatus: {NewStatus}, IssueId: {IssueId}, ChangedBy: {UserId}",
                        vehicle.VehicleId, newStatus, issue.Id, request.RespondedByUserId);
                }
            }

            issue.LastModfield = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            // --- Activity Stream Logging ---
            var responderName = await _context.Users.AsNoTracking()
                .Where(u => u.Id == request.RespondedByUserId)
                .Select(u => u.UserName ?? u.Id)
                .FirstOrDefaultAsync(cancellationToken) ?? request.RespondedByUserId;

            // Log the assignment response action
            var actionLabel = normalizedAction == "confirm" ? "Confirmed" : "Scheduled";
            if (request.Action?.Trim().ToLowerInvariant() == "ongoing")
                actionLabel = "Marked as Ongoing";

            await _activityService.LogActivityAsync(
                issue.Id,
                "AssignmentResponse",
                $"{responderName} responded to assignment: {actionLabel}",
                request.RespondedByUserId,
                responderName,
                cancellationToken: cancellationToken);

            // Log status change to In Progress
            if (inProgressStatusId.HasValue)
            {
                var statusName = await _context.Issuestatuses.AsNoTracking()
                    .Where(s => s.Id == inProgressStatusId.Value)
                    .Select(s => s.Status)
                    .FirstOrDefaultAsync(cancellationToken) ?? "In Progress";

                await _activityService.LogStatusChangeAsync(
                    issue.Id,
                    null, // old status not tracked here
                    statusName,
                    request.RespondedByUserId,
                    responderName,
                    cancellationToken);
            }

            // Log vehicle status change
            if (request.VehicleStatusChange.HasValue)
            {
                var newStatusName = ((VehicleStatus)request.VehicleStatusChange.Value).ToString();
                await _activityService.LogFieldChangeAsync(
                    issue.Id,
                    "VehicleStatus",
                    null, // old value logged via application logger above
                    newStatusName,
                    request.RespondedByUserId,
                    responderName,
                    cancellationToken);
            }

            // Log deadline change
            if (request.NewDueDate.HasValue)
            {
                await _activityService.LogFieldChangeAsync(
                    issue.Id,
                    "DueDate",
                    null,
                    request.NewDueDate.Value.ToString("yyyy-MM-dd"),
                    request.RespondedByUserId,
                    responderName,
                    cancellationToken);
            }
            else if (normalizedAction == "schedule" && request.ScheduledDate.HasValue)
            {
                await _activityService.LogFieldChangeAsync(
                    issue.Id,
                    "DueDate",
                    null,
                    request.ScheduledDate.Value.ToString("yyyy-MM-dd"),
                    request.RespondedByUserId,
                    responderName,
                    cancellationToken);
            }

            // Log note if provided
            if (!string.IsNullOrWhiteSpace(request.Note))
            {
                await _activityService.LogActivityAsync(
                    issue.Id,
                    "NoteAdded",
                    $"{responderName} added a note: {request.Note.Trim()}",
                    request.RespondedByUserId,
                    responderName,
                    cancellationToken: cancellationToken);
            }
            // --- End Activity Stream Logging ---

            var responseMessage = normalizedAction == "confirm"
                ? "Issue assignment confirmed successfully. Status updated to In Progress."
                : $"Issue scheduled successfully for {issue.DueDate:yyyy-MM-dd}. Status updated to In Progress.";

            // Append vehicle status info to response message
            if (request.VehicleStatusChange.HasValue)
            {
                var statusName = ((VehicleStatus)request.VehicleStatusChange.Value).ToString();
                responseMessage += $" Vehicle status changed to {statusName}.";
            }

            // Append deadline info to response message
            if (request.NewDueDate.HasValue)
            {
                responseMessage += $" Deadline updated to {request.NewDueDate.Value:yyyy-MM-dd}. No new alerts will be created for this vehicle until this date.";
            }

            _logger.LogInformation(
                "Issue assignment response processed. IssueId: {IssueId}, Action: {Action}, RespondedBy: {UserId}",
                issue.Id,
                normalizedAction,
                request.RespondedByUserId);

            return FMSResponse<bool>.Success(true, responseMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error responding to issue assignment for issue {IssueId}", command.IssueId);
            return FMSResponse<bool>.Failed($"Failed to process issue assignment response: {ex.Message}");
        }
    }

    private async Task<int?> ResolveInProgressStatusIdAsync(CancellationToken cancellationToken)
    {
        var statusIds = await _context.Issuestatuses
            .Where(s => s.Status != null)
            .Select(s => new { s.Id, s.Status })
            .ToListAsync(cancellationToken);

        var preferredNames = new[]
        {
            "In Progress",
            "InProgress",
            "Working",
            "Assigned"
        };

        foreach (var preferredName in preferredNames)
        {
            var match = statusIds.FirstOrDefault(s =>
                string.Equals(s.Status, preferredName, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                return match.Id;
            }
        }

        return null;
    }
}
