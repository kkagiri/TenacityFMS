namespace FMS.Application.Common.Constants
{
    /// <summary>
    /// Operating mode constants for pump operations
    /// Provides strong typing for "Vehicle" and "Transfer" modes
    /// </summary>
    public static class PumpOperationMode
    {
        /// <summary>
        /// Vehicle fueling mode - dispense to a vehicle
        /// </summary>
        public const string Vehicle = "Vehicle";

        /// <summary>
        /// Tank transfer mode - transfer between storage tanks
        /// </summary>
        public const string Transfer = "Transfer";

        /// <summary>
        /// Unknown or uninitialized mode
        /// </summary>
        public const string Unknown = "Unknown";

        /// <summary>
        /// Validates if the mode string is a valid operating mode
        /// </summary>
        public static bool IsValid(string? mode)
        {
            return mode switch
            {
                Vehicle or Transfer or Unknown => true,
                _ => false
            };
        }

        /// <summary>
        /// Gets display name for the mode
        /// </summary>
        public static string GetDisplayName(string? mode)
        {
            return mode switch
            {
                Vehicle => "Vehicle Fueling",
                Transfer => "Tank Transfer",
                Unknown => "Unknown Mode",
                _ => "Unknown Mode"
            };
        }

        /// <summary>
        /// Converts lowercase mode string to proper case constant
        /// </summary>
        public static string Normalize(string? mode)
        {
            return mode?.ToLower() switch
            {
                "vehicle" => Vehicle,
                "transfer" => Transfer,
                "unknown" => Unknown,
                _ => Unknown
            };
        }
    }
}
