using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;


namespace FMS.Domain.ATGEntities.Nafta;

/// <summary>
/// Represents a tank entity in the NAFTA ATG system. NOt in FMS.Domain.Entities namespace to avoid conflicts with other Tank entities.
///
/// </summary>


public partial class Tank
{
    public short Tankno { get; set; }

    public int? Productid { get; set; }

    public int? Productgroup { get; set; }

    public double? Amount { get; set; }

    public double? Amountmm { get; set; }

    public double? Bookamount { get; set; }

    public double? Water { get; set; }

    public double? Watermm { get; set; }

    public double? Temperature { get; set; }

    public double? Density { get; set; }

    public double? Mass { get; set; }

    public double? Volume15 { get; set; }

    public double? Density15 { get; set; }
}
