using System;
using System.Collections.Generic;

namespace FMS.Application.Features.IssueTracker.DTOs.V2
{
    public class IssueTemplateWorkflowDTO
    {
        public int? Id { get; set; }
        public int IssueTemplateId { get; set; }
        public string Name { get; set; } = "Default workflow";
        public bool IsActive { get; set; } = true;
        public long RowVersion { get; set; } = 1;
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<IssueTemplateWorkflowStageDTO> Stages { get; set; } = new();
    }

    public class IssueTemplateWorkflowStageDTO
    {
        public int? Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public List<IssueTemplateWorkflowActionDTO> Actions { get; set; } = new();
    }

    public class IssueTemplateWorkflowActionDTO
    {
        public int? Id { get; set; }
        public int IssueTemplateId { get; set; }
        public int? StageId { get; set; }
        public string Name { get; set; } = null!;
        public string ActionType { get; set; } = "General";
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public double? PositionX { get; set; }
        public double? PositionY { get; set; }
        public bool RequiresDeviceDetails { get; set; }
        public bool RequiresSourceVehicle { get; set; }
        public bool RequiresCameraDetails { get; set; }
    }

    public class SaveIssueTemplateWorkflowRequestDTO
    {
        public int? Id { get; set; }
        public int IssueTemplateId { get; set; }
        public string Name { get; set; } = "Default workflow";
        public bool IsActive { get; set; } = true;
        public long RowVersion { get; set; } = 1;
        public List<SaveIssueTemplateWorkflowStageDTO> Stages { get; set; } = new();
    }

    public class SaveIssueTemplateWorkflowStageDTO
    {
        public int? Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public List<SaveIssueTemplateWorkflowActionDTO> Actions { get; set; } = new();
    }

    public class SaveIssueTemplateWorkflowActionDTO
    {
        public int? Id { get; set; }
        public string Name { get; set; } = null!;
        public string ActionType { get; set; } = "General";
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public double? PositionX { get; set; }
        public double? PositionY { get; set; }
    }

    public class ReorderIssueTemplateWorkflowStagesRequestDTO
    {
        public long RowVersion { get; set; } = 1;
        public List<int> StageIds { get; set; } = new();
    }
}