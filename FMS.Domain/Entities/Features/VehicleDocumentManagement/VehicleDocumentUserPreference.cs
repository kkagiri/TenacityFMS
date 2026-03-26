/**
 * File: VehicleDocumentUserPreference.cs
 * Purpose: Stores per-user default reminder lead days for vehicle document compliance categories.
 * Dependencies: Vehicle compliance enums and user entity relationships.
 * Last Modified: 2026-03-25
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Domain.Entities.Features.VehicleDocumentManagement;

public class VehicleDocumentUserPreference
{
    public Guid Id { get; private set; }
    public string UserId { get; private set; }
    public VehicleComplianceCategory ComplianceCategory { get; private set; }
    public int ReminderLeadDays { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public string? UpdatedBy { get; private set; }

    public virtual User User { get; private set; }
    public virtual User CreatedByNavigation { get; private set; }
    public virtual User? UpdatedByNavigation { get; private set; }

    private VehicleDocumentUserPreference()
    {
        UserId = string.Empty;
        CreatedBy = string.Empty;
        User = null!;
        CreatedByNavigation = null!;
    }

    public VehicleDocumentUserPreference(
        string userId,
        VehicleComplianceCategory complianceCategory,
        int reminderLeadDays,
        string createdBy)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        ComplianceCategory = complianceCategory;
        ReminderLeadDays = NormalizeReminderLeadDays(reminderLeadDays);
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateReminderLeadDays(int reminderLeadDays, string updatedBy)
    {
        ReminderLeadDays = NormalizeReminderLeadDays(reminderLeadDays);
        UpdatedBy = updatedBy;
        UpdatedAt = DateTime.UtcNow;
    }

    private static int NormalizeReminderLeadDays(int reminderLeadDays)
    {
        if (reminderLeadDays < 0)
        {
            return 0;
        }

        return reminderLeadDays > 365 ? 365 : reminderLeadDays;
    }
}