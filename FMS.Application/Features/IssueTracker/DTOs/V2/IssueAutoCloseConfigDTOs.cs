using System;

namespace FMS.Application.Features.IssueTracker.DTOs.V2;

/// <summary>
/// Issue Auto Close Config DTO for Issue Tracker v2
/// </summary>
public class IssueAutoCloseConfigDTO
{
    public int Id { get; set; }
    public int IssueTemplateId { get; set; }
    public string IssueTemplateName { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public string CheckerType { get; set; } = null!;
    public int? CheckIntervalSeconds { get; set; }
    public string? CheckerConfigJson { get; set; }
    public bool AutoCloseWhenSatisfied { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Create/Update Auto Close Config Request DTO
/// </summary>
public class CreateAutoCloseConfigDTO
{
    public int IssueTemplateId { get; set; }
    public bool IsEnabled { get; set; }
    public string CheckerType { get; set; } = null!;
    public int? CheckIntervalSeconds { get; set; }
    public string? CheckerConfigJson { get; set; }
    public bool AutoCloseWhenSatisfied { get; set; }
}

/// <summary>
/// Update Auto Close Config Request DTO
/// </summary>
public class UpdateAutoCloseConfigDTO
{
    public int Id { get; set; }
    public bool IsEnabled { get; set; }
    public string CheckerType { get; set; } = null!;
    public int? CheckIntervalSeconds { get; set; }
    public string? CheckerConfigJson { get; set; }
    public bool AutoCloseWhenSatisfied { get; set; }
}

/// <summary>
/// Available checker types for auto-close configuration
/// </summary>
public static class AutoCloseCheckerTypes
{
    public const string OnlineChecker = "OnlineChecker";
    public const string AlarmCleared = "AlarmCleared";
    public const string StatusChecker = "StatusChecker";
    public const string Custom = "Custom";

    public static readonly string[] All = new[]
    {
        OnlineChecker,
        AlarmCleared,
        StatusChecker,
        Custom
    };
}
