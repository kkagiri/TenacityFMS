using System;
using System.Collections.Generic;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.FMS.AutomatedReconciliation {
    /// <summary>
    /// Data Transfer Object for ReconciliationDiscrepancy
    /// </summary>
    public class ReconciliationDiscrepancyDTO {
        public int Id { get; set; }
        public int PolicyExecutionId { get; set; }
        public int TankId { get; set; }
        public string TankName { get; set; } = null!;
        public string SiteName { get; set; } = null!;
        public DateTime DetectedAt { get; set; }
        public decimal CurrentStock { get; set; }
        public decimal ExpectedStock { get; set; }
        public decimal AbsoluteVariance { get; set; }
        public decimal PercentageVariance { get; set; }
        public DiscrepancyType DiscrepancyType { get; set; }
        public DiscrepancySeverity Severity { get; set; }
        public bool IsResolved { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? ResolutionMethod { get; set; }
        public string? AnalysisNotes { get; set; }
        public string? TrendAnalysis { get; set; }
        public decimal? BusinessImpactScore { get; set; }
    }
}