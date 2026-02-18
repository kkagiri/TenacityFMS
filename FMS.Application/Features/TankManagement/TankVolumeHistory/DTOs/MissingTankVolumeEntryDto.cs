/**
 * File: MissingTankVolumeEntryDto.cs
 * Purpose: DTO representing a tank that is missing volume history entries for one or more dates.
 *          Used by TankVolumeEntryCheckService to collect and report missing entries.
 * Dependencies: None
 * Last Modified: 2026-02-17
 *
 * Key Properties:
 * - TankId/TankName: which tank is missing entries
 * - SiteId/SiteName: which site the tank belongs to
 * - MissingDates: all dates without entries
 * - MissingOpeningStock/MissingClosingStock: what specific entry types are missing for yesterday
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs
{
    /// <summary>
    /// Represents a tank that is missing volume history entries.
    /// </summary>
    public class MissingTankVolumeEntryDto
    {
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;

        /// <summary>
        /// Whether opening stock entry is missing for the check date.
        /// </summary>
        public bool MissingOpeningStock { get; set; }

        /// <summary>
        /// Whether closing stock entry is missing for the check date.
        /// </summary>
        public bool MissingClosingStock { get; set; }

        /// <summary>
        /// The date that was checked (typically yesterday).
        /// </summary>
        public DateTime CheckDate { get; set; }

        /// <summary>
        /// Last date that had any volume history entry for this tank.
        /// </summary>
        public DateTime? LastEntryDate { get; set; }

        /// <summary>
        /// Returns the missing entry type as a string: "OpeningStock", "ClosingStock", or "Both".
        /// </summary>
        public string MissingEntryType
        {
            get
            {
                if (MissingOpeningStock && MissingClosingStock)
                    return "Both";
                if (MissingOpeningStock)
                    return "OpeningStock";
                if (MissingClosingStock)
                    return "ClosingStock";
                return "None";
            }
        }
    }
}
