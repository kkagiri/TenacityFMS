using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

/// <summary>
/// 			
/// </summary>
public partial class Site
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<UserSites> UserSites { get; set; } = new List<UserSites>();

    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual ICollection<Expectedaverage> Expectedaverages { get; set; } = new List<Expectedaverage>();

    public virtual ICollection<Fuelrefil> Fuelrefils { get; set; } = new List<Fuelrefil>();

    public virtual ICollection<Issuetracker> Issuetrackers { get; set; } = new List<Issuetracker>();

    public virtual ICollection<Ptsdevice> Ptsdevices { get; set; } = new List<Ptsdevice>();

    public virtual ICollection<Tank> Tanks { get; set; } = new List<Tank>();

    public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock>();

    public virtual ICollection<Vehicleconsumption> Vehicleconsumptions { get; set; } = new List<Vehicleconsumption>();

    public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
