/**
 * File: VehicleTransferCheckupTemplateItemDTO.cs
 * Purpose: API DTO for admin-managed vehicle transfer checkup template rows.
 * Dependencies: None
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - VehicleTransferCheckupTemplateItemDTO: Read model for listing template rows and criteria.
 */
using System;

namespace FMS.Application.Features.VehicleTransfer.DTOs;

/// <summary>
/// DTO used for reading checkup template row definitions.
/// </summary>
public class VehicleTransferCheckupTemplateItemDTO
{
    public int Id { get; set; }
    public int SerialNo { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? CheckType { get; set; }
    public int? VehicleTypeId { get; set; }
    public string? VehicleTypeName { get; set; }
    public int? VehicleModelId { get; set; }
    public string? VehicleModelName { get; set; }
    public bool? HasGps { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
}
