/*
 * File: RespondToIssueAssignmentCommand.cs
 * Purpose: Command contract for assigned worker responses to issue assignments
 * Dependencies: MediatR, FMSResponse, IssueAssignmentResponseRequestDTO
 * Last Modified: 2026-02-03
 */
using FMS.Application.Common;
using FMS.Application.Features.FMS.Issuetracker;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.Issues;

public record RespondToIssueAssignmentCommand(IssueAssignmentResponseRequestDTO Request, int IssueId)
    : IRequest<FMSResponse<bool>>;
