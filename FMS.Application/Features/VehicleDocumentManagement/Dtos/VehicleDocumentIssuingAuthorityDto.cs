/**
 * File: VehicleDocumentIssuingAuthorityDto.cs
 * Purpose: Represents a persisted issuing authority usage summary across vehicle documents and compliance requirements.
 * Dependencies: None.
 * Last Modified: 2026-03-25
 */
namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class VehicleDocumentIssuingAuthorityDto
{
    public string Name { get; set; } = string.Empty;
    public int DocumentUsageCount { get; set; }
    public int RequirementUsageCount { get; set; }
    public int TotalUsageCount => DocumentUsageCount + RequirementUsageCount;
}