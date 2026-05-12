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

/// <summary>
/// Lightweight user DTO for department user listings
/// </summary>
public class DepartmentUserDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string DisplayName => string.IsNullOrWhiteSpace(FirstName) && string.IsNullOrWhiteSpace(LastName)
        ? UserName
        : $"{FirstName} {LastName}".Trim();
}
