/*
 * File: IssueAssignmentResponseRequestDTO.cs
 * Purpose: Payload for assigned worker response actions (confirm/schedule) on an issue
 * Dependencies: System
 * Last Modified: 2026-02-03
 */
using System;

namespace FMS.Application.Features.FMS.Issuetracker
{
    public class IssueAssignmentResponseRequestDTO
    {
        public string Action { get; set; } = "confirm";
        public DateTime? ScheduledDate { get; set; }
        public string? Note { get; set; }
        public string? RespondedByUserId { get; set; }
    }
}
