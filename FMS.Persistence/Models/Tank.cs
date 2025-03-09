// using System;
// using System.Collections.Generic;

// namespace FMS.Domain.Entities;

// public partial class Tank
// {
//     public int Id { get; set; }

//     public string Name { get; set; } = null!;

//     public decimal TankVolume { get; set; }

//     public decimal? TankHeight { get; set; }

//     public int? PtsId { get; set; }

//     public int SiteId { get; set; }

//     public decimal? TankLength { get; set; }

//     public decimal CurrentStock { get; set; }

//     public DateTime LastStockUpdate { get; set; }

//     public decimal? DiscrepancyThreshold { get; set; }

//     public sbyte? UseBookKeeping { get; set; }

//     public sbyte? HasAutomaticBookKeeping { get; set; }

//     public virtual ICollection<Dailytankreconciliation> Dailytankreconciliations { get; set; } = new List<Dailytankreconciliation>();

//     public virtual ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();

//     public virtual ICollection<Fuelrefil> Fuelrefils { get; set; } = new List<Fuelrefil>();

//     public virtual Site Site { get; set; } = null!;

//     public virtual ICollection<Tankstock> Tankstocks { get; set; } = new List<Tankstock>();

//     public virtual ICollection<Tanktransfer> TanktransferDestinationTanks { get; set; } = new List<Tanktransfer>();

//     public virtual ICollection<Tanktransfer> TanktransferSourceTanks { get; set; } = new List<Tanktransfer>();

//     public virtual ICollection<Tankvolumehistory> Tankvolumehistories { get; set; } = new List<Tankvolumehistory>();
// }
