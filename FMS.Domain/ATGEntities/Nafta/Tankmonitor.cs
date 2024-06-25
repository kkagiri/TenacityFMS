using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Tankmonitor
{
    /// <summary>
    /// Primary key
    /// </summary>
    public short Id { get; set; }

    /// <summary>
    /// Tank identification number
    /// </summary>
    public int TankId { get; set; }

    /// <summary>
    /// Fuel product identification number
    /// </summary>
    public long ProductId { get; set; }

    /// <summary>
    /// Fuel product name
    /// </summary>
    public string? ProductName { get; set; }

    /// <summary>
    /// Total height of tank in mm
    /// </summary>
    public double TankHeight { get; set; }

    /// <summary>
    /// Total volume of tank in liters
    /// </summary>
    public double TankVolume { get; set; }

    /// <summary>
    /// Current height of fuel product in tank in mm
    /// </summary>
    public double ProductHeight { get; set; }

    /// <summary>
    /// Current volume of fuel product in tank in liters
    /// </summary>
    public double ProductVolume { get; set; }

    /// <summary>
    /// Current height of water in tank in mm
    /// </summary>
    public double WaterHeight { get; set; }

    /// <summary>
    /// Current volume of water in tank in liters
    /// </summary>
    public double WaterVolume { get; set; }

    /// <summary>
    /// Current temperature of fuel product in tank in degrees Celcium
    /// </summary>
    public double Temperature { get; set; }

    /// <summary>
    /// Current temperature compensated volume (15 degrees Celcium) of fuel product in tank in liters
    /// </summary>
    public double TempCompVolume { get; set; }

    /// <summary>
    /// Current density of fuel product in tank in kg/m3 units
    /// </summary>
    public double Density { get; set; }

    /// <summary>
    /// Current volume of empty space in tank in liters
    /// </summary>
    public double Ullage { get; set; }

    /// <summary>
    /// Current mass of fuel in tank in kg
    /// </summary>
    public double Mass { get; set; }

    /// <summary>
    /// Volume of pipe from tank to pump
    /// </summary>
    public double PipeVolume { get; set; }

    /// <summary>
    /// Flag showing whether delivery of fuel product into tank is going
    /// </summary>
    public ulong IsDelivery { get; set; }
}
