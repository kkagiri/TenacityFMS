using System;

namespace FMS.Application.Features.IssueTracker.DTOs.V2;

/// <summary>
/// Issue v2 Response DTO - aligned with updated Issuetracker entity
/// </summary>
public class IssueV2ResponseDTO
{
    public int Id { get; set; }

    // Template information
    public int? IssueTemplateId { get; set; }
    public string? TemplateName { get; set; }

    // Device information
    public int? DeviceTypeId { get; set; }
    public string? DeviceTypeName { get; set; }

    // Issue details
    public string ProblemTitle { get; set; } = string.Empty;
    public string ProblemDescription { get; set; } = string.Empty;
    public DateTime? OpenDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ClosingDate { get; set; }
    public DateTime? LastModfield { get; set; }

    // Status & Priority
    public int? Status { get; set; }
    public string? StatusName { get; set; }
    public int? Priority { get; set; }
    public string? PriorityName { get; set; }

    // Location
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string? VehicleCode { get; set; }

    // Users
    public string OpenbyId { get; set; } = string.Empty;
    public string OpenbyUserName { get; set; } = string.Empty;
    public string AssignToId { get; set; } = string.Empty;
    public string AssignToUserName { get; set; } = string.Empty;

    // Auto-close (future use)
    public bool CanAutoClose { get; set; }
    public string? AutoCloseReason { get; set; }
    public bool IsAutoCreated { get; set; }

    // Related
    public int? RelatedIssue { get; set; }
    public int? ActiveAlarmId { get; set; }

    // Legacy category support
    public int IssueCategoryId { get; set; }
    public string? CategoryName { get; set; }
}

/// <summary>
/// Create Issue v2 Request DTO
/// </summary>
public class CreateIssueV2DTO
{
    // Template-based (preferred for v2)
    public int? IssueTemplateId { get; set; }
    public int? DeviceTypeId { get; set; }

    // Legacy category support
    public int? IssueCategoryId { get; set; }

    // Required fields
    public int SiteId { get; set; }
    public int VehicleId { get; set; }
    public string AssignTo { get; set; } = null!;

    // Issue details (can be overridden from template)
    public string? ProblemTitle { get; set; }
    public string? ProblemDescription { get; set; }
    public int? Priority { get; set; }
    public DateTime? DueDate { get; set; }

    // Optional
    public int? RelatedIssue { get; set; }
    public int? ActiveAlarmId { get; set; }

    // Note: Openby is set by backend from authenticated user
    // Note: OpenDate is set by backend to current datetime
    // Note: Status defaults to "Open" (1)
}

/// <summary>
/// Update Issue v2 Request DTO
/// </summary>
public class UpdateIssueV2DTO
{
    public int Id { get; set; }

    // Template info (optional update)
    public int? IssueTemplateId { get; set; }
    public int? DeviceTypeId { get; set; }

    // Legacy category support
    public int? IssueCategoryId { get; set; }

    // Required fields
    public int SiteId { get; set; }
    public int VehicleId { get; set; }
    public string AssignTo { get; set; } = null!;

    // Issue details
    public string ProblemTitle { get; set; } = null!;
    public string ProblemDescription { get; set; } = null!;
    public int? Status { get; set; }
    public int? Priority { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ClosingDate { get; set; }

    // Optional
    public int? RelatedIssue { get; set; }
    public int? ActiveAlarmId { get; set; }
}

/// <summary>
/// Issue filter parameters for v2 queries
/// </summary>
public class IssueV2FilterDTO
{
    public int? DeviceTypeId { get; set; }
    public int? IssueTemplateId { get; set; }
    public int? IssueCategoryId { get; set; }
    public int? SiteId { get; set; }
    public int? VehicleId { get; set; }
    public int? Status { get; set; }
    public int? Priority { get; set; }
    public string? AssignTo { get; set; }
    public string? OpenBy { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool? IsAutoCreated { get; set; }
    public bool? CanAutoClose { get; set; }
    public int? ActiveAlarmId { get; set; }

    // Pagination
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;

    // Sorting
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = true;
}
