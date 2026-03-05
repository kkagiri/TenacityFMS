/**
 * File: TankVolumeReportContext.cs
 * Purpose: Input parameters for the shared TankVolumeReportDataBuilder.
 *          Carries filter/display metadata that both on-demand and scheduled callers supply.
 * Dependencies: None
 * Last Modified: 2026-02-26
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Services
{
    /// <summary>
    /// Context object passed to the shared report data builder.
    /// Contains all the metadata both on-demand and scheduled callers provide.
    /// </summary>
    public class TankVolumeReportContext
    {
        /// <summary>Title shown at the top of the report.</summary>
        public string? ReportTitle { get; set; }

        /// <summary>Subtitle (e.g. "All Tanks - Site X").</summary>
        public string? ReportSubtitle { get; set; }

        /// <summary>User who triggered the report.</summary>
        public string? CreatedBy { get; set; }

        /// <summary>Start of the reporting window (local time for display).</summary>
        public DateTime? DateFrom { get; set; }

        /// <summary>End of the reporting window (local time for display).</summary>
        public DateTime? DateTo { get; set; }

        /// <summary>Site filter applied (for subtitle generation).</summary>
        public int? SiteFilterId { get; set; }

        /// <summary>Tank filter applied (for subtitle generation).</summary>
        public int? TankFilterId { get; set; }

        /// <summary>
        /// IANA or Windows timezone ID for converting UTC timestamps to local time.
        /// Defaults to "E. Africa Standard Time" (UTC+3) if null.
        /// </summary>
        public string? TimezoneId { get; set; }

        /// <summary>
        /// Optional lookup of TankId → TankName. If null, TankName is read from the DTO records themselves.
        /// Scheduled path provides this from DB; on-demand path relies on DTO TankName.
        /// </summary>
        public IReadOnlyDictionary<int, string>? TankNameLookup { get; set; }
    }
}
