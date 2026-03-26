/**
 * File: RenameVehicleDocumentIssuingAuthorityDto.cs
 * Purpose: Carries the old and new issuing authority names for authority management updates.
 * Dependencies: None.
 * Last Modified: 2026-03-25
 */
namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class RenameVehicleDocumentIssuingAuthorityDto
{
    public string OldName { get; set; } = string.Empty;
    public string NewName { get; set; } = string.Empty;
}