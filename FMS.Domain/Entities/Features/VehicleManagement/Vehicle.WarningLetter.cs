/**
 * File: Vehicle.WarningLetter.cs
 * Purpose: Extends Vehicle with warning-letter relationship navigation.
 * Dependencies: WarningLetter
 * Last Modified: 2026-04-06
 */
using System.Collections.Generic;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.Domain.Entities;

public partial class Vehicle
{
    public virtual ICollection<WarningLetter> WarningLetters { get; set; } = new List<WarningLetter>();
}