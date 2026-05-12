namespace FMS.Application.Features.FuelAudit.DTOs
{
    /// <summary>
    /// Data quality indicator for fuel readings
    /// </summary>
    public enum FuelDataQuality
    {
        /// <summary>Fuel reading from exact requested date</summary>
        Exact = 1,

        /// <summary>No data on requested date, used nearest available</summary>
        Interpolated = 2,

        /// <summary>Vehicle was offline, no recent data</summary>
        Unavailable = 3,

        /// <summary>Vehicle has no fuel sensor/GPS mapping</summary>
        NoSensor = 4,

        /// <summary>Data exists but fuel variable not in track</summary>
        SensorNotReporting = 5,

        /// <summary>Estimated from manual fuel refill records</summary>
        ManualEntry = 6,

        /// <summary>Estimated from manual refill with consumption calculation</summary>
        EstimatedFromRefill = 7
    }
}
