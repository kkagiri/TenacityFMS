// using System;
// using System.Collections.Generic;

// namespace FMS.Domain.Entities;

// public partial class Fuelingrule
// {
//     public int Id { get; set; }

//     public string? RuleName { get; set; }

//     public sbyte IsActive { get; set; }

//     public int FuelingRuleSetId { get; set; }

//     public string? Discriminator { get; set; }

//     public int? DailyLimitLiter { get; set; }

//     public int? MonthlyLimitLiter { get; set; }

//     public int? MaxRefillsPerDay { get; set; }

//     public int? MaxRefillsPerWeek { get; set; }

//     public int? MaxRefillsPerMonth { get; set; }

//     public DateTime? CreatedAt { get; set; }

//     public DateTime? UpdatedAt { get; set; }

//     public virtual Fuelingruleset FuelingRuleSet { get; set; } = null!;
// }
