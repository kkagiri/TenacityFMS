namespace FMS.Domain.Entities.enums {
    /// <summary>
    /// Enumeration of stock adjustment reasons
    /// </summary>
    public enum StockAdjustmentReasonEnum {
        /// <summary>
        /// Physical count discrepancy
        /// </summary>
        PhysicalCount = 1,

        /// <summary>
        /// System error correction
        /// </summary>
        SystemError = 2,

        /// <summary>
        /// Calibration adjustment
        /// </summary>
        Calibration = 3,

        /// <summary>
        /// Temperature compensation
        /// </summary>
        TemperatureCompensation = 4,

        /// <summary>
        /// Spillage or loss
        /// </summary>
        SpillageOrLoss = 5,

        /// <summary>
        /// Meter reading correction
        /// </summary>
        MeterCorrection = 6,

        /// <summary>
        /// Tank maintenance
        /// </summary>
        TankMaintenance = 7,

        /// <summary>
        /// Data migration or import
        /// </summary>
        DataMigration = 8,

        /// <summary>
        /// Other reason
        /// </summary>
        Other = 99
    }
}