/**
 * File: EmployeeDocument.cs
 * Purpose: Stores employee-scoped operational and compliance documents such as driving licenses.
 * Dependencies: Employee, EmployeeDocumentType, DocumentStatus
 * Last Modified: 2026-03-25
 */
using System;

namespace FMS.Domain.Entities;

public class EmployeeDocument
{
    public Guid Id { get; private set; }
    public int EmployeeId { get; private set; }
    public EmployeeDocumentType DocumentType { get; private set; }
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
    public string? UpdatedBy { get; private set; }

    public virtual Employee Employee { get; private set; } = null!;

    public int DaysUntilExpiry => (ExpiryDate.Date - DateTime.UtcNow.Date).Days;
    public bool IsExpired => DateTime.UtcNow.Date > ExpiryDate.Date;
    public bool IsExpiringSoon => DaysUntilExpiry <= AlertLeadDays && !IsExpired;

    private EmployeeDocument()
    {
        DocumentNumber = string.Empty;
        IssuingAuthority = string.Empty;
        Notes = string.Empty;
        DocumentFileName = string.Empty;
        DocumentFileUrl = string.Empty;
        CreatedBy = string.Empty;
    }

    public EmployeeDocument(
        int employeeId,
        EmployeeDocumentType documentType,
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
        EmployeeId = employeeId;
        DocumentType = documentType;
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
        EmployeeDocumentType documentType,
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

    private static int NormalizeAlertLeadDays(int alertLeadDays)
    {
        if (alertLeadDays < 0)
        {
            return 0;
        }

        return alertLeadDays > 365 ? 365 : alertLeadDays;
    }
}