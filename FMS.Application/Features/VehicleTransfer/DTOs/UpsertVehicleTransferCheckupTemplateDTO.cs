/**
 * File: UpsertVehicleTransferCheckupTemplateDTO.cs
 * Purpose: Input DTO for create/update operations on transfer checkup template rows.
 * Dependencies: System.ComponentModel.DataAnnotations
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - UpsertVehicleTransferCheckupTemplateDTO: Carries editable row fields and optional vehicle criteria.
 */
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.VehicleTransfer.DTOs;

/// <summary>
/// DTO used for both create and update actions.
/// </summary>
public class UpsertVehicleTransferCheckupTemplateDTO
{
    public int? SerialNo { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? CheckType { get; set; }

    public int? VehicleTypeId { get; set; }
    public int? VehicleModelId { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}
