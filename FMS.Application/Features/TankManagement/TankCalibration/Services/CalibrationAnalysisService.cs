/**
 * File: CalibrationAnalysisService.cs
 * Purpose: Computes dispensed-vs-measured calibration variance from in-tank delivery records and provides
 *          tank-level health summaries combining sync status with variance analysis.
 * Dependencies: GpsdataContext, ITankCalibrationStorageService, TankCalibrationChartTypes
 * Last Modified: 2026-03-23
 *
 * Key Functions:
 * - GetVariancesAsync(): Computes variance records for recent in-tank deliveries on a given tank.
 * - GetHealthSummaryAsync(): Builds a comprehensive calibration health summary for a tank.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankCalibration.Services
{
    /// <summary>Computes calibration variance from in-tank delivery data and builds health summaries.</summary>
    public interface ICalibrationAnalysisService
    {
        /// <summary>
        /// Compute variance records for the most recent in-tank deliveries on a tank.
        /// </summary>
        Task<IReadOnlyList<CalibrationVarianceDto>> GetVariancesAsync(
            int tankId,
            int maxDeliveries = 20,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Build the full calibration health summary for a tank combining sync status and variance.
        /// </summary>
        Task<CalibrationHealthSummaryDto> GetHealthSummaryAsync(
            int tankId,
            CancellationToken cancellationToken = default);
    }

    public class CalibrationAnalysisService : ICalibrationAnalysisService
    {
        private readonly GpsdataContext _context;
        private readonly ITankCalibrationStorageService _storageService;
        private readonly ILogger<CalibrationAnalysisService> _logger;

        /// <summary>Minimum dispensed volume (litres) for a delivery to be considered meaningful for analysis.</summary>
        private const double MinDispensedForAnalysis = 1.0;

        /// <summary>Number of recent deliveries to analyse for the health summary average.</summary>
        private const int DefaultHealthWindowSize = 10;

        public CalibrationAnalysisService(
            GpsdataContext context,
            ITankCalibrationStorageService storageService,
            ILogger<CalibrationAnalysisService> logger)
        {
            _context = context;
            _storageService = storageService;
            _logger = logger;
        }

        public async Task<IReadOnlyList<CalibrationVarianceDto>> GetVariancesAsync(
            int tankId,
            int maxDeliveries = 20,
            CancellationToken cancellationToken = default)
        {
            // Fetch recent in-tank deliveries that have both measurement and dispensing data
            var deliveries = await _context.Intankdeliveries
                .AsNoTracking()
                .Where(d => d.TankId == tankId
                    && d.StartProductVolume != null
                    && d.EndProductVolume != null
                    && d.PumpsDispensedVolume != null)
                .OrderByDescending(d => d.EndDateTime)
                .Take(maxDeliveries)
                .Select(d => new
                {
                    d.DeliveryId,
                    d.TankId,
                    TankName = d.TankNavigation != null ? d.TankNavigation.Name : string.Empty,
                    d.StartDateTime,
                    d.EndDateTime,
                    d.StartProductVolume,
                    d.EndProductVolume,
                    d.AbsoluteProductVolume,
                    d.PumpsDispensedVolume
                })
                .ToListAsync(cancellationToken);

            var results = new List<CalibrationVarianceDto>();

            foreach (var d in deliveries)
            {
                double measuredDelta = (double)(d.EndProductVolume!.Value - d.StartProductVolume!.Value);
                double dispensedDelta = (double)d.PumpsDispensedVolume!.Value;
                double deliveryVolume = d.AbsoluteProductVolume.HasValue ? (double)d.AbsoluteProductVolume.Value : 0;

                // Measured delta during a delivery: the tank gained volume from the delivery and lost volume from dispensing.
                // Net measured change = EndVol - StartVol = DeliveryVolume - DispensedDuringDelivery
                // Therefore: DispensedDuringDelivery ≈ DeliveryVolume - MeasuredDelta  (if delivery known)
                // But the simpler comparison: how does measured volume change offset by delivery compare to dispensed?
                //
                // Variance approach: Compare the absolute product volume (delivery amount measured by probe)
                // against what was expected at that height per the calibration chart.
                // Since we don't have per-record chart lookups here, use the probe data directly:
                //   measured_delta = EndVol - StartVol  (total volume change including delivery)
                //   dispensed_delta = PumpsDispensedVolume (total dispensed through pumps during window)
                //   delivery_volume = AbsoluteProductVolume (volume added by delivery)
                //   Expected: measured_delta ≈ delivery_volume - dispensed_delta
                //   Variance: |measured_delta - (delivery_volume - dispensed_delta)|
                //
                // Simplified: variance = |measured_delta + dispensed_delta - delivery_volume|
                // This measures how well the calibration chart (which converts height → volume) tracks.

                double expected = deliveryVolume - dispensedDelta;
                double variance = Math.Abs(measuredDelta - expected);
                double? variancePercent = null;

                if (deliveryVolume > MinDispensedForAnalysis)
                {
                    variancePercent = (variance / deliveryVolume) * 100.0;
                }

                results.Add(new CalibrationVarianceDto
                {
                    DeliveryId = d.DeliveryId,
                    TankId = d.TankId ?? tankId,
                    TankName = d.TankName,
                    WindowStartUtc = d.StartDateTime,
                    WindowEndUtc = d.EndDateTime,
                    MeasuredDelta = Math.Round(measuredDelta, 2),
                    DispensedDelta = Math.Round(dispensedDelta, 2),
                    Variance = Math.Round(variance, 2),
                    VariancePercent = variancePercent.HasValue ? Math.Round(variancePercent.Value, 2) : null,
                    DeliveryVolume = Math.Round(deliveryVolume, 2),
                    Quality = CalibrationQuality.FromVariancePercent(variancePercent)
                });
            }

            return results;
        }

        public async Task<CalibrationHealthSummaryDto> GetHealthSummaryAsync(
            int tankId,
            CancellationToken cancellationToken = default)
        {
            // Get tank name
            var tankName = await _context.Tanks
                .AsNoTracking()
                .Where(t => t.Id == tankId)
                .Select(t => t.Name)
                .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

            var summary = new CalibrationHealthSummaryDto
            {
                TankId = tankId,
                TankName = tankName
            };

            // ----- Sync Status -----
            await PopulateSyncStatusAsync(summary, tankId, cancellationToken);

            // ----- Variance Analysis -----
            var variances = await GetVariancesAsync(tankId, DefaultHealthWindowSize, cancellationToken);
            PopulateVarianceAnalysis(summary, variances);

            return summary;
        }

        private async Task PopulateSyncStatusAsync(CalibrationHealthSummaryDto summary, int tankId, CancellationToken ct)
        {
            DateTime? latestSync = null;
            string? latestSource = null;

            var manual = await _storageService.GetLatestSnapshotAsync(tankId, TankCalibrationChartTypes.Manual, ct);
            if (manual != null)
            {
                summary.HasManualChart = true;
                summary.ManualChartRecordCount = manual.TotalRecords;
                if (!latestSync.HasValue || manual.RecordedAtUtc > latestSync.Value)
                {
                    latestSync = manual.RecordedAtUtc;
                    latestSource = manual.Source;
                }
            }

            var automatic = await _storageService.GetLatestSnapshotAsync(tankId, TankCalibrationChartTypes.Automatic, ct);
            if (automatic != null)
            {
                summary.HasAutomaticChart = true;
                summary.AutomaticChartRecordCount = automatic.TotalRecords;
                if (!latestSync.HasValue || automatic.RecordedAtUtc > latestSync.Value)
                {
                    latestSync = automatic.RecordedAtUtc;
                    latestSource = automatic.Source;
                }
            }

            var interval = await _storageService.GetLatestSnapshotAsync(tankId, TankCalibrationChartTypes.IntervalVolume, ct);
            if (interval != null)
            {
                summary.HasIntervalVolumeChart = true;
                summary.IntervalVolumeChartRecordCount = interval.TotalRecords;
                if (!latestSync.HasValue || interval.RecordedAtUtc > latestSync.Value)
                {
                    latestSync = interval.RecordedAtUtc;
                    latestSource = interval.Source;
                }
            }

            summary.LastSyncUtc = latestSync;
            summary.LastSyncSource = latestSource;
        }

        private static void PopulateVarianceAnalysis(CalibrationHealthSummaryDto summary, IReadOnlyList<CalibrationVarianceDto> variances)
        {
            summary.AnalysedDeliveryCount = variances.Count;

            if (variances.Count == 0)
            {
                summary.OverallQuality = CalibrationQuality.Insufficient;
                summary.RecommendRecalibration = false;
                summary.RecommendationNotes = "No in-tank deliveries with pump data available for analysis.";
                return;
            }

            summary.LatestVariance = variances[0]; // Already ordered by EndDateTime desc

            var withPercent = variances
                .Where(v => v.VariancePercent.HasValue)
                .ToList();

            if (withPercent.Count == 0)
            {
                summary.OverallQuality = CalibrationQuality.Insufficient;
                summary.RecommendRecalibration = false;
                summary.RecommendationNotes = "Delivery volumes are too small for meaningful variance analysis.";
                return;
            }

            summary.AverageVariancePercent = Math.Round(withPercent.Average(v => v.VariancePercent!.Value), 2);
            summary.OverallQuality = CalibrationQuality.FromVariancePercent(summary.AverageVariancePercent);

            summary.RecommendRecalibration = summary.AverageVariancePercent > CalibrationQuality.AcceptableThreshold;

            summary.RecommendationNotes = summary.OverallQuality switch
            {
                CalibrationQuality.Good => $"Calibration accuracy is good. Average variance: {summary.AverageVariancePercent}% across {withPercent.Count} deliveries.",
                CalibrationQuality.Acceptable => $"Calibration accuracy is acceptable. Average variance: {summary.AverageVariancePercent}% across {withPercent.Count} deliveries. Monitor for further drift.",
                CalibrationQuality.Poor => $"Calibration accuracy is poor. Average variance: {summary.AverageVariancePercent}% across {withPercent.Count} deliveries. Recalibration is recommended.",
                _ => null
            };
        }
    }
}
