//Cursor - Create TaskDTO in FMS.Application/ModelsDTOs/FMS/Task/
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.FMS.Task {
    public class TaskDTO {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Type { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? AssignedTo { get; set; }
        public string? AssignedToName { get; set; }
        public string? AssignedBy { get; set; }
        public string? AssignedByName { get; set; }
        public DateTime? AssignedOn { get; set; }
        public DateTime? DueDate { get; set; }
        public string? SourceType { get; set; }
        public int? SourceId { get; set; }
        public int? SiteId { get; set; }
        public string? SiteName { get; set; }
        public int? TankId { get; set; }
        public string? TankName { get; set; }
        public DateTime? CompletedOn { get; set; }
        public string? CompletionNotes { get; set; }
        public string CreatedBy { get; set; } = null!;
        public string? CreatedByName { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? UpdatedBy { get; set; }
        public string? UpdatedByName { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public bool IsOverdue => DueDate.HasValue && DueDate < DateTime.UtcNow && Status != "Completed";
        public int? DaysUntilDue => DueDate.HasValue ? (int?) (DueDate.Value - DateTime.UtcNow).TotalDays : null;
    }

    public class TaskFilterDTO {
        public string[] ? Types { get; set; }
        public string[] ? Priorities { get; set; }
        public string[] ? Status { get; set; }
        public string? AssignedTo { get; set; }
        public int[] ? SiteIds { get; set; }
        public int[] ? TankIds { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? OverdueOnly { get; set; }
        public string? SourceType { get; set; }
        public string? SearchTerm { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SortBy { get; set; } = "CreatedOn";
        public string? SortDirection { get; set; } = "desc";
    }

    public class CreateTaskDTO {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public TaskType Type { get; set; }
        public TaskPriority Priority { get; set; }
        public string? AssignedTo { get; set; }
        public DateTime? DueDate { get; set; }
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public string? SourceType { get; set; }
        public int? SourceId { get; set; }
    }

    public class UpdateTaskDTO {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public TaskType? Type { get; set; }
        public TaskPriority? Priority { get; set; }
        public TaskStatus? Status { get; set; }
        public string? AssignedTo { get; set; }
        public DateTime? DueDate { get; set; }
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public string? CompletionNotes { get; set; }
    }

    public class AssignTaskDTO {
        public string AssignedTo { get; set; } = null!;
        public DateTime? DueDate { get; set; }
        public string? Notes { get; set; }
    }

    public class CompleteTaskDTO {
        public string CompletionNotes { get; set; } = null!;
        public DateTime? CompletedOn { get; set; }
    }

    public class TaskSummaryDTO {
        public int TotalTasks { get; set; }
        public int PendingTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int CriticalTasks { get; set; }
        public int HighPriorityTasks { get; set; }
        public int TasksDueToday { get; set; }
        public double AverageCompletionTime { get; set; }
        public Dictionary<string, int> TasksByType { get; set; } = [];
        public Dictionary<string, int> TasksByPriority { get; set; } = [];
    }
}