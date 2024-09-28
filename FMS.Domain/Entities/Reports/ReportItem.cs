using FMS.Domain.Entities.Common;
using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities.Reports;

public  class ReportItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; }
    public string? DisplayName { get; set; }
    public byte[]? LayoutData { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public string ? CreatedBy { get; set; }

    public string ? UpdatedBy { get; set; }





}

