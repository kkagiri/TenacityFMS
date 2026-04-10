/**
 * File: VehicleDocumentIssuingAuthorityDto.cs
 * Purpose: Represents a persisted issuing authority usage summary across vehicle documents and compliance requirements.
 * Dependencies: None.
 * Last Modified: 2026-04-09
 */

using System.Collections.Generic;
namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleDocumentIssuingAuthorityDto
{
    public string Name { get; set; } = string.Empty;
    public int DocumentUsageCount { get; set; }
    public int RequirementUsageCount { get; set; }
    public List<int> AssociatedComplianceCategories { get; set; } = new();
    public int TotalUsageCount => DocumentUsageCount + RequirementUsageCount;
}