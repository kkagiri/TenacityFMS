/**
 * File: Site.cs
 * Purpose: Site aggregate for project/workspace configuration and related operational data.
 * Dependencies: User, GPSGate geofence, fuel/tank/vehicle entities.
 * Last Modified: 2026-02-26
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;

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

    /// <summary>
    /// GPSGate Tag ID for this site - used for vehicle tracking assignments
    /// </summary>
    public int? GpsGateTagId { get; set; }

    /// <summary>
    /// GPSGate Tag Name (e.g., "HE_Meru", "HE_Fujita") for display purposes
    /// </summary>
    public string? GpsGateTagName { get; set; }

    /// <summary>
    /// Whether to automatically update GPSGate tag when vehicles are transferred to this site
    /// </summary>
    public bool AutoUpdateGpsGateTag { get; set; } = true;

    /// <summary>
    /// Selected GPSGate geofence local ID from cached gps_geofence table.
    /// </summary>
    public int? GpsGeofenceId { get; set; }

    /// <summary>
    /// Selected GPSGate geofence display name snapshot.
    /// </summary>
    public string? GpsGeofenceName { get; set; }

    /// <summary>
    /// Selected GPSGate geofence type snapshot (Circle, Polygon, Route).
    /// </summary>
    public string? GpsGeofenceType { get; set; }

    /// <summary>
    /// Selected GPSGate geofence center latitude snapshot.
    /// </summary>
    public decimal? GpsGeofenceCenterLatitude { get; set; }

    /// <summary>
    /// Selected GPSGate geofence center longitude snapshot.
    /// </summary>
    public decimal? GpsGeofenceCenterLongitude { get; set; }

    /// <summary>
    /// Operational classification of this site (Parking, Load, Dump, Fuel, Workshop).
    /// Used for geofence-based trip detection labelling.
    /// </summary>
    public SiteClassification Classification { get; set; } = SiteClassification.Unknown;

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

    public virtual ICollection<StockAdjustment> StockAdjustments { get; set; } = new List<StockAdjustment>();

    // Navigation property for Site Administrator
    public virtual User? SiteAdministrator { get; set; }

    // Navigation property for selected GPS geofence
    public virtual GpsGeofence? GpsGeofence { get; set; }
}
