using System.Collections.Generic;
using System.Linq;

namespace FMS.Application.Features.TankManagement.BulkImport.DTOs
{
    /// <summary>
    /// Result of bulk import validation containing all detected anomalies
    /// </summary>
    public class BulkImportValidationResult
    {
        /// <summary>
        /// All detected anomalies
        /// </summary>
        public List<ValidationAnomaly> Anomalies { get; set; } = new List<ValidationAnomaly>();

        /// <summary>
        /// Total number of rows processed
        /// </summary>
        public int TotalRows { get; set; }

        /// <summary>
        /// Number of rows with no errors
        /// </summary>
        public int ValidRows => TotalRows - RowsWithErrors;

        /// <summary>
        /// Number of rows with errors
        /// </summary>
        public int RowsWithErrors { get; set; }

        /// <summary>
        /// Whether validation passed (no blocking anomalies)
        /// </summary>
        public bool IsValid => !HasBlockingAnomalies;

        /// <summary>
        /// Whether there are any blocking (Critical/High) anomalies
        /// </summary>
        public bool HasBlockingAnomalies => Anomalies.Any(a => a.IsBlocking);

        /// <summary>
        /// Whether there are any warnings (Medium/Low) anomalies
        /// </summary>
        public bool HasWarnings => Anomalies.Any(a => a.IsWarning);

        /// <summary>
        /// Count of critical anomalies
        /// </summary>
        public int CriticalCount => Anomalies.Count(a => a.Severity == AnomalySeverity.Critical);

        /// <summary>
        /// Count of high severity anomalies
        /// </summary>
        public int HighCount => Anomalies.Count(a => a.Severity == AnomalySeverity.High);

        /// <summary>
        /// Count of medium severity anomalies
        /// </summary>
        public int MediumCount => Anomalies.Count(a => a.Severity == AnomalySeverity.Medium);

        /// <summary>
        /// Count of low severity anomalies
        /// </summary>
        public int LowCount => Anomalies.Count(a => a.Severity == AnomalySeverity.Low);

        /// <summary>
        /// Summary message for the validation result
        /// </summary>
        public string Summary
        {
            get
            {
                if (IsValid && !HasWarnings)
                    return $"All {TotalRows} rows are valid. Ready to import.";

                if (!IsValid)
                    return $"Validation failed: {CriticalCount + HighCount} blocking errors found in {RowsWithErrors} rows.";

                return $"Validation passed with {MediumCount + LowCount} warnings. Review before importing.";
            }
        }

        /// <summary>
        /// Add an anomaly to the result
        /// </summary>
        public void AddAnomaly(ValidationAnomaly anomaly)
        {
            Anomalies.Add(anomaly);
        }

        /// <summary>
        /// Get anomalies grouped by type
        /// </summary>
        public Dictionary<AnomalyType, List<ValidationAnomaly>> GetAnomaliesByType()
        {
            return Anomalies.GroupBy(a => a.Type)
                           .ToDictionary(g => g.Key, g => g.ToList());
        }

        /// <summary>
        /// Get anomalies for a specific tank
        /// </summary>
        public List<ValidationAnomaly> GetAnomaliesForTank(string tankName)
        {
            return Anomalies.Where(a => a.TankName.Equals(tankName, System.StringComparison.OrdinalIgnoreCase))
                           .ToList();
        }
    }
}
