using System;
using FMS.Domain.Entities.Features.VehicleManagement;

namespace FMS.Domain.Entities.Features.VehicleDocumentManagement;

/// <summary>
/// Defines a compliance requirement that applies to vehicles through either site or vehicle type assignment.
/// </summary>
public class VehicleComplianceRequirement
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public VehicleComplianceCategory ComplianceCategory { get; private set; }
    public VehicleDocumentType DocumentType { get; private set; }
    public VehicleComplianceTargetType TargetType { get; private set; }
    public int? SiteId { get; private set; }
    public int? VehicleTypeId { get; private set; }
    public int AlertLeadDays { get; private set; }
    public string DefaultIssuingAuthority { get; private set; }
    public string Notes { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public string? UpdatedBy { get; private set; }

    public virtual Site? Site { get; private set; }
    public virtual Vehicletype? VehicleType { get; private set; }

    private VehicleComplianceRequirement()
    {
        Name = string.Empty;
        DefaultIssuingAuthority = string.Empty;
        Notes = string.Empty;
        CreatedBy = string.Empty;
    }

    public VehicleComplianceRequirement(
        string name,
        VehicleComplianceCategory complianceCategory,
        VehicleDocumentType documentType,
        VehicleComplianceTargetType targetType,
        int? siteId,
        int? vehicleTypeId,
        int alertLeadDays,
        string defaultIssuingAuthority,
        string notes,
        string createdBy)
    {
        Id = Guid.NewGuid();
        Name = name;
        ComplianceCategory = complianceCategory;
        DocumentType = documentType;
        TargetType = targetType;
        SiteId = targetType == VehicleComplianceTargetType.Site ? siteId : null;
        VehicleTypeId = targetType == VehicleComplianceTargetType.VehicleType ? vehicleTypeId : null;
        AlertLeadDays = NormalizeAlertLeadDays(alertLeadDays);
        DefaultIssuingAuthority = defaultIssuingAuthority;
        Notes = notes;
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
        IsActive = true;
    }

    public void Update(
        string name,
        VehicleComplianceCategory complianceCategory,
        VehicleDocumentType documentType,
        int alertLeadDays,
        string defaultIssuingAuthority,
        string notes,
        string updatedBy)
    {
        Name = name;
        ComplianceCategory = complianceCategory;
        DocumentType = documentType;
        AlertLeadDays = NormalizeAlertLeadDays(alertLeadDays);
        DefaultIssuingAuthority = defaultIssuingAuthority;
        Notes = notes;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate(string updatedBy)
    {
        IsActive = false;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    private static int NormalizeAlertLeadDays(int alertLeadDays)
    {
        if (alertLeadDays < 0)
        {
            return 0;
        }

        return alertLeadDays > 365 ? 365 : alertLeadDays;
    }
}
