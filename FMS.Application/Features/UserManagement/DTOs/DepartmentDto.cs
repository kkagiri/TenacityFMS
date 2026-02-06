/*
 * File: DepartmentDto.cs
 * Purpose: Data Transfer Object for Department entity
 * Dependencies: None
 * Last Modified: 2026-02-05
 */
using System;

namespace FMS.Application.Features.UserManagement.DTOs;

/// <summary>
/// DTO for Department entity
/// </summary>
public class DepartmentDto
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public int UserCount { get; set; }
}

/// <summary>
/// DTO for creating a new department
/// </summary>
public class CreateDepartmentDto
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for updating a department
/// </summary>
public class UpdateDepartmentDto
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
