/**
 * File: ManualDeliveryEvent.cs
 * Purpose: Event emitted when a manual delivery entry is created (same-day or historical).
 *          Fired from CreateDeliveryCommand after successful delivery creation.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-27
 *
 * Key Properties:
 * - DeliveryId: FK to the Delivery entity
 * - ManualDeliveryAmount: volume entered by operator (liters)
 * - TankName, ProductName: tank and fuel details
 * - SupplierName: delivery supplier
 * - StockBeforeDelivery, StockAfterDelivery: tank levels
 * - DeliveryDate: the date of the delivery
 * - IsSameDay: whether delivery is for the current day
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by CreateDeliveryCommand when a manual delivery entry is successfully created.
    /// Enables event expressions to trigger notifications for delivery tracking,
    /// stock verification, and supplier monitoring.
    /// </summary>
    public class ManualDeliveryEvent : FMSEvent
    {
        public const string EventTypeName = "ManualDelivery";

        // ─── Delivery Identification ───
        /// <summary>FK to the Delivery record in the database.</summary>
        public int DeliveryId { get; set; }

        /// <summary>LPO/Purchase Order number for the delivery.</summary>
        public string LpoNumber { get; set; } = string.Empty;

        // ─── Tank / Site Info ───
        /// <summary>Display name of the tank.</summary>
        public string TankName { get; set; } = string.Empty;

        /// <summary>Site name for display.</summary>
        public string SiteName { get; set; } = string.Empty;

        /// <summary>Product / fuel grade name.</summary>
        public string ProductName { get; set; } = string.Empty;

        // ─── Supplier ───
        /// <summary>Delivery supplier name.</summary>
        public string SupplierName { get; set; } = string.Empty;

        /// <summary>Supplier ID.</summary>
        public int SupplierId { get; set; }

        // ─── Volume Data ───
        /// <summary>Manually entered delivery volume (liters).</summary>
        public decimal ManualDeliveryAmount { get; set; }

        /// <summary>Sensor-detected delivery volume, if available (liters).</summary>
        public decimal? SensorDeliveryAmount { get; set; }

        /// <summary>Tank stock level before the delivery (liters).</summary>
        public decimal? StockBeforeDelivery { get; set; }

        /// <summary>Tank stock level after the delivery (liters).</summary>
        public decimal? StockAfterDelivery { get; set; }

        /// <summary>Tank total capacity (liters).</summary>
        public decimal TankCapacity { get; set; }

        /// <summary>Delivery amount as percentage of tank capacity.</summary>
        public decimal FillPercentage { get; set; }

        // ─── Cost / Pricing ───
        /// <summary>Price per liter for this delivery.</summary>
        public decimal? PricePerLiter { get; set; }

        /// <summary>Total delivery cost (ManualDeliveryAmount × PricePerLiter).</summary>
        public decimal? TotalCost { get; set; }

        // ─── Temperature / Density ───
        /// <summary>Delivery temperature (°C).</summary>
        public decimal? DeliveryTemperature { get; set; }

        /// <summary>Delivery density (kg/m³).</summary>
        public decimal? DeliveryDensity { get; set; }

        // ─── Timing ───
        /// <summary>Date of the delivery.</summary>
        public DateTime DeliveryDate { get; set; }

        /// <summary>Whether the delivery is for the current calendar day.</summary>
        public bool IsSameDay { get; set; }

        /// <summary>Who recorded the delivery.</summary>
        public string RecordedByName { get; set; } = string.Empty;

        public ManualDeliveryEvent()
        {
            EventType = EventTypeName;
            EventCategory = "FuelManagement";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();

            // Delivery ID
            vars["DeliveryId"] = DeliveryId.ToString();
            vars["LpoNumber"] = LpoNumber;

            // Tank / Site
            vars["TankName"] = TankName;
            vars["SiteName"] = SiteName;
            vars["ProductName"] = ProductName;

            // Supplier
            vars["SupplierName"] = SupplierName;
            vars["SupplierId"] = SupplierId.ToString();

            // Volume
            vars["ManualDeliveryAmount"] = ManualDeliveryAmount.ToString("N0");
            vars["SensorDeliveryAmount"] = SensorDeliveryAmount?.ToString("N0") ?? "N/A";
            vars["StockBeforeDelivery"] = StockBeforeDelivery?.ToString("N0") ?? "N/A";
            vars["StockAfterDelivery"] = StockAfterDelivery?.ToString("N0") ?? "N/A";
            vars["TankCapacity"] = TankCapacity.ToString("N0");
            vars["FillPercentage"] = FillPercentage.ToString("N1");

            // Cost
            vars["PricePerLiter"] = PricePerLiter?.ToString("N2") ?? "N/A";
            vars["TotalCost"] = TotalCost?.ToString("N2") ?? "N/A";

            // Temperature / Density
            vars["DeliveryTemperature"] = DeliveryTemperature?.ToString("N1") ?? "N/A";
            vars["DeliveryDensity"] = DeliveryDensity?.ToString("N3") ?? "N/A";

            // Timing
            vars["DeliveryDate"] = DeliveryDate.ToString("yyyy-MM-dd");
            vars["IsSameDay"] = IsSameDay ? "Yes" : "No";
            vars["RecordedByName"] = RecordedByName;

            return vars;
        }
    }
}
