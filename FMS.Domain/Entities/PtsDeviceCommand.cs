using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities
{
    public partial class PtsDeviceCommand
    {
        public int PendingCommandId { get; set; }
        public int PtsDeviceId { get; set; }

        //  Changed to use UTC datetime consistently
        public DateTime AssignedAt { get; private set; }

        //  Added constructor to enforce AssignedAt initialization
        public PtsDeviceCommand()
        {
            AssignedAt = DateTime.UtcNow;
        }

        public virtual PendingCommand PendingCommand { get; set; } = null!;
        public virtual Ptsdevice PtsDevice { get; set; } = null!;


    }
}
