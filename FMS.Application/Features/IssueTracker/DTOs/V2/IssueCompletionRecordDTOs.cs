/**
 * File: IssueCompletionRecordDTOs.cs
 * Purpose: DTOs for structured issue completion data
 * Dependencies: None
 * Last Modified: 2026-04-23
 *
 * Key DTOs:
 * - IssueCompletionRecordDTO: Full response DTO with denormalized names
 * - CreateIssueCompletionRecordDTO: Single action record submitted during completion
 * - CompleteIssueWithActionsRequestDTO: Top-level request wrapping multiple completion records
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.IssueTracker.DTOs.V2
{
    /// <summary>
    /// Full response DTO for a completion record
    /// </summary>
    public class IssueCompletionRecordDTO
    {
        public int Id { get; set; }
        public int IssueId { get; set; }
        public int? TemplateActionId { get; set; }
        public string ActionName { get; set; } = null!;
        public string? ActionType { get; set; }
        public string? RootCause { get; set; }
        public string? Notes { get; set; }

        // Device change
        public string? OldDeviceType { get; set; }
        public string? OldDeviceImei { get; set; }
        public string? NewDeviceType { get; set; }
        public string? NewDeviceImei { get; set; }
        public string? DevicePhoneNumber { get; set; }
        public int? SourceVehicleId { get; set; }
        public string? SourceVehicleName { get; set; }

        // Camera
        public string? CameraImei { get; set; }
        public string? CameraPosition { get; set; }
        public string? CameraSimNumber { get; set; }

        // Sensor replacement
        public string? OldSensorType { get; set; }
        public string? NewSensorType { get; set; }
        public string? SensorReason { get; set; }

        // Sensor calibration
        public string? CalibrationResult { get; set; }

        public string? AdditionalNotes { get; set; }
        public string CompletedByUserId { get; set; } = null!;
        public string? CompletedByUserName { get; set; }
        public DateTime CompletedAt { get; set; }
    }

    /// <summary>
    /// A single completion action record submitted by the technician
    /// </summary>
    public class CreateIssueCompletionRecordDTO
    {
        public int? TemplateActionId { get; set; }
        public string? ActionName { get; set; }
        public string? RootCause { get; set; }
        public string? Notes { get; set; }

        // Device change
        public string? OldDeviceType { get; set; }
        public string? OldDeviceImei { get; set; }
        public string? NewDeviceType { get; set; }
        public string? NewDeviceImei { get; set; }
        public string? DevicePhoneNumber { get; set; }
        public int? SourceVehicleId { get; set; }

        // Camera
        public string? CameraImei { get; set; }
        public string? CameraPosition { get; set; }
        public string? CameraSimNumber { get; set; }

        // Sensor replacement
        public string? OldSensorType { get; set; }
        public string? NewSensorType { get; set; }
        public string? SensorReason { get; set; }

        // Sensor calibration
        public string? CalibrationResult { get; set; }

        public string? AdditionalNotes { get; set; }
    }

    /// <summary>
    /// Top-level request for completing an issue with structured actions.
    /// Wraps one or more completion records (e.g., "replaced device" + "installed camera").
    /// </summary>
    public class CompleteIssueWithActionsRequestDTO
    {
        /// <summary>
        /// Structured completion records — one per action taken
        /// </summary>
        public List<CreateIssueCompletionRecordDTO> Actions { get; set; } = new();
    }

    /// <summary>
    /// DTO for the reassign issue request
    /// </summary>
    public class ReassignIssueRequestDTO
    {
        /// <summary>
        /// New assignee user ID or username
        /// </summary>
        public string NewAssigneeUserId { get; set; } = null!;

        /// <summary>
        /// Reason/notes for the reassignment
        /// </summary>
        public string? Notes { get; set; }
    }
}
