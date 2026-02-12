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

        public string TankName { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public decimal OpeningStock { get; set; }
        public decimal ClosingStock { get; set; }
        public decimal ExpectedClosingStock { get; set; }
        public decimal Variance { get; set; }
        public decimal VariancePercentage { get; set; }
        public string VarianceType { get; set; } = string.Empty;
        public decimal TotalDeliveries { get; set; }
        public decimal TotalSales { get; set; }
        public string Unit { get; set; } = "Liters";

        public TankClosingStockEvent()
        {
            EventType = EventTypeName;
            EventCategory = "StockReconciliation";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["TankName"] = TankName;
            vars["ProductName"] = ProductName;
            vars["SiteName"] = SiteName;
            vars["OpeningStock"] = OpeningStock.ToString("N2");
            vars["ClosingStock"] = ClosingStock.ToString("N2");
            vars["ExpectedClosingStock"] = ExpectedClosingStock.ToString("N2");
            vars["Variance"] = Variance.ToString("N2");
            vars["VariancePercentage"] = VariancePercentage.ToString("N1");
            vars["VarianceType"] = VarianceType;
            vars["TotalDeliveries"] = TotalDeliveries.ToString("N2");
            vars["TotalSales"] = TotalSales.ToString("N2");
            vars["Unit"] = Unit;
            return vars;
        }
    }
}
