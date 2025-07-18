//Cursor - Create TaskPriority enum
using System.ComponentModel;

namespace FMS.Domain.Entities.enums {
    public enum TaskPriority {
        [Description ("Low")]
        Low = 0,

        [Description ("Medium")]
        Medium = 1,

        [Description ("High")]
        High = 2,

        [Description ("Critical")]
        Critical = 3
    }
}