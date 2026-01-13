using System;

namespace FMS.Application.Features.IssueTracker.DTOs.V2;

/// <summary>
/// Issue Template DTO for Issue Tracker v2
/// </summary>
public class IssueTemplateDTO
{
    public int Id { get; set; }
    public int DeviceTypeId { get; set; }
    public string DeviceTypeName { get; set; } = string.Empty;
    public string Name { get; set; } = null!;
    public string? TitleTemplate { get; set; }
    public string? DescriptionTemplate { get; set; }
    public int? DefaultPriorityId { get; set; }
    public string? DefaultPriorityName { get; set; }
    public int? DefaultStatusId { get; set; }
    public string? DefaultStatusName { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Auto-close config summary
    public bool HasAutoCloseConfig { get; set; }
    public bool AutoCloseEnabled { get; set; }
}

/// <summary>
/// Create Issue Template Request DTO
/// </summary>
public class CreateIssueTemplateDTO
{
    public int DeviceTypeId { get; set; }
    public string Name { get; set; } = null!;
    public string? TitleTemplate { get; set; }
    public string? DescriptionTemplate { get; set; }
    public int? DefaultPriorityId { get; set; }
    public int? DefaultStatusId { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Update Issue Template Request DTO
/// </summary>
public class UpdateIssueTemplateDTO
{
    public int Id { get; set; }
    public int DeviceTypeId { get; set; }
    public string Name { get; set; } = null!;
    public string? TitleTemplate { get; set; }
    public string? DescriptionTemplate { get; set; }
    public int? DefaultPriorityId { get; set; }
    public int? DefaultStatusId { get; set; }
    public bool IsActive { get; set; }
}
