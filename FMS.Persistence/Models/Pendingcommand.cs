// using System;
// using System.Collections.Generic;

// namespace FMS.Domain.Entities;

// public partial class Pendingcommand
// {
//     public int Id { get; set; }

//     public string PtsdeviceId { get; set; } = null!;

//     public string CommandType { get; set; } = null!;

//     public string CommandDataJson { get; set; } = null!;

//     public DateTime CreatedAt { get; set; }

//     public virtual ICollection<PtsDeviceCommand> PtsDeviceCommands { get; set; } = new List<PtsDeviceCommand>();

//     public virtual Ptsdevice Ptsdevice { get; set; } = null!;
// }
