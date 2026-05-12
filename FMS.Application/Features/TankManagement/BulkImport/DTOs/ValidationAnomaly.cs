using System;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.TankManagement.BulkImport.DTOs
{
    /// <summary>
    /// Represents a single validation anomaly detected during bulk import
    /// </summary>
    public class ValidationAnomaly
    {
        /// <summary>
        /// Type of anomaly detected
        /// </summary>
        public AnomalyType Type { get; set; }

        /// <summary>
        /// Severity level of the anomaly
        /// </summary>
        public AnomalySeverity Severity { get; set; }

        /// <summary>
        /// Tank name where anomaly was detected
        /// </summary>
        public string TankName { get; set; } = string.Empty;

        /// <summary>
        /// Date(s) affected by the anomaly
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// End date for range anomalies (e.g., cumulative drift)
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Row number in Excel file
        /// </summary>
        public int RowNumber { get; set; }

        /// <summary>
        /// Human-readable description of the anomaly
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Variance amount (if applicable)
        /// </summary>
        public decimal? Variance { get; set; }

        /// <summary>
        /// Expected value (if applicable)
        /// </summary>
        public decimal? ExpectedValue { get; set; }

        /// <summary>
        /// Actual value (if applicable)
        /// </summary>
        public decimal? ActualValue { get; set; }

        /// <summary>
        /// Whether this anomaly blocks import (Critical/High severity)
        /// </summary>
        public bool IsBlocking => Severity == AnomalySeverity.Critical || Severity == AnomalySeverity.High;

        /// <summary>
        /// Whether this is a warning that can be overridden
        /// </summary>
        public bool IsWarning => Severity == AnomalySeverity.Medium || Severity == AnomalySeverity.Low;

        /// <summary>
        /// Additional details or suggestions
        /// </summary>
        public string? Details { get; set; }
    }

    /// <summary>
    /// Types of anomalies detected during bulk import validation
    /// </summary>
    public enum AnomalyType
    {
        DailyBalance,
        ContinuityBreak,
        CumulativeDrift,
        MeterRollback,
        MeterMismatch,
        CapacityOverflow,
        NegativeStock,
        TransferImbalance,
        ZeroMovement,
        ImplausibleDispensing,
        DeliveryNoSpace,
        TankNotFound,
        InvalidDate,
        DuplicateEntry,
        MissingRequiredField
    }

    /// <summary>
    /// Severity levels for anomalies
    /// </summary>
    public enum AnomalySeverity
    {
        Info,      // Informational only
        Low,       // Minor issue, can be ignored
        Medium,    // Should be reviewed
        High,      // Should be fixed before import
        Critical   // Must be fixed before import
    }
}
