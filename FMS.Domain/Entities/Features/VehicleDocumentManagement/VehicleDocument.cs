using FMS.Domain.Entities.Features;

namespace FMS.Domain.Entities.Features.VehicleDocumentManagement;

public class VehicleDocument
{
    public Guid Id { get; private set; }
    public int VehicleId { get; private set; }
    public VehicleDocumentType DocumentType { get; private set; }
    public VehicleComplianceCategory ComplianceCategory { get; private set; }
    public string DocumentNumber { get; private set; }
    public DateTime IssueDate { get; private set; }
    public DateTime ExpiryDate { get; private set; }
    public int AlertLeadDays { get; private set; }
    public string IssuingAuthority { get; private set; }
    public string Notes { get; private set; }
    public string DocumentFileName { get; private set; }
    public string DocumentFileUrl { get; private set; }
    public DocumentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public string UpdatedBy { get; private set; }

    // Navigation
    public virtual Vehicle Vehicle { get; private set; }

    // Computed properties
    public int DaysUntilExpiry => (ExpiryDate.Date - DateTime.UtcNow.Date).Days;
    public bool IsExpired => DateTime.UtcNow.Date > ExpiryDate.Date;
    public bool IsExpiringSoon => DaysUntilExpiry <= AlertLeadDays && !IsExpired;

    // Private constructor for EF
    private VehicleDocument() { }

    public VehicleDocument(
        int vehicleId,
        VehicleDocumentType documentType,
        VehicleComplianceCategory complianceCategory,
        string documentNumber,
        DateTime issueDate,
        DateTime expiryDate,
        int alertLeadDays,
        string issuingAuthority,
        string notes,
        string documentFileName,
        string documentFileUrl,
        string createdBy)
    {
        Id = Guid.NewGuid();
        VehicleId = vehicleId;
        DocumentType = documentType;
        ComplianceCategory = complianceCategory;
        DocumentNumber = documentNumber;
        IssueDate = issueDate;
        ExpiryDate = expiryDate;
        AlertLeadDays = NormalizeAlertLeadDays(alertLeadDays);
        IssuingAuthority = issuingAuthority;
        Notes = notes;
        DocumentFileName = documentFileName;
        DocumentFileUrl = documentFileUrl;
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
        UpdateStatus();
    }

    public void Update(
        VehicleDocumentType documentType,
        VehicleComplianceCategory complianceCategory,
        string documentNumber,
        DateTime issueDate,
        DateTime expiryDate,
        int alertLeadDays,
        string issuingAuthority,
        string notes,
        string documentFileName,
        string documentFileUrl,
        string updatedBy)
    {
        DocumentType = documentType;
        ComplianceCategory = complianceCategory;
        DocumentNumber = documentNumber;
        IssueDate = issueDate;
        ExpiryDate = expiryDate;
        AlertLeadDays = NormalizeAlertLeadDays(alertLeadDays);
        IssuingAuthority = issuingAuthority;
        Notes = notes;
        DocumentFileName = documentFileName;
        DocumentFileUrl = documentFileUrl;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
        UpdateStatus();
    }

    public void UpdateStatus()
    {
        if (DateTime.UtcNow.Date > ExpiryDate.Date)
        {
            Status = DocumentStatus.Expired;
        }
        else if ((ExpiryDate.Date - DateTime.UtcNow.Date).Days <= AlertLeadDays)
        {
            Status = DocumentStatus.ExpiringSoon;
        }
        else
        {
            Status = DocumentStatus.Valid;
        }
    }

    public static VehicleComplianceCategory ResolveComplianceCategory(VehicleDocumentType documentType, VehicleComplianceCategory? complianceCategory = null)
    {
        if (complianceCategory.HasValue)
        {
            return complianceCategory.Value;
        }

        return documentType switch
        {
            VehicleDocumentType.Insurance => VehicleComplianceCategory.InsuranceCertificate,
            VehicleDocumentType.Registration => VehicleComplianceCategory.VehicleRegistration,
            VehicleDocumentType.Inspection => VehicleComplianceCategory.NtsaInspectionCertificate,
            VehicleDocumentType.RoadPermit => VehicleComplianceCategory.KenhaRoadPermit,
            _ => VehicleComplianceCategory.Other
        };
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
