using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;

namespace FMS.Domain.Entities;

public partial class Vehicle
{

    /// <summary>
    /// THis is company Regirstrato NO for vehicle `
    /// </summary>
    public string HyoungNo { get; set; } = null!;

    public int VehicleId { get; set; }

    public int? VehicleTypeId { get; set; }

    public int? VehicleModelId { get; set; }

    public int? VehicleManufacturerId { get; set; }

    public string? Yom { get; set; }

    /// <summary>
    /// [DEPRECATED] Use VehicleProviderMapping instead. This field will be removed in a future version.
    /// Legacy device ID reference. Use VehicleProviderMapping.ExternalDeviceId for multi-provider support.
    /// </summary>
    [Obsolete("Use VehicleProviderMapping.ExternalDeviceId for GPS device tracking. This field will be removed in a future version.")]
    public int? DeviceId { get; set; }

    public int? DefaultEmployeeId { get; set; }

    public int? WorkingSiteId { get; set; }

    public decimal? ExcessWorkingHrCost { get; set; }

    public string? NumberPlate { get; set; }

    public bool AverageKmL { get; set; }

    public decimal? FuelTankCapacity { get; set; }

    public bool? IsFullTankPolicy { get; set; }

    /// <summary>
    /// [DEPRECATED] Use VehicleProviderMapping instead. This field will be removed in a future version.
    /// Check VehicleProviderMapping.IsActive to determine if vehicle has GPS tracking enabled.
    /// </summary>
    [Obsolete("Use VehicleProviderMapping to manage GPS tracking. This field will be removed in a future version.")]
    public sbyte? HasGPSInstalled { get; set; }

    public string? Passenger { get; set; }
    public string? CurrentPhysicalReading { get; set; }
    public sbyte? IsCompanyVehicle { get; set; }

    public sbyte? IsActive { get; set; }

    /// <summary>
    /// [DEPRECATED] Use VehicleProviderMapping instead. This field will be removed in a future version.
    /// Legacy GPSGate-specific flag. Use VehicleProviderMapping.ExternalDeviceId for multi-provider support.
    /// </summary>
    [Obsolete("Use VehicleProviderMapping.ExternalDeviceId for GPS device tracking. This field will be removed in a future version.")]
    public sbyte? GpsgategeneratedId { get; set; }
    public virtual ICollection<VehicleDocument> VehicleDocuments { get; private set; } = new List<VehicleDocument>();

    public int? DefaultExptdAvgid { get; set; }

    // Added properties based on schema
    public DateTime? DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
    public string? CreatedBy { get; set; }

    public virtual ICollection<Calibrationdatum> Calibrationdata { get; set; } = new List<Calibrationdatum>();

    // One-to-many relationship mapping.
    // This is the principal navigation that pairs with Employee.Vehicles.

    [NotMapped]
    public virtual Employee? DefaultEmployee { get; set; }

    [NotMapped]
    public virtual Expectedaverage? DefaultExptdAvg { get; set; }

    //public virtual GPSDevice? Device { get; set; }

    public virtual ICollection<Expectedaverage> Expectedaverages { get; set; } = new List<Expectedaverage>();

    public virtual ICollection<FuelRefill> Fuelrefils { get; set; } = new List<FuelRefill>();

    public virtual ICollection<Issuetracker> Issuetrackers { get; set; } = new List<Issuetracker>();

    public virtual Vehiclemanufacturer? VehicleManufacturer { get; set; }

    public virtual User? ModifiedByNavigation { get; set; }
    public string? ModifiedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Vehiclemodel? VehicleModel { get; set; }

    public virtual Vehicletype? VehicleType { get; set; }

    public virtual ICollection<FuelingRule> FuelingRules { get; set; } = new List<FuelingRule>();

    public virtual ICollection<Vehicleconsumption> Vehicleconsumptions { get; set; } = new List<Vehicleconsumption>();

    public virtual Site? WorkingSite { get; set; }

    // Many-to-many relationship with Employee through EmployeeVehicle
    public virtual ICollection<EmployeeVehicle> EmployeeVehicles { get; set; } = new List<EmployeeVehicle>();

    // Many-to-many relationship mapping.
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual ICollection<Pumptransaction> Pumptransactions { get; set; } = new List<Pumptransaction>();
    public virtual ICollection<FuelTag> Tags { get; set; } = new List<FuelTag>();

}