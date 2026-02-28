/**
 * File: VehicleTransferCheckupTemplate.cs
 * Purpose: Persistence model for admin-managed vehicle transfer checkup template rows.
 * Dependencies: FMS.Domain.Entities.Vehiclemodel, FMS.Domain.Entities.Vehicletype
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - VehicleTransferCheckupTemplate: Stores reusable inspection row definitions with optional vehicle criteria.
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Persistence.Models;

/// <summary>
/// Database-backed template row for Vehicle Transfer inspection checklist.
/// </summary>
public class VehicleTransferCheckupTemplate
{
    public int Id { get; set; }
    public int SerialNo { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? CheckType { get; set; }

    /// <summary>
    /// Optional match criteria by vehicle type.
    /// Null means applies to all types.
    /// </summary>
    public int? VehicleTypeId { get; set; }

    /// <summary>
    /// Optional match criteria by vehicle model.
    /// Null means applies to all models.
    /// </summary>
    public int? VehicleModelId { get; set; }

    /// <summary>
    /// Optional match criteria by GPS availability.
    /// Null means applies regardless of GPS.
    /// </summary>
    public bool? HasGps { get; set; }

    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime DateCreated { get; set; } = DateTime.UtcNow;
    public DateTime? DateModified { get; set; }

    public virtual Vehicletype? VehicleType { get; set; }
    public virtual Vehiclemodel? VehicleModel { get; set; }
}
