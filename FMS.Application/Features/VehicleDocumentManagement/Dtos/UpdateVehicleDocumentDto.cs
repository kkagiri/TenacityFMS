using System;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class UpdateVehicleDocumentDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public VehicleDocumentType DocumentType { get; set; }

    public VehicleComplianceCategory? ComplianceCategory { get; set; }

    [Required]
    [MaxLength(100)]
    public string DocumentNumber { get; set; } = string.Empty;

    [Required]
    public DateTime IssueDate { get; set; }

    [Required]
    public DateTime ExpiryDate { get; set; }

    [Range(0, 365)]
    public int AlertLeadDays { get; set; } = 30;

    [MaxLength(200)]
    public string? IssuingAuthority { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public string? UserId { get; set; }

    public IFormFile? DocumentFile { get; set; }
}
