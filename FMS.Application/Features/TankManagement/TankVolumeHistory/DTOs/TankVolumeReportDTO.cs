using System;
using System.Collections.Generic;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs {
    public class TankVolumeReportDTO {
        public string SiteName { get; set; } = string.Empty;
        public int SiteId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public int TankId { get; set; }
        public string TimePeriod { get; set; } = string.Empty; // Month, Week, Quarter identifier
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public VolumeChangeReasonEnum ChangeReason { get; set; }
        public string ChangeReasonDisplay { get; set; } = string.Empty;
        public decimal TotalVolume { get; set; }
        public decimal CumulativeVolume { get; set; }
        public int TransactionCount { get; set; }
        public decimal AverageVolume { get; set; }
        public string ReferenceType { get; set; } = string.Empty;
    }

    public class PivotDataDTO {
        public List<TankVolumeReportDTO> Data { get; set; } = new ();
        public PivotSummaryDTO Summary { get; set; } = new ();
        public Dictionary<string, decimal> Totals { get; set; } = new ();
    }

    public class PivotSummaryDTO {
        public int TotalRecords { get; set; }
        public decimal GrandTotalVolume { get; set; }
        public DateTime ReportGeneratedAt { get; set; }
        public string ReportPeriod { get; set; } = string.Empty;
        public List<string> SitesIncluded { get; set; } = new ();
        public List<string> TanksIncluded { get; set; } = new ();
    }

    public class VolumeHistorySummaryDTO {
        public string GroupBy { get; set; } = string.Empty; // Month, Quarter, Week, Custom
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<TankVolumeReportDTO> Data { get; set; } = new ();
        public PivotSummaryDTO Summary { get; set; } = new ();
    }

    public class ExportRequestDTO {
        public string Format { get; set; } = "PDF"; // PDF, Excel
        public string ReportType { get; set; } = "Month"; // Month, Quarter, Week, Custom
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<int> ? SiteIds { get; set; }
        public List<int> ? TankIds { get; set; }
        public List<VolumeChangeReasonEnum> ? ChangeReasons { get; set; }
        public bool IncludeSummary { get; set; } = true;
        public bool IncludeCharts { get; set; } = false;
        public string Title { get; set; } = "Tank Volume History Report";
    }
}