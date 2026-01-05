namespace FMS.Domain.Entities.Enums;

/// <summary>
/// Defines the type of tank for location tracking purposes
/// </summary>
public enum TankType
{
    /// <summary>
    /// Fixed/stationary tank at a depot or fuel station.
    /// Location is set via static GPS coordinates (Latitude/Longitude).
    /// </summary>
    Stationary = 0,

    /// <summary>
    /// Mobile fuel tanker/bowser that moves with a vehicle.
    /// Location is dynamically obtained from the linked vehicle's GPS tracker.
    /// </summary>
    MobileTanker = 1
}
