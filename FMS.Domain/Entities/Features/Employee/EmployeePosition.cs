/**
 * File: EmployeePosition.cs
 * Purpose: Lookup entity for employee position values.
 * Dependencies: None
 * Last Modified: 2026-04-07
 */
using System;

namespace FMS.Domain.Entities;

public class EmployeePosition
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? DateCreated { get; set; }
    public DateTime? DateModified { get; set; }
}