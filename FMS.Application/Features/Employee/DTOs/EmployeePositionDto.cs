/**
 * File: EmployeePositionDto.cs
 * Purpose: DTO returned for employee position lookup values.
 * Dependencies: System.Text.Json.Serialization
 * Last Modified: 2026-04-07
 */
using System.Text.Json.Serialization;

namespace FMS.Application.Features.Employee.DTOs;

public class EmployeePositionDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("sortOrder")]
    public int SortOrder { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
}