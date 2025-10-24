using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.FuelRule;

namespace FMS.Domain.Entities;

/// <summary>
/// Site entity representing fuel management sites
/// </summary>
public partial class Site
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    /// <summary>
    /// Indicates whether the site is active for fuel reporting
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Site Administrator ID - mandatory field for notification routing
    /// </summary>
    public string? SiteAdministratorId { get; set; }

    public virtual ICollection<StockReport> StockReports { get; set; } = new List<StockReport>();

    public virtual ICollection<FuelingRule> FuelingRules { get; set; } = new List<FuelingRule>();

    public virtual ICollection<UserSites> UserSites { get; set; } = new List<UserSites>();

    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual ICollection<Expectedaverage> Expectedaverages { get; set; } = new List<Expectedaverage>();

    public virtual ICollection<FuelRefill> Fuelrefils { get; set; } = new List<FuelRefill>();

    public virtual ICollection<Issuetracker> Issuetrackers { get; set; } = new List<Issuetracker>();

    public virtual ICollection<Ptsdevice> Ptsdevices { get; set; } = new List<Ptsdevice>();

    public virtual ICollection<Tank> Tanks { get; set; } = new List<Tank>();

    public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock>();

    public virtual ICollection<Vehicleconsumption> Vehicleconsumptions { get; set; } = new List<Vehicleconsumption>();

    public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();

    // Add this to the Site entity navigation properties:
    public virtual ICollection<StockAdjustment> StockAdjustments { get; set; } = new List<StockAdjustment>();

    // Navigation property for Site Administrator
    public virtual User? SiteAdministrator { get; set; }
}