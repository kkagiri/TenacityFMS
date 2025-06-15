using System;
using System.Collections.Generic;
using MediatR;

namespace FMS.Domain.Events;

//Cursor - Enhanced ReconciliationExecutionCompletedEvent with comprehensive execution details
public class ReconciliationExecutionCompletedEvent : INotification {
    public int ExecutionId { get; set; }
    public int PolicyId { get; set; }
    public DateTime CompletedAt { get; set; }
    public bool HasErrors { get; set; }

    //Cursor - Add missing properties referenced in services
    public ReconciliationExecutionSummary Summary { get; set; }
    public List<ReconciliationResult> Results { get; set; } = new List<ReconciliationResult> ();
}

//Cursor - Summary class for reconciliation execution (moved from service to domain)
public class ReconciliationExecutionSummary {
    public int ExecutionId { get; set; }
    public int PolicyId { get; set; }
    public int TotalDiscrepancies { get; set; }
    public int SuccessfulReconciliations { get; set; }
    public int FailedReconciliations { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public TimeSpan Duration { get; set; }
    public string ErrorMessage { get; set; }
}

//Cursor - Result class for reconciliation operations (moved from service to domain)
public class ReconciliationResult {
    public bool Success { get; set; }
    public string ErrorMessage { get; set; }
    public string ResolutionDetails { get; set; }
    public decimal AdjustmentAmount { get; set; }
    public string AdjustmentType { get; set; }
}