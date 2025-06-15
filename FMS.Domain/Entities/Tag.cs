using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRuleSet;

namespace FMS.Domain.Entities;

public partial class Tag {
    /// <summary>
    public int Id { get; set; }

    /// <summary>
    /// Unique RFID TAG ID
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Is the tag enabled
    /// </summary>
    public bool? IsEnabled { get; set; }
    /// <summary>
    /// Fuel Rule Set ID

    public int? FuelRuleSetId { get; set; }

    /// <summary>
    /// Vehicle ID
    /// </summary>
    public int? VehicleId { get; set; }

    /// <summary>
    /// Is the tag a master tag
    /// </summary>
    public sbyte? IsMaster { get; set; }

    public virtual FuelingRuleSet? FuelRuleSet { get; set; }

    public virtual Vehicle Vehicle { get; set; } = null!;

    //public virtual User Users { get; set; } = null!; //Navigation
    public virtual ICollection<FuelRefill> Fuelrefils { get; set; } = new List<FuelRefill> ();

}