using FMS.Domain.Entities;
using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class CreateVehicleDocumentDto
{
    [Required]
    public int VehicleId { get; set; }

    [Required]
    public VehicleDocumentType DocumentType { get; set; }

    [Required]
    [MaxLength(100)]
    public string DocumentNumber { get; set; }

    [Required]
    public DateTime IssueDate { get; set; }

    [Required]
    public DateTime ExpiryDate { get; set; }

    [Required]
    [MaxLength(200)]
    public string IssuingAuthority { get; set; }

    [MaxLength(1000)]
    public string Notes { get; set; }

    public string UserId { get; set; }

    [Required]
    public IFormFile DocumentFile { get; set; }
}
