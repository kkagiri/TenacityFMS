/*
 * File: Department.cs
 * Purpose: Represents a department entity for organizing users
 * Dependencies: None
 * Last Modified: 2026-02-05
 *
 * Key Properties:
 * - DepartmentId: Primary key
 * - Name: Department name
 * - Code: Department code for quick reference
 * - Description: Optional description
 * - IsActive: Soft delete/deactivation flag
 */
using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities.Features.UserManagement;

/// <summary>
/// Represents a department in the organization for grouping users
/// </summary>
public class Department
{
    /// <summary>
    /// Primary key for the department
    /// </summary>
    public int DepartmentId { get; set; }

    /// <summary>
    /// Name of the department
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Short code for the department (e.g., "IT", "HR", "OPS")
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// Optional description of the department
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Whether the department is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Date when the department was created
    /// </summary>
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date when the department was last modified
    /// </summary>
    public DateTime? ModifiedDate { get; set; }

    /// <summary>
    /// Navigation property for users in this department
    /// </summary>
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
