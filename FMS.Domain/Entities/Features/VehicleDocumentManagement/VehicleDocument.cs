using FMS.Domain.Entities.Features;

namespace FMS.Domain.Entities.Features.VehicleDocumentManagement;

public class VehicleDocument
{
    public Guid Id { get; private set; }
    public int VehicleId { get; private set; }
    public VehicleDocumentType DocumentType { get; private set; }
    public string DocumentNumber { get; private set; }
    public DateTime IssueDate { get; private set; }
    public DateTime ExpiryDate { get; private set; }
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
    public bool IsExpiringSoon => DaysUntilExpiry <= 30 && !IsExpired;

    // Private constructor for EF
    private VehicleDocument() { }

    public VehicleDocument(
        int vehicleId,
        VehicleDocumentType documentType,
        string documentNumber,
        DateTime issueDate,
        DateTime expiryDate,
        string issuingAuthority,
        string notes,
        string documentFileName,
        string documentFileUrl,
        string createdBy)
    {
        Id = Guid.NewGuid();
        VehicleId = vehicleId;
        DocumentType = documentType;
        DocumentNumber = documentNumber;
        IssueDate = issueDate;
        ExpiryDate = expiryDate;
        IssuingAuthority = issuingAuthority;
        Notes = notes;
        DocumentFileName = documentFileName;
        DocumentFileUrl = documentFileUrl;
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
        UpdateStatus();
    }

    public void Update(
        string documentNumber,
        DateTime issueDate,
        DateTime expiryDate,
        string issuingAuthority,
        string notes,
        string documentFileName,
        string documentFileUrl,
        string updatedBy)
    {
        DocumentNumber = documentNumber;
        IssueDate = issueDate;
        ExpiryDate = expiryDate;
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
        else if ((ExpiryDate.Date - DateTime.UtcNow.Date).Days <= 30)
        {
            Status = DocumentStatus.ExpiringSoon;
        }
        else
        {
            Status = DocumentStatus.Valid;
        }
    }
}
