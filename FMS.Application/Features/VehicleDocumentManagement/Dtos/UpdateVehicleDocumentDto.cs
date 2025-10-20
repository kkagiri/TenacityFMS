using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.VehicleDocumentManagement.Dtos;

public class UpdateVehicleDocumentDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string DocumentNumber { get; set; }

    [Required]
    public DateTime IssueDate { get; set; }

    [Required]
    public DateTime ExpiryDate { get; set; }

    [MaxLength(200)]
    public string IssuingAuthority { get; set; }

    [MaxLength(1000)]
    public string Notes { get; set; }

    public IFormFile DocumentFile { get; set; }
}
