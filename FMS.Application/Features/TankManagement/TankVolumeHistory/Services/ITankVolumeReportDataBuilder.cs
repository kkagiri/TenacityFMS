/**
 * File: ITankVolumeReportDataBuilder.cs
 * Purpose: Interface for the shared report data builder used by both on-demand and scheduled paths.
 * Dependencies: TankVolumeHistoryDTO, TankVolumeReportContext
 * Last Modified: 2026-02-26
 *
 * Key Methods:
 * - BuildTankVolumeHistoryPayload: Shapes records into TankVolumeHistory template-ready data.
 * - BuildTransactionHistorySummaryPayload: Shapes records into monthly summary template-ready data.
 */
using System.Collections.Generic;
using FMS.Application.Features.FMS.TankVolumeHistory;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Services
{
    /// <summary>
    /// Shared report data builder that shapes <see cref="TankVolumeHistoryDTO"/> records
    /// into template-ready payloads for jsReport Handlebars templates.
    /// Used by both ReportJobManager (on-demand) and ScheduledReportDeliveryService (scheduled).
    /// </summary>
    public interface ITankVolumeReportDataBuilder
    {
        /// <summary>
        /// Builds the full template-ready payload for the TankVolumeHistory report.
        /// Includes tank summaries with consumption trends, sparklines, variance, and transaction detail rows.
        /// </summary>
        /// <param name="records">Raw records from GetTankVolumeHistoryFilteredQuery.</param>
        /// <param name="context">Report metadata (title, date range, timezone, etc.).</param>
        /// <returns>Anonymous/JToken payload matching the TankVolumeHistory Handlebars template.</returns>
        object BuildTankVolumeHistoryPayload(
            IReadOnlyCollection<TankVolumeHistoryDTO> records,
            TankVolumeReportContext context);

        /// <summary>
        /// Builds the monthly-aggregated summary payload for the TransactionHistorySummary report.
        /// Groups records by month → site → tank with totals for dispensing, delivery, transfer, and variance.
        /// </summary>
        /// <param name="records">Raw records from GetTankVolumeHistoryFilteredQuery.</param>
        /// <param name="context">Report metadata (title, date range, timezone, etc.).</param>
        /// <returns>Anonymous/JToken payload matching the TransactionHistorySummary Handlebars template.</returns>
        object BuildTransactionHistorySummaryPayload(
            IReadOnlyCollection<TankVolumeHistoryDTO> records,
            TankVolumeReportContext context);
    }
}
