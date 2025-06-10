using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.ModelsDTOs.FMS.TankStock;

//Cursor - Stock Reconciliation DTO for discrepancy tracking
public class StockDiscrepancyDTO {
    public int Id { get; set; }
    public int TankId { get; set; }
    public int SiteId { get; set; }
    public string TankName { get; set; } = null!;
    public string SiteName { get; set; } = null!;
    public decimal TankCapacity { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal ExpectedStock { get; set; }
    public decimal DiscrepancyVolume => CurrentStock - ExpectedStock;
    public DateTime LastReconciliation { get; set; }
    public string Severity { get; set; } = null!; // Critical, Warning, Normal
}

//Cursor - Stock Reconciliation Request DTO
public class StockReconciliationRequestDTO {
    [Required]
    public List<int> DiscrepancyIds { get; set; } = new ();

    [Required]
    public string UserId { get; set; } = null!;

    [Required]
    [StringLength (50)]
    public string ReconciliationType { get; set; } = null!; // Bulk, Individual

    [StringLength (500)]
    public string? Notes { get; set; }
}

//Cursor - Stock Reconciliation Result DTO
public class StockReconciliationResultDTO {
    public int TotalReconciled { get; set; }
    public int SuccessfulReconciliations { get; set; }
    public int FailedReconciliations { get; set; }
    public List<string> Errors { get; set; } = new ();
    public DateTime ReconciliationDate { get; set; } = DateTime.UtcNow;
}