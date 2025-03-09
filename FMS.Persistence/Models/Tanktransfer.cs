// using System;
// using System.Collections.Generic;

// namespace FMS.Domain.Entities;

// public partial class Tanktransfer
// {
//     public int Id { get; set; }

//     public decimal Amount { get; set; }

//     public int SourceTankId { get; set; }

//     public int DestinationTankId { get; set; }

//     public DateTime TransferDate { get; set; }

//     public string RecordedBy { get; set; } = null!;

//     public DateTime CreatedOn { get; set; }

//     public virtual Tank DestinationTank { get; set; } = null!;

//     public virtual User RecordedByNavigation { get; set; } = null!;

//     public virtual Tank SourceTank { get; set; } = null!;
// }
