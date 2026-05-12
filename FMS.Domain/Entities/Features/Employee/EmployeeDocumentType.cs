/**
 * File: EmployeeDocumentType.cs
 * Purpose: Enumerates supported employee document types for compliance and HR operations.
 * Dependencies: None
 * Last Modified: 2026-03-25
 */
namespace FMS.Domain.Entities;

public enum EmployeeDocumentType
{
    DrivingLicense = 1,
    NationalId = 2,
    MedicalCertificate = 3,
    EmploymentContract = 4,
    TrainingCertificate = 5,
    Other = 99
}