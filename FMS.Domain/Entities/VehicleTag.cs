using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Tag
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public decimal? DailyFuelLimit { get; set; }

    public decimal? MonthlyFuelLimit { get; set; }

    public bool? IsEnabled { get; set; }

    public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}
