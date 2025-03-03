using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRuleSet;

namespace FMS.Domain.Entities;

public partial class Tag
{
    public int Id { get; set; }

    [Required]

    public string Name { get; set; } = string.Empty;

    public bool? IsEnabled { get; set; }

    public int? FuelRuleSetId { get; set; }

    public int VehicleId { get; set; }

    public virtual FuelingRuleSet? FuelRuleSet { get; set; }

    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual ICollection<Fuelrefil> Fuelrefils { get; set; } = new List<Fuelrefil>();

}
