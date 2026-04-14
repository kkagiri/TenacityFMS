using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using FMS.Domain.Entities.Auth;
using FMS.Domain.Entities.Features.ErrorManagement;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Domain.Entities.Features.UserManagement;
using FMS.Domain.Entities.Reports;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using FMS.Domain.Entities.Features.VehicleManagement;

namespace FMS.Domain.Entities;

public partial class User : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    public bool? IsDeleted { get; set; }

    public int? MasterRFIDTag { get; set; }

    /// <summary>
    /// Foreign key to the Department entity
    /// </summary>
    public int? DepartmentId { get; set; }

    /// <summary>
    /// When true, this user can bypass GPS/location validation during mobile fueling.
    /// Useful for users operating in areas with poor GPS/network coverage.
    /// </summary>
    public bool BypassLocationValidation { get; set; }

    /// <summary>
    /// When true, the user must change their password after the first successful login.
    /// Used for temporary passwords issued during account onboarding.
    /// </summary>
    public bool RequirePasswordChangeOnFirstLogin { get; set; }
    public virtual ICollection<ErrorLog> ErrorLogs { get; set; } = new List<ErrorLog>();
    public virtual FuelTag? MasterTags { get; set; } //Navigation

    /// <summary>
    /// Navigation property for the user's department
    /// </summary>
    public virtual Department? Department { get; set; }

    public virtual ICollection<UserSites> UserSites { get; set; } = new List<UserSites>();
    public virtual ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();

    public virtual ICollection<Employee> EmployeeCreatedByNavigations { get; set; } = new List<Employee>();

    public virtual ICollection<Employee> EmployeeModifiedByNavigations { get; set; } = new List<Employee>();

    public virtual ICollection<FuelRefill> Fuelrefils { get; set; } = new List<FuelRefill>();
    [NotMapped]

    public virtual ICollection<Issueassignmenttracker> IssueassignmenttrackerAssignedFromNavigations { get; set; } = new List<Issueassignmenttracker>();
    [NotMapped]

    public virtual ICollection<Issueassignmenttracker> IssueassignmenttrackerAssignedToNavigations { get; set; } = new List<Issueassignmenttracker>();
    [NotMapped]

    public virtual ICollection<Issuetracker> IssuetrackerAssignToNavigations { get; set; } = new List<Issuetracker>();
    [NotMapped]

    public virtual ICollection<Issuetracker> IssuetrackerOpenbyNavigations { get; set; } = new List<Issuetracker>();

    public virtual ICollection<Loginactivity> Loginactivities { get; set; } = new List<Loginactivity>();

    public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock>();
    //public virtual ICollection<VehicleMaintenance> VehicleMaintenanceCreated { get; set; } = new List<VehicleMaintenance>();
    // public virtual ICollection<VehicleMaintenance> VehicleMaintenanceModified { get; set; } = new List<VehicleMaintenance>();
    public virtual ICollection<UserActivity> UserActivities { get; set; } = new List<UserActivity>();
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();

    public virtual ICollection<Site> Sites { get; set; } = new List<Site>();

    public virtual ICollection<TankTransfer> TankTransfers { get; set; } = new List<TankTransfer>();

    public virtual ICollection<TankVolumeHistory> TankVolumeHistories { get; set; } = new List<TankVolumeHistory>();

    [NotMapped]
    public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();

    public virtual ICollection<StockReport> StockReports { get; set; } = new List<StockReport>();

    // Add these to the User entity navigation properties:
    public virtual ICollection<StockAdjustment> StockAdjustmentsCreated { get; set; } = new List<StockAdjustment>();
    public virtual ICollection<StockAdjustment> StockAdjustmentsApproved { get; set; } = new List<StockAdjustment>();
    public virtual ICollection<StockAdjustment> StockAdjustmentsDeleted { get; set; } = new List<StockAdjustment>();
    public virtual ICollection<Delivery> DeliveriesDeleted { get; set; } = new List<Delivery>();
    public virtual ICollection<FuelRefill> FuelRefillsDeleted { get; set; } = new List<FuelRefill>();
    public virtual ICollection<TankTransfer> TankTransfersDeleted { get; set; } = new List<TankTransfer>();
}