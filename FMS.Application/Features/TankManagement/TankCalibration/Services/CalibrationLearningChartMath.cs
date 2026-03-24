/**
 * File: CalibrationLearningChartMath.cs
 * Purpose: Shared chart math helpers for learned-calibration seeding, comparison, and coverage metadata.
 * Dependencies: System, Tank calibration DTOs, CalibrationIntervalAccumulation
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - BuildSeededIntervalBaselines(): Converts a stored chart into fixed interval baseline values.
 * - BuildComparison(): Normalizes two charts to common intervals and calculates interval deviations.
 * - IsSeededBaseline(): Identifies accumulation rows that came only from a seed chart.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Domain.Entities.Features.TankStockManagement;

namespace FMS.Application.Features.TankManagement.TankCalibration.Services
{
    internal static class CalibrationLearningChartMath
    {
        public static SortedDictionary<int, decimal> BuildSeededIntervalBaselines(
            IReadOnlyList<TankCalibrationRecordDto> records,
            int heightIntervalMm)
        {
            var weightedIntervals = new Dictionary<int, (decimal WeightedVolumePerMmSum, decimal CoveredHeightMm)>();

            for (var index = 1; index < records.Count; index++)
            {
                var previous = records[index - 1];
                var current = records[index];
                if (current.Height <= previous.Height)
                {
                    continue;
                }

                var heightDeltaMm = current.Height - previous.Height;
                var volumeDelta = current.Volume - previous.Volume;
                if (volumeDelta < 0)
                {
                    continue;
                }

                var volumePerMm = Math.Round((decimal)volumeDelta / heightDeltaMm, 6, MidpointRounding.AwayFromZero);
                decimal segmentStartMm = previous.Height;
                decimal segmentEndMm = current.Height;

                var intervalStartMm = (int)Math.Floor(segmentStartMm / heightIntervalMm) * heightIntervalMm;
                while (intervalStartMm < segmentEndMm)
                {
                    var intervalEndMm = intervalStartMm + heightIntervalMm;
                    var overlapStartMm = Math.Max(segmentStartMm, intervalStartMm);
                    var overlapEndMm = Math.Min(segmentEndMm, intervalEndMm);
                    var coveredHeightMm = overlapEndMm - overlapStartMm;

                    if (coveredHeightMm > 0)
                    {
                        if (!weightedIntervals.TryGetValue(intervalStartMm, out var aggregate))
                        {
                            aggregate = (0m, 0m);
                        }

                        aggregate.WeightedVolumePerMmSum += volumePerMm * coveredHeightMm;
                        aggregate.CoveredHeightMm += coveredHeightMm;
                        weightedIntervals[intervalStartMm] = aggregate;
                    }

                    intervalStartMm += heightIntervalMm;
                }
            }

            return new SortedDictionary<int, decimal>(weightedIntervals.ToDictionary(
                item => item.Key,
                item => item.Value.CoveredHeightMm <= 0m
                    ? 0m
                    : Math.Round(item.Value.WeightedVolumePerMmSum / item.Value.CoveredHeightMm, 6, MidpointRounding.AwayFromZero)));
        }

        public static List<CalibrationComparisonDto> BuildComparison(
            IReadOnlyList<TankCalibrationRecordDto> referenceRecords,
            IReadOnlyList<TankCalibrationRecordDto> comparedRecords,
            IReadOnlyDictionary<int, CalibrationIntervalAccumulation> accumulationLookup,
            int heightIntervalMm,
            int minObservationsPerInterval,
            string referenceChartType,
            string comparedChartType)
        {
            var normalizedReferenceRecords = NormalizeRecords(referenceRecords);
            var normalizedComparedRecords = NormalizeRecords(comparedRecords);
            if (normalizedReferenceRecords.Count < 2 || normalizedComparedRecords.Count < 2)
            {
                return new List<CalibrationComparisonDto>();
            }

            var maxComparableHeight = Math.Min(
                normalizedReferenceRecords.Max(item => item.Height),
                normalizedComparedRecords.Max(item => item.Height));

            if (maxComparableHeight <= 0)
            {
                return new List<CalibrationComparisonDto>();
            }

            var comparisons = new List<CalibrationComparisonDto>();
            for (var intervalStartMm = 0; intervalStartMm < maxComparableHeight; intervalStartMm += heightIntervalMm)
            {
                var intervalEndMm = Math.Min(intervalStartMm + heightIntervalMm, maxComparableHeight);
                if (intervalEndMm <= intervalStartMm)
                {
                    continue;
                }

                var referenceVolume = TryGetInterpolatedVolume(normalizedReferenceRecords, intervalEndMm);
                var comparedVolume = TryGetInterpolatedVolume(normalizedComparedRecords, intervalEndMm);
                if (!referenceVolume.HasValue || !comparedVolume.HasValue)
                {
                    continue;
                }

                accumulationLookup.TryGetValue(intervalStartMm, out var accumulation);
                var absoluteDeviation = Math.Round(Math.Abs(comparedVolume.Value - referenceVolume.Value), 3, MidpointRounding.AwayFromZero);
                var percentageDeviation = referenceVolume.Value == 0
                    ? (double?)null
                    : Math.Round((double)(absoluteDeviation / referenceVolume.Value * 100m), 2);

                comparisons.Add(new CalibrationComparisonDto
                {
                    IntervalStartMm = intervalStartMm,
                    IntervalEndMm = intervalEndMm,
                    ReferenceChartType = referenceChartType,
                    ComparedChartType = comparedChartType,
                    ReferenceVolume = referenceVolume.Value,
                    ComparedVolume = comparedVolume.Value,
                    AbsoluteVolumeDeviation = absoluteDeviation,
                    PercentageDeviation = percentageDeviation,
                    ObservationCount = accumulation?.ObservationCount ?? 0,
                    ConfidenceIndicator = DetermineConfidenceIndicator(accumulation, minObservationsPerInterval),
                });
            }

            return comparisons;
        }

        public static string BuildLearnedChartNotes(
            int readyIntervalCount,
            int seededIntervalCount,
            int sparseIntervalCount,
            int emptyIntervalCount,
            int totalIntervalCount,
            int gapIntervalCount,
            int minObservationsPerInterval)
        {
            return $"Coverage ready={readyIntervalCount}/{totalIntervalCount}; seeded={seededIntervalCount}; sparse={sparseIntervalCount}; empty={emptyIntervalCount}; gaps={gapIntervalCount}; threshold={minObservationsPerInterval} observations per interval.";
        }

        public static bool IsSeededBaseline(CalibrationIntervalAccumulation accumulation)
        {
            return accumulation.ObservationCount == 0 && accumulation.MeanVolumePerMm > 0;
        }

        private static List<TankCalibrationRecordDto> NormalizeRecords(IReadOnlyList<TankCalibrationRecordDto> records)
        {
            return records
                .Where(item => item.Height >= 0)
                .GroupBy(item => item.Height)
                .Select(group => group.OrderByDescending(item => item.Volume).First())
                .OrderBy(item => item.Height)
                .ToList();
        }

        private static decimal? TryGetInterpolatedVolume(IReadOnlyList<TankCalibrationRecordDto> records, int heightMm)
        {
            if (records.Count == 0)
            {
                return null;
            }

            if (heightMm < records[0].Height || heightMm > records[^1].Height)
            {
                return null;
            }

            for (var index = 0; index < records.Count; index++)
            {
                if (records[index].Height == heightMm)
                {
                    return records[index].Volume;
                }

                if (records[index].Height > heightMm)
                {
                    if (index == 0)
                    {
                        return null;
                    }

                    var previous = records[index - 1];
                    var next = records[index];
                    var heightSpan = next.Height - previous.Height;
                    if (heightSpan <= 0)
                    {
                        return previous.Volume;
                    }

                    var heightOffset = heightMm - previous.Height;
                    var interpolatedVolume = previous.Volume
                        + ((decimal)(next.Volume - previous.Volume) * heightOffset / heightSpan);

                    return Math.Round(interpolatedVolume, 3, MidpointRounding.AwayFromZero);
                }
            }

            return records[^1].Volume;
        }

        private static string DetermineConfidenceIndicator(
            CalibrationIntervalAccumulation? accumulation,
            int minObservationsPerInterval)
        {
            if (accumulation == null)
            {
                return "none";
            }

            if (IsSeededBaseline(accumulation))
            {
                return "seeded";
            }

            if (accumulation.ObservationCount >= minObservationsPerInterval * 2)
            {
                return "high";
            }

            if (accumulation.ObservationCount >= minObservationsPerInterval)
            {
                return "medium";
            }

            return accumulation.ObservationCount > 0 ? "low" : "none";
        }
    }
}