//Cursor - Create TaskStatus enum
using System.ComponentModel;

namespace FMS.Domain.Entities.enums {
    public enum TaskStatus {
        [Description ("Pending")]
        Pending = 0,

        [Description ("In Progress")]
        InProgress = 1,

        [Description ("Completed")]
        Completed = 2,

        [Description ("Cancelled")]
        Cancelled = 3,

        [Description ("Overdue")]
        Overdue = 4,

        [Description ("Needs Approval")]
        NeedsApproval = 5
    }
}