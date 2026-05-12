/**
 * File: TankClosingStockEvent.cs
 * Purpose: Event emitted when closing stock calculation detects a discrepancy
 *          between expected and actual tank levels.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - OpeningStock, ClosingStock: start/end volumes
 * - Variance, VariancePercentage: calculated discrepancy
 * - VarianceType: Over/Under/Within tolerance
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by ClosingStockCommand when a stock discrepancy is detected.
    /// Replaces direct CreateNotificationAsync + CreateActiveAlarmFromDiscrepancy calls.
    /// </summary>
    public class TankClosingStockEvent : FMSEvent
    {
        public const string EventTypeName = "TankStockDiscrepancy";

        // ─── Tank / Site Info ───
        public string TankName { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;

        // ─── Stock Levels ───
        public decimal OpeningStock { get; set; }
        public decimal ClosingStock { get; set; }
        public decimal ExpectedClosingStock { get; set; }
        public decimal Variance { get; set; }
        public decimal VariancePercentage { get; set; }
        public string VarianceType { get; set; } = string.Empty;
        public string Unit { get; set; } = "Liters";

        // ─── Transaction Breakdown (from VolumeChangeReasonEnum) ───
        public decimal TotalDeliveries { get; set; }
        public decimal TotalDispensing { get; set; }          // Dispensing + AutomatedDispensing combined
        public decimal TotalManualDispensing { get; set; }    // Manual Dispensing only
        public decimal TotalAutomatedDispensing { get; set; } // PTS AutomatedDispensing only
        public decimal TotalTransfersIn { get; set; }
        public decimal TotalTransfersOut { get; set; }
        public decimal TotalInTankDeliveries { get; set; }    // PTS auto-detected in-tank deliveries
        public decimal TotalAdjustments { get; set; }         // Manual adjustments

        // ─── Report / Summary Fields ───
        public decimal NetMovement { get; set; }              // Sum of all transaction volume changes
        public int TransactionCount { get; set; }             // Number of transactions for the day
        public string BusinessDate { get; set; } = string.Empty; // Business day date (display)
        public DateTime BusinessDateUtc { get; set; }              // Business day date (UTC, for report queries)
        public DateTime? BusinessWindowStartUtc { get; set; }      // Actual business window start (opening stock timestamp)
        public DateTime? BusinessWindowEndUtc { get; set; }        // Actual business window end (closing stock timestamp)
        public string ReportUrl { get; set; } = string.Empty;  // Deep-link to TankVolumeHistory report

        public TankClosingStockEvent()
        {
            EventType = EventTypeName;
            EventCategory = "StockReconciliation";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();

            // Tank / Site
            vars["TankName"] = TankName;
            vars["ProductName"] = ProductName;
            vars["SiteName"] = SiteName;

            // Stock Levels
            vars["OpeningStock"] = OpeningStock.ToString("N2");
            vars["ClosingStock"] = ClosingStock.ToString("N2");
            vars["ExpectedClosingStock"] = ExpectedClosingStock.ToString("N2");
            vars["Variance"] = Variance.ToString("N2");
            vars["VariancePercentage"] = VariancePercentage.ToString("N1");
            vars["VarianceType"] = VarianceType;
            vars["Unit"] = Unit;

            // Transaction Breakdown
            vars["TotalDeliveries"] = TotalDeliveries.ToString("N2");
            vars["TotalDispensing"] = TotalDispensing.ToString("N2");
            vars["TotalManualDispensing"] = TotalManualDispensing.ToString("N2");
            vars["TotalAutomatedDispensing"] = TotalAutomatedDispensing.ToString("N2");
            vars["TotalTransfersIn"] = TotalTransfersIn.ToString("N2");
            vars["TotalTransfersOut"] = TotalTransfersOut.ToString("N2");
            vars["TotalInTankDeliveries"] = TotalInTankDeliveries.ToString("N2");
            vars["TotalAdjustments"] = TotalAdjustments.ToString("N2");

            // Report / Summary
            vars["NetMovement"] = NetMovement.ToString("N2");
            vars["TransactionCount"] = TransactionCount.ToString();
            vars["BusinessDate"] = BusinessDate;
            vars["ReportUrl"] = ReportUrl;

            return vars;
        }

        public override ReportAttachmentMetadata? GetReportAttachmentMetadata()
        {
            if (TankId == null && SiteId == null) return null;

            var reportStart = BusinessWindowStartUtc ?? BusinessDateUtc.Date;
            var reportEnd = BusinessWindowEndUtc ?? BusinessDateUtc.Date.AddDays(1).AddTicks(-1);

            return new ReportAttachmentMetadata
            {
                ReportType = "TransactionVolumeHistory",
                TemplateName = "tank-volume-history-report",
                TankId = TankId,
                SiteId = SiteId,
                StartDate = reportStart,
                EndDate = reportEnd,
                FileNamePrefix = $"TankVolumeHistory_{TankName?.Replace(" ", "_") ?? "Tank"}"
            };
        }
    }
}
