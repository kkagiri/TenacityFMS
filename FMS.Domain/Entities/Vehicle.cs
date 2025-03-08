using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities;

public partial class Vehicle
{
    public string HyoungNo { get; set; } = null!;

    public int VehicleId { get; set; }

    public int? VehicleTypeId { get; set; }

    public int? VehicleModelId { get; set; }

    public int? VehicleManufacturerId { get; set; }

    public string? Yom { get; set; }

    public int? DeviceId { get; set; }

    public int? DefaultEmployeeId { get; set; }

    public int? WorkingSiteId { get; set; }

    public decimal? ExcessWorkingHrCost { get; set; }

    public string? NumberPlate { get; set; }

    public bool AverageKmL { get; set; }

    public string? Capacity { get; set; }
    public sbyte? HasGPSInstalled { get; set; }


    public string? Passenger { get; set; }
    public string? CurrentPhysicalReading { get; set; }

    public sbyte? GpsgategeneratedId { get; set; }

    public int? DefaultExptdAvgid { get; set; }

    public virtual ICollection<Calibrationdatum> Calibrationdata { get; set; } = new List<Calibrationdatum>();

    // One-to-many relationship mapping.
    // This is the principal navigation that pairs with Employee.Vehicles.

    [NotMapped]
    public virtual Employee? DefaultEmployee { get; set; }
    [NotMapped]
    public virtual Expectedaverage? DefaultExptdAvg { get; set; }

    public virtual Device? Device { get; set; }

    public virtual ICollection<Expectedaverage> Expectedaverages { get; set; } = new List<Expectedaverage>();

    public virtual ICollection<Fuelrefil> Fuelrefils { get; set; } = new List<Fuelrefil>();

    public virtual ICollection<Issuetracker> Issuetrackers { get; set; } = new List<Issuetracker>();

    public virtual Vehiclemanufacturer? VehicleManufacturer { get; set; }

    public virtual User? ModifiedByNavigation { get; set; }
    public string? ModifiedBy { get; set; }

    public virtual Vehiclemodel? VehicleModel { get; set; }

    public virtual Vehicletype? VehicleType { get; set; }

    public virtual ICollection<Vehicleconsumption> Vehicleconsumptions { get; set; } = new List<Vehicleconsumption>();

    public virtual Site? WorkingSite { get; set; }

    // Many-to-many relationship with Employee through EmployeeVehicle
    public virtual ICollection<EmployeeVehicle> EmployeeVehicles { get; set; } = new List<EmployeeVehicle>();

    // Many-to-many relationship mapping.
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();

}

