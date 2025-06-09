using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using FMS.Domain.Entities.Auth;
using FMS.Domain.Entities.Reports;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace FMS.Domain.Entities;

public partial class User : IdentityUser {

    public bool? IsDeleted { get; set; }

    public int? MasterRFIDTag { get; set; }

    public virtual Tag MasterTags { get; set; } //Navigation

    public virtual ICollection<UserSites> UserSites { get; set; } = new List<UserSites> ();
    public virtual ICollection<Delivery> Deliveries { get; set; } = new List<Delivery> ();

    public virtual ICollection<Employee> EmployeeCreatedByNavigations { get; set; } = new List<Employee> ();

    public virtual ICollection<Employee> EmployeeModifiedByNavigations { get; set; } = new List<Employee> ();

    public virtual ICollection<FuelRefill> Fuelrefils { get; set; } = new List<FuelRefill> ();
    [NotMapped]

    public virtual ICollection<Issueassignmenttracker> IssueassignmenttrackerAssignedFromNavigations { get; set; } = new List<Issueassignmenttracker> ();
    [NotMapped]

    public virtual ICollection<Issueassignmenttracker> IssueassignmenttrackerAssignedToNavigations { get; set; } = new List<Issueassignmenttracker> ();
    [NotMapped]

    public virtual ICollection<Issuetracker> IssuetrackerAssignToNavigations { get; set; } = new List<Issuetracker> ();
    [NotMapped]

    public virtual ICollection<Issuetracker> IssuetrackerOpenbyNavigations { get; set; } = new List<Issuetracker> ();

    public virtual ICollection<Loginactivity> Loginactivities { get; set; } = new List<Loginactivity> ();

    public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock> ();

    public virtual ICollection<UserActivity> UserActivities { get; set; } = new List<UserActivity> ();
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole> ();

    public virtual ICollection<Role> Roles { get; set; } = new List<Role> ();

    public virtual ICollection<Site> Sites { get; set; } = new List<Site> ();

    public virtual ICollection<TankTransfer> TankTransfers { get; set; } = new List<TankTransfer> ();

    public virtual ICollection<TankVolumeHistory> TankVolumeHistories { get; set; } = new List<TankVolumeHistory> ();

    public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle> ();
}