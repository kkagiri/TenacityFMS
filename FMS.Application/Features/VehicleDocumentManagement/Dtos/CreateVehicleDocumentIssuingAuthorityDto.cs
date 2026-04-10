/**
 * File: CreateVehicleDocumentIssuingAuthorityDto.cs
 * Purpose: Captures a new issuing authority and the compliance category it should default for.
 * Dependencies: None.
 * Last Modified: 2026-04-09
 */
namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class CreateVehicleDocumentIssuingAuthorityDto
{
    public string Name { get; set; } = string.Empty;
    public int ComplianceCategory { get; set; }
}