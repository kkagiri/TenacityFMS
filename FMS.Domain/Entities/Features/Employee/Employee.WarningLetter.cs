/**
 * File: Employee.WarningLetter.cs
 * Purpose: Extends Employee with warning-letter fields and relationships.
 * Dependencies: WarningLetter
 * Last Modified: 2026-04-06
 */
using System.Collections.Generic;
using FMS.Domain.Entities.Features.WarningLetterManagement;

namespace FMS.Domain.Entities;

public partial class Employee
{
    public string? Position { get; set; }
    public string? Email { get; set; }

    public virtual ICollection<WarningLetter> WarningLetters { get; set; } = new List<WarningLetter>();
}