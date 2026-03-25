namespace FMS.Domain.Entities;

/// <summary>
/// Dedicated compliance categories for vehicle operations and reporting.
/// These categories sit above the legacy document type enum so dashboards and requirement assignments can use operational language.
/// </summary>
public enum VehicleComplianceCategory
{
    InsuranceCertificate = 1,
    VehicleRegistration = 2,
    NtsaInspectionCertificate = 3,
    KenhaRoadPermit = 4,
    KenhaPermitExemption = 5,
    SpeedGovernorCertificate = 6,
    DrivingLicense = 7,
    Other = 99
}
