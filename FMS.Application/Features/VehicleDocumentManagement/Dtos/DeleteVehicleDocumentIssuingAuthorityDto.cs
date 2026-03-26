/**
 * File: DeleteVehicleDocumentIssuingAuthorityDto.cs
 * Purpose: Carries the issuing authority name targeted for removal from persisted vehicle document records.
 * Dependencies: None.
 * Last Modified: 2026-03-25
 */
namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class DeleteVehicleDocumentIssuingAuthorityDto
{
    public string Name { get; set; } = string.Empty;
}