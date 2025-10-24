using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelImport.DTOs
{
    /// <summary>
    /// DTO for import calendar data visualization
    /// </summary>
    public class ImportCalendarDataDTO
    {
        public DateTime Date { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public bool HasDayShift { get; set; }
        public bool HasNightShift { get; set; }
        public int DayShiftRecordCount { get; set; }
        public int NightShiftRecordCount { get; set; }
        public int TotalRecordCount { get; set; }

        /// <summary>
        /// Success, Failed, Partial, Missing
        /// </summary>
        public string Status { get; set; }

        public DateTime? LastImportTimestamp { get; set; }
        public string LastImportedBy { get; set; }
        public List<string> ReportIds { get; set; } = new List<string>();
    }

    /// <summary>
    /// DTO for import summary statistics
    /// </summary>
    public class ImportSummaryDTO
    {
        public int TotalImports { get; set; }
        public int SuccessfulImports { get; set; }
        public int FailedImports { get; set; }
        public int MissingSites { get; set; }
        public List<MissingSiteDTO> MissingSiteDetails { get; set; } = new List<MissingSiteDTO>();
    }

    /// <summary>
    /// DTO for missing site information
    /// </summary>
    public class MissingSiteDTO
    {
        public DateTime Date { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
    }
}
