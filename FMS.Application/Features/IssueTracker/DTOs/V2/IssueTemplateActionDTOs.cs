/**
 * File: IssueTemplateActionDTOs.cs
 * Purpose: DTOs for IssueTemplateAction CRUD operations
 * Dependencies: None
 * Last Modified: 2026-02-21
 *
 * Key DTOs:
 * - IssueTemplateActionDTO: Full response DTO
 * - CreateIssueTemplateActionDTO: Creation request
 * - UpdateIssueTemplateActionDTO: Update request
 */
using System;

namespace FMS.Application.Features.IssueTracker.DTOs.V2
{
    /// <summary>
    /// Full response DTO for an issue template action
    /// </summary>
    public class IssueTemplateActionDTO
    {
        public int Id { get; set; }
        public int IssueTemplateId { get; set; }
        public string? IssueTemplateName { get; set; }
        public string Name { get; set; } = null!;
        public string ActionType { get; set; } = "General";
        public string? Description { get; set; }
        public bool RequiresDeviceDetails { get; set; }
        public bool RequiresSourceVehicle { get; set; }
        public bool RequiresCameraDetails { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating a new template action
    /// </summary>
    public class CreateIssueTemplateActionDTO
    {
        public int IssueTemplateId { get; set; }
        public string Name { get; set; } = null!;
        public string ActionType { get; set; } = "General";
        public string? Description { get; set; }
        public bool RequiresDeviceDetails { get; set; }
        public bool RequiresSourceVehicle { get; set; }
        public bool RequiresCameraDetails { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// DTO for updating an existing template action
    /// </summary>
    public class UpdateIssueTemplateActionDTO
    {
        public int Id { get; set; }
        public int IssueTemplateId { get; set; }
        public string Name { get; set; } = null!;
        public string ActionType { get; set; } = "General";
        public string? Description { get; set; }
        public bool RequiresDeviceDetails { get; set; }
        public bool RequiresSourceVehicle { get; set; }
        public bool RequiresCameraDetails { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
