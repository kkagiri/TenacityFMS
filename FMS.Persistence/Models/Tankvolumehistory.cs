// using System;
// using System.Collections.Generic;

// namespace FMS.Domain.Entities;

// public partial class Tankvolumehistory
// {
//     public int Id { get; set; }

//     public int TankId { get; set; }

//     public DateTime TimeStamp { get; set; }

//     public decimal VolumeChange { get; set; }

//     public decimal NewVolume { get; set; }

//     public int ChangeReason { get; set; }

//     public string RecordedBy { get; set; } = null!;

//     public int? ReferenceId { get; set; }

//     public string? ReferenceType { get; set; }

//     public DateTime CreatedOn { get; set; }

//     public virtual User RecordedByNavigation { get; set; } = null!;

//     public virtual Tank Tank { get; set; } = null!;
// }
