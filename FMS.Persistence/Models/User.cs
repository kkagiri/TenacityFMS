// using System;
// using System.Collections.Generic;

// namespace FMS.Domain.Entities;

// public partial class User
// {
//     public string Id { get; set; } = null!;

//     public string UserName { get; set; } = null!;

//     public string? NormalizedUserName { get; set; }

//     public string? Email { get; set; }

//     public string? NormalizedEmail { get; set; }

//     public bool EmailConfirmed { get; set; }

//     public string? PasswordHash { get; set; }

//     public string? SecurityStamp { get; set; }

//     public string? ConcurrencyStamp { get; set; }

//     public string? PhoneNumber { get; set; }

//     public bool PhoneNumberConfirmed { get; set; }

//     public bool TwoFactorEnabled { get; set; }

//     public DateTime? LockoutEnd { get; set; }

//     public bool LockoutEnabled { get; set; }

//     public int AccessFailedCount { get; set; }

//     public bool? IsDeleted { get; set; }

//     public virtual ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();

//     public virtual ICollection<Employee> EmployeeCreatedByNavigations { get; set; } = new List<Employee>();

//     public virtual ICollection<Employee> EmployeeModifiedByNavigations { get; set; } = new List<Employee>();

//     public virtual ICollection<Fuelrefil> Fuelrefils { get; set; } = new List<Fuelrefil>();

//     public virtual ICollection<Issueassignmenttracker> IssueassignmenttrackerAssignedFromNavigations { get; set; } = new List<Issueassignmenttracker>();

//     public virtual ICollection<Issueassignmenttracker> IssueassignmenttrackerAssignedToNavigations { get; set; } = new List<Issueassignmenttracker>();

//     public virtual ICollection<Issuetracker> IssuetrackerAssignToNavigations { get; set; } = new List<Issuetracker>();

//     public virtual ICollection<Issuetracker> IssuetrackerOpenbyNavigations { get; set; } = new List<Issuetracker>();

//     public virtual ICollection<Loginactivity> Loginactivities { get; set; } = new List<Loginactivity>();

//     public virtual ICollection<Reportitem> ReportitemCreatedByNavigations { get; set; } = new List<Reportitem>();

//     public virtual ICollection<Reportitem> ReportitemUpdatedByNavigations { get; set; } = new List<Reportitem>();

//     public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock>();

//     public virtual ICollection<Tanktransfer> Tanktransfers { get; set; } = new List<Tanktransfer>();

//     public virtual ICollection<Tankvolumehistory> Tankvolumehistories { get; set; } = new List<Tankvolumehistory>();

//     public virtual ICollection<UserActivity> UserActivities { get; set; } = new List<UserActivity>();

//     public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();

//     public virtual ICollection<Role> Roles { get; set; } = new List<Role>();

//     public virtual ICollection<Site> Sites { get; set; } = new List<Site>();
// }
