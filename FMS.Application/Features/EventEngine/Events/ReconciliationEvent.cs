/**
 * File: ReconciliationEvent.cs
 * Purpose: Event emitted by automated reconciliation services when policy executions,
 *          discrepancy detection, cycle completions, or manual review actions occur.
 *          Replaces direct CreateNotificationAsync calls in AutomatedReconciliationService
 *          and ReconciliationOrchestrationService.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-18
 *
 * Key Properties:
 * - SubType: classifies the specific reconciliation event (PolicyFailed, DiscrepancyDetected, etc.)
 * - PolicyId/PolicyName: which reconciliation policy triggered the event
 * - VarianceLiters/VariancePercentage: discrepancy magnitude (when applicable)
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by AutomatedReconciliationService and ReconciliationOrchestrationService
    /// for reconciliation lifecycle events — policy failures, discrepancy detection,
    /// cycle summaries, manual review requests, etc.
    /// </summary>
    public class ReconciliationEvent : FMSEvent
    {
        public const string EventTypeName = "Reconciliation";

        #region Sub-type constants

        /// <summary>Policy execution failed</summary>
        public const string SubTypePolicyFailed = "PolicyExecutionFailed";
        /// <summary>Reconciliation cycle summary (success/fail counts)</summary>
        public const string SubTypeCycleSummary = "CycleSummary";
        /// <summary>Critical reconciliation system failure</summary>
        public const string SubTypeCycleCriticalFailure = "CycleCriticalFailure";
        /// <summary>Tank volume discrepancy detected by automated policy</summary>
        public const string SubTypeDiscrepancyDetected = "DiscrepancyDetected";
        /// <summary>Reconciliation policy completed (with resolution counts)</summary>
        public const string SubTypePolicyCompleted = "PolicyCompleted";
        /// <summary>Individual tank reconciliation failed</summary>
        public const string SubTypeReconciliationFailed = "ReconciliationFailed";
        /// <summary>Individual tank reconciliation succeeded</summary>
        public const string SubTypeReconciliationSuccess = "ReconciliationSuccess";
        /// <summary>Critical error during individual tank reconciliation</summary>
        public const string SubTypeReconciliationCriticalError = "ReconciliationCriticalError";
        /// <summary>Tank discrepancy requires manual review</summary>
        public const string SubTypeManualReviewRequired = "ManualReviewRequired";
        /// <summary>Reconciliation execution summary for a policy</summary>
        public const string SubTypeExecutionSummary = "ExecutionSummary";
        /// <summary>High reconciliation failure rate (system health alert)</summary>
        public const string SubTypeSystemHealthAlert = "SystemHealthAlert";

        #endregion

        /// <summary>Further classification within reconciliation events.</summary>
        public string SubType { get; set; } = string.Empty;

        /// <summary>Policy ID that triggered the event (0 if cycle-level).</summary>
        public int PolicyId { get; set; }

        /// <summary>Policy name for display.</summary>
        public string PolicyName { get; set; } = string.Empty;

        /// <summary>Tank name (when event is tank-specific).</summary>
        public string TankName { get; set; } = string.Empty;

        /// <summary>Discrepancy variance in liters (when applicable).</summary>
        public decimal VarianceLiters { get; set; }

        /// <summary>Discrepancy variance percentage (when applicable).</summary>
        public decimal VariancePercentage { get; set; }

        /// <summary>Number of discrepancies found.</summary>
        public int DiscrepanciesFound { get; set; }

        /// <summary>Number of discrepancies resolved.</summary>
        public int DiscrepanciesResolved { get; set; }

        /// <summary>Number of successful policies in a cycle.</summary>
        public int SuccessfulPolicies { get; set; }

        /// <summary>Number of failed policies in a cycle.</summary>
        public int FailedPolicies { get; set; }

        /// <summary>Total policies processed in a cycle.</summary>
        public int ProcessedPolicies { get; set; }

        /// <summary>Error message (when applicable).</summary>
        public string ErrorMessage { get; set; } = string.Empty;

        /// <summary>Resolution details (for success events).</summary>
        public string ResolutionDetails { get; set; } = string.Empty;

        public ReconciliationEvent()
        {
            EventType = EventTypeName;
            EventCategory = "Reconciliation";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["SubType"] = SubType;
            vars["PolicyId"] = PolicyId.ToString();
            vars["PolicyName"] = PolicyName;
            vars["TankName"] = TankName;
            vars["VarianceLiters"] = VarianceLiters.ToString("N2");
            vars["VariancePercentage"] = VariancePercentage.ToString("N1");
            vars["DiscrepanciesFound"] = DiscrepanciesFound.ToString();
            vars["DiscrepanciesResolved"] = DiscrepanciesResolved.ToString();
            vars["SuccessfulPolicies"] = SuccessfulPolicies.ToString();
            vars["FailedPolicies"] = FailedPolicies.ToString();
            vars["ProcessedPolicies"] = ProcessedPolicies.ToString();
            vars["ErrorMessage"] = ErrorMessage;
            vars["ResolutionDetails"] = ResolutionDetails;
            return vars;
        }
    }
}
