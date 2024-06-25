using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Append
{
    public int Id { get; set; }

    public int? Host { get; set; }

    public string? Doc { get; set; }

    public int? Session { get; set; }

    public short? Tankno { get; set; }

    public int? Productid { get; set; }

    public double? Price { get; set; }

    public double? Sprice { get; set; }

    public int? Completed { get; set; }

    public int? Mode { get; set; }

    public string? Createtime { get; set; }

    public string? Completetime { get; set; }

    public double? Amount { get; set; }

    public double? Remainder { get; set; }

    public double? Endremainder { get; set; }

    public double? Diff { get; set; }

    public double? Fact { get; set; }

    public double? Book1 { get; set; }

    public double? Book2 { get; set; }

    public double? FuelHeightAbs { get; set; }

    public double? WaterHeightAbs { get; set; }

    public double? TemperatureAbs { get; set; }

    public double? TcVolumeAbs { get; set; }

    public double? DensityAbs { get; set; }

    public double? TcDensityAbs { get; set; }

    public double? MassAbs { get; set; }

    public double? FuelHeightS { get; set; }

    public double? FuelHeightE { get; set; }

    public double? WaterHeightS { get; set; }

    public double? WaterHeightE { get; set; }

    public double? TemperatureS { get; set; }

    public double? TemperatureE { get; set; }

    public double? FuelVolumeS { get; set; }

    public double? FuelVolumeE { get; set; }

    public double? TcVolumeS { get; set; }

    public double? TcVolumeE { get; set; }

    public double? DensityS { get; set; }

    public double? DensityE { get; set; }

    public double? TcDensityS { get; set; }

    public double? TcDensityE { get; set; }

    public double? MassS { get; set; }

    public double? MassE { get; set; }

    public int? Saletag1 { get; set; }

    public int? Saletag2 { get; set; }

    public int? Client { get; set; }

    public string? TankerId { get; set; }

    public string? RouteId { get; set; }

    public int? OilDepotId { get; set; }

    public string? Invoice { get; set; }

    public string? Uid { get; set; }

    public int? Remotedelivery { get; set; }
}
