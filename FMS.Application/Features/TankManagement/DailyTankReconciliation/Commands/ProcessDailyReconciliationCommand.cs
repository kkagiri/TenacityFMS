using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.TankManagement.DailyTankReconciliation.Commands;

//Cursor - Command to process daily tank reconciliation for a specific date or date range
public class ProcessDailyReconciliationCommand : IRequest<FMSResponse<DailyReconciliationResult>> {
    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int? TankId { get; set; } // Optional: process specific tank only

    public int? SiteId { get; set; } // Optional: process specific site only

    public bool ForceReprocess { get; set; } = false; // Force reprocessing existing records
}

//Cursor - Result class for daily reconciliation processing
public class DailyReconciliationResult {
    public DateTime ProcessedDate { get; set; }
    public int TotalTanksProcessed { get; set; }
    public int RecordsCreated { get; set; }
    public int RecordsUpdated { get; set; }
    public int RecordsWithDiscrepancies { get; set; }
    public List<TankReconciliationSummary> TankSummaries { get; set; } = new ();
    public List<string> Warnings { get; set; } = new ();
    public List<string> Errors { get; set; } = new ();
    public TimeSpan ProcessingDuration { get; set; }
}

//Cursor - Summary for individual tank reconciliation
public class TankReconciliationSummary {
    public int TankId { get; set; }
    public string TankName { get; set; }
    public string SiteName { get; set; }
    public DateTime ReconciliationDate { get; set; }
    public decimal OpeningLevel { get; set; }
    public decimal ClosingLevel { get; set; }
    public decimal TotalRefills { get; set; }
    public decimal TotalDeliveries { get; set; }
    public decimal TotalTransfersIn { get; set; }
    public decimal TotalTransfersOut { get; set; }
    public decimal CalculatedClosing { get; set; }
    public decimal Variance { get; set; }
    public bool HasDiscrepancy { get; set; }
    public string Status { get; set; }
}