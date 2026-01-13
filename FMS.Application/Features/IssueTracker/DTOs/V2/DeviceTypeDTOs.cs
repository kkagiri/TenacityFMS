using System;

namespace FMS.Application.Features.IssueTracker.DTOs.V2;

/// <summary>
/// Device Type DTO for Issue Tracker v2
/// </summary>
public class DeviceTypeDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsMonitored { get; set; }
    public string? MonitoringEndpoint { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation count for UI
    public int TemplateCount { get; set; }
}

/// <summary>
/// Create/Update Device Type Request DTO
/// </summary>
public class CreateDeviceTypeDTO
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsMonitored { get; set; }
    public string? MonitoringEndpoint { get; set; }
}

/// <summary>
/// Update Device Type Request DTO
/// </summary>
public class UpdateDeviceTypeDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsMonitored { get; set; }
    public string? MonitoringEndpoint { get; set; }
}
