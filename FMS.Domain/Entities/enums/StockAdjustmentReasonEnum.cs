namespace FMS.Domain.Entities.enums {
    using System.ComponentModel.DataAnnotations;
    /// <summary>
    /// Enumeration of stock adjustment reasons
    /// </summary>
    public enum StockAdjustmentReasonEnum {
        /// <summary>
        /// Physical count discrepancy
        /// </summary>
        [Display (Name = "Physical Count")]
        PhysicalCount = 1,



        /// <summary>
        /// System error correction
        /// </summary>
        [Display (Name = "System Error")]
        SystemError = 2,

        /// <summary>
        /// Calibration adjustment
        /// </summary>
        [Display (Name = "Calibration")]
        Calibration = 3,

        /// <summary>
        /// Temperature compensation
        /// </summary>
        [Display (Name = "Temperature Compensation")]
        TemperatureCompensation = 4,

        /// <summary>
        /// Spillage or loss
        /// </summary>
        [Display (Name = "Spillage or Loss")]
        SpillageOrLoss = 5,

        /// <summary>
        /// Meter reading correction
        /// </summary>
        [Display (Name = "Meter Correction")]
        MeterCorrection = 6,

        /// <summary>
        /// Tank maintenance
        /// </summary>
        [Display (Name = "Tank Maintenance")]
        TankMaintenance = 7,

        /// <summary>
        /// Data migration or import
        /// </summary>
        [Display (Name = "Data Migration")]
        DataMigration = 8,

        [Display(Name = "System Reconciliation")]

        SystemReconciliation = 9,

        /// <summary>
        /// Other reason
        /// </summary>
        [Display (Name = "Other")]
        Other = 99
    }
}