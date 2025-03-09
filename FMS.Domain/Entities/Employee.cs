using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities;

public partial class Employee
{
    public int Id { get; set; }

    public string FullName { get; set; } = null!;

    public string? EmployeeWorkNo { get; set; }

    public string? EmployeephoneNumber { get; set; }


    public string? Employeestatus { get; set; }

    public int? SiteId { get; set; }
    public DateTime? DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public sbyte? IsModified { get; set; }



    public virtual Site? Site { get; set; }

    public virtual User? CreatedByNavigation { get; set; }


    public virtual User? ModifiedByNavigation { get; set; }

    public virtual ICollection<Fuelrefil> Fuelrefils { get; set; } = new List<Fuelrefil>();
    public virtual ICollection<Vehicleconsumption> Vehicleconsumptions { get; set; } = new List<Vehicleconsumption>();

    // Many-to-many relationship with Vehicle through EmployeeVehicle
    public virtual ICollection<EmployeeVehicle> EmployeeVehicles { get; set; } = new List<EmployeeVehicle>();
    public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();

}
