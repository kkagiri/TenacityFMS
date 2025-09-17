using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities
{
    /// <summary>
    ///Commands :track the command that is pending to be executed by the PTS Device
    /// </summary>/
    public partial class PtsDevicePendingCommand
    {
        public int Id { get; set; }


        //Command tpye indentify ,set,start,stop
        public string CommandType { get; set; } = string.Empty;
        public string PtsDeviceId { get; set; }

        //Serialized Json Data
        public string CommandDataJson { get; set; } = string.Empty;

        //  for Auditing purpose
        public DateTime AssignedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }

        public string Status { get; set; } = "Pending"; //  Changed default value to "Pending
        public string? ResponseJson { get; set; }
        public int? ResponseCode { get; set; }
        public int Priority { get; set; } = 0;
        public string? Source { get; set; } // What triggered this command: "User", "System", "Scheduler", etc.
        public DateTime? ExpiryAt { get; set; }

        // public virtual PTSDeviceCommand PTSDeviceCommand { get; set; } = null!;
        public virtual Ptsdevice PtsDevice { get; set; } = null!;


    }
}
