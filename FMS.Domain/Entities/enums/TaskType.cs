//Cursor - Create TaskType enum
using System.ComponentModel;

namespace FMS.Domain.Entities.enums {
    public enum TaskType {
        [Description ("Manual")]
        Manual = 0,

        [Description ("Maintenance")]
        Maintenance = 1,

        [Description ("Discrepancy")]
        Discrepancy = 2,

        [Description ("Stock")]
        Stock = 3,

        [Description ("Inspection")]
        Inspection = 4,

        [Description ("Calibration")]
        Calibration = 5,

        [Description ("Transaction Correction")]
        TransactionCorrection = 6
    }
}