using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.FuelRuleSet;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSetAssignments.DTOs;

/// <summary>
/// DTO for FuelingRuleSetAssignment - used for Create/Update operations
/// </summary>
public class FuelingRuleSetAssignmentDTO
{
    public int Id { get; set; }
    public int FuelingRuleSetId { get; set; }
    public AssignmentTargetType TargetType { get; set; }
    public int? SiteId { get; set; }
    public int? VehicleTypeId { get; set; }
    public int? VehicleId { get; set; }
    public int? TagId { get; set; }
    public int? Priority { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Response DTO with additional display information
/// </summary>
public class FuelingRuleSetAssignmentResponseDTO
{
    public int Id { get; set; }
    public int FuelingRuleSetId { get; set; }
    public string? RuleSetName { get; set; }
    public AssignmentTargetType TargetType { get; set; }
    public string TargetTypeName => TargetType.ToString();

    public int? SiteId { get; set; }
    public string? SiteName { get; set; }

    public int? VehicleTypeId { get; set; }
    public string? VehicleTypeName { get; set; }

    public int? VehicleId { get; set; }
    public string? VehicleCode { get; set; }

    public int? TagId { get; set; }
    public string? TagName { get; set; }

    public int Priority { get; set; }
    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// Human-readable display name for the target
    /// </summary>
    public string TargetDisplayName { get; set; } = string.Empty;
}

/// <summary>
/// Bulk assignment DTO for assigning a rule set to multiple targets at once
/// </summary>
public class BulkAssignmentDTO
{
    public int FuelingRuleSetId { get; set; }
    public AssignmentTargetType TargetType { get; set; }

    /// <summary>
    /// List of target IDs to assign the rule set to
    /// </summary>
    public List<int> TargetIds { get; set; } = new();

    /// <summary>
    /// Optional custom priority (uses default if not specified)
    /// </summary>
    public int? Priority { get; set; }
}
