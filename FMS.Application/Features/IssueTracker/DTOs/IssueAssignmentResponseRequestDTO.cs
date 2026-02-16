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

        /// <summary>
        /// Optional vehicle status change: 0=Working, 1=ParkedYard, 2=Workshop.
        /// If provided, the vehicle’s operational status will be updated.
        /// ParkedYard/Workshop vehicles are excluded from GPS offline monitoring.
        /// </summary>
        public int? VehicleStatusChange { get; set; }

        /// <summary>
        /// Optional new due date. If set, the issue’s deadline is updated to this value.
        /// While the deadline is in the future, no new auto-created issues will be generated
        /// for the same vehicle+template combination.
        /// </summary>
        public DateTime? NewDueDate { get; set; }
    }
}
