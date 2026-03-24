/**
 * File: CalibrationLearningChartMathTests.cs
 * Purpose: Unit tests for CalibrationLearningChartMath — pure deterministic math helpers for
 *          seeded interval baselines, chart comparison, seeded-baseline detection, chart notes,
 *          and confidence indicator logic.
 * Dependencies: xUnit, FMS.Application (InternalsVisibleTo), FMS.Domain
 * Last Modified: 2026-03-25
 */
using System.Collections.Generic;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration.Services;
using FMS.Domain.Entities.Features.TankStockManagement;
using Xunit;

namespace FMS.Testing.Calibration
{
    public class CalibrationLearningChartMathTests
    {
        #region BuildSeededIntervalBaselines

        [Fact]
        public void BuildSeededIntervalBaselines_TwoRecords_ProducesSingleInterval()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 50, Volume = 500 },
            };

            var result = CalibrationLearningChartMath.BuildSeededIntervalBaselines(records, 50);

            Assert.Single(result);
            Assert.True(result.ContainsKey(0));
            // volumePerMm = 500 / 50 = 10.0
            Assert.Equal(10.000000m, result[0]);
        }

        [Fact]
        public void BuildSeededIntervalBaselines_MultipleSegments_WeightsCorrectly()
        {
            // Segment 1: 0→100 = 1000 litres → 10 vol/mm
            // Segment 2: 100→200 = 2000 litres → 20 vol/mm
            // Interval 0 (0-50): fully covered by segment 1 → 10
            // Interval 50 (50-100): fully covered by segment 1 → 10
            // Interval 100 (100-150): fully covered by segment 2 → 20
            // Interval 150 (150-200): fully covered by segment 2 → 20
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 100, Volume = 1000 },
                new() { Height = 200, Volume = 3000 },
            };

            var result = CalibrationLearningChartMath.BuildSeededIntervalBaselines(records, 50);

            Assert.Equal(4, result.Count);
            Assert.Equal(10.000000m, result[0]);
            Assert.Equal(10.000000m, result[50]);
            Assert.Equal(20.000000m, result[100]);
            Assert.Equal(20.000000m, result[150]);
        }

        [Fact]
        public void BuildSeededIntervalBaselines_EmptyRecords_ReturnsEmpty()
        {
            var result = CalibrationLearningChartMath.BuildSeededIntervalBaselines(
                new List<TankCalibrationRecordDto>(), 50);

            Assert.Empty(result);
        }

        [Fact]
        public void BuildSeededIntervalBaselines_SingleRecord_ReturnsEmpty()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
            };

            var result = CalibrationLearningChartMath.BuildSeededIntervalBaselines(records, 50);

            Assert.Empty(result);
        }

        [Fact]
        public void BuildSeededIntervalBaselines_NegativeVolumeDelta_SkipsSegment()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 1000 },
                new() { Height = 50, Volume = 500 }, // decreasing volume
                new() { Height = 100, Volume = 1500 },
            };

            var result = CalibrationLearningChartMath.BuildSeededIntervalBaselines(records, 50);

            // First segment (0→50) has negative volume delta → skipped
            // Second segment (50→100) = 1000 volume / 50 height = 20
            Assert.True(result.ContainsKey(50));
            Assert.Equal(20.000000m, result[50]);
        }

        [Fact]
        public void BuildSeededIntervalBaselines_DuplicateHeights_SkipsZeroDeltaSegment()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 0, Volume = 100 }, // same height
                new() { Height = 50, Volume = 600 },
            };

            var result = CalibrationLearningChartMath.BuildSeededIntervalBaselines(records, 50);

            // First segment (0→0) skipped because heightDelta = 0 (current.Height <= previous.Height)
            // Second segment (0→50) = 500 / 50 = 10
            Assert.True(result.ContainsKey(0));
            Assert.Equal(10.000000m, result[0]);
        }

        #endregion

        #region BuildComparison

        [Fact]
        public void BuildComparison_IdenticalCharts_ZeroDeviation()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 50, Volume = 500 },
                new() { Height = 100, Volume = 1000 },
            };

            var accumulationLookup = new Dictionary<int, CalibrationIntervalAccumulation>
            {
                [0] = new() { ObservationCount = 10, MeanVolumePerMm = 10m },
                [50] = new() { ObservationCount = 10, MeanVolumePerMm = 10m },
            };

            var result = CalibrationLearningChartMath.BuildComparison(
                records, records, accumulationLookup, 50, 5, "reference", "compared");

            Assert.NotEmpty(result);
            foreach (var comparison in result)
            {
                Assert.Equal(0m, comparison.AbsoluteVolumeDeviation);
            }
        }

        [Fact]
        public void BuildComparison_DifferentCharts_NonZeroDeviation()
        {
            var referenceRecords = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 100, Volume = 1000 },
            };

            var comparedRecords = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 100, Volume = 1100 },
            };

            var accumulationLookup = new Dictionary<int, CalibrationIntervalAccumulation>();

            var result = CalibrationLearningChartMath.BuildComparison(
                referenceRecords, comparedRecords, accumulationLookup, 50, 5, "manual", "learned");

            Assert.NotEmpty(result);
            Assert.All(result, c =>
            {
                Assert.Equal("manual", c.ReferenceChartType);
                Assert.Equal("learned", c.ComparedChartType);
            });
            // At height 100, reference=1000, compared=1100, deviation=100
            var last = result[^1];
            Assert.True(last.AbsoluteVolumeDeviation > 0);
        }

        [Fact]
        public void BuildComparison_InsufficientRecords_ReturnsEmpty()
        {
            var singleRecord = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
            };

            var result = CalibrationLearningChartMath.BuildComparison(
                singleRecord, singleRecord,
                new Dictionary<int, CalibrationIntervalAccumulation>(),
                50, 5, "a", "b");

            Assert.Empty(result);
        }

        [Fact]
        public void BuildComparison_SetsConfidenceIndicator()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 50, Volume = 500 },
            };

            var accumulationLookup = new Dictionary<int, CalibrationIntervalAccumulation>
            {
                [0] = new() { ObservationCount = 20, MeanVolumePerMm = 10m },
            };

            var result = CalibrationLearningChartMath.BuildComparison(
                records, records, accumulationLookup, 50, 5, "ref", "cmp");

            Assert.NotEmpty(result);
            // 20 observations >= 5 * 2 → "high"
            Assert.Equal("high", result[0].ConfidenceIndicator);
        }

        #endregion

        #region IsSeededBaseline

        [Fact]
        public void IsSeededBaseline_ZeroObservationsPositiveVolume_ReturnsTrue()
        {
            var accumulation = new CalibrationIntervalAccumulation
            {
                ObservationCount = 0,
                MeanVolumePerMm = 5.5m,
            };

            Assert.True(CalibrationLearningChartMath.IsSeededBaseline(accumulation));
        }

        [Fact]
        public void IsSeededBaseline_HasObservations_ReturnsFalse()
        {
            var accumulation = new CalibrationIntervalAccumulation
            {
                ObservationCount = 3,
                MeanVolumePerMm = 5.5m,
            };

            Assert.False(CalibrationLearningChartMath.IsSeededBaseline(accumulation));
        }

        [Fact]
        public void IsSeededBaseline_ZeroObservationsZeroVolume_ReturnsFalse()
        {
            var accumulation = new CalibrationIntervalAccumulation
            {
                ObservationCount = 0,
                MeanVolumePerMm = 0m,
            };

            Assert.False(CalibrationLearningChartMath.IsSeededBaseline(accumulation));
        }

        [Fact]
        public void IsSeededBaseline_ZeroObservationsNegativeVolume_ReturnsFalse()
        {
            var accumulation = new CalibrationIntervalAccumulation
            {
                ObservationCount = 0,
                MeanVolumePerMm = -1m,
            };

            Assert.False(CalibrationLearningChartMath.IsSeededBaseline(accumulation));
        }

        #endregion

        #region BuildLearnedChartNotes

        [Fact]
        public void BuildLearnedChartNotes_FormatsCorrectly()
        {
            var notes = CalibrationLearningChartMath.BuildLearnedChartNotes(
                readyIntervalCount: 10,
                seededIntervalCount: 5,
                sparseIntervalCount: 3,
                emptyIntervalCount: 2,
                totalIntervalCount: 20,
                gapIntervalCount: 1,
                minObservationsPerInterval: 5);

            Assert.Equal(
                "Coverage ready=10/20; seeded=5; sparse=3; empty=2; gaps=1; threshold=5 observations per interval.",
                notes);
        }

        [Fact]
        public void BuildLearnedChartNotes_AllZeros_StillFormats()
        {
            var notes = CalibrationLearningChartMath.BuildLearnedChartNotes(0, 0, 0, 0, 0, 0, 0);

            Assert.Equal(
                "Coverage ready=0/0; seeded=0; sparse=0; empty=0; gaps=0; threshold=0 observations per interval.",
                notes);
        }

        #endregion

        #region DetermineConfidenceIndicator (tested via BuildComparison)

        [Fact]
        public void BuildComparison_NullAccumulation_ReturnsNoneConfidence()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 50, Volume = 500 },
            };

            // No accumulation data at all
            var emptyLookup = new Dictionary<int, CalibrationIntervalAccumulation>();

            var result = CalibrationLearningChartMath.BuildComparison(
                records, records, emptyLookup, 50, 5, "ref", "cmp");

            Assert.NotEmpty(result);
            Assert.Equal("none", result[0].ConfidenceIndicator);
        }

        [Fact]
        public void BuildComparison_SeededAccumulation_ReturnsSeededConfidence()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 50, Volume = 500 },
            };

            var accumulationLookup = new Dictionary<int, CalibrationIntervalAccumulation>
            {
                [0] = new() { ObservationCount = 0, MeanVolumePerMm = 10m }, // seeded baseline
            };

            var result = CalibrationLearningChartMath.BuildComparison(
                records, records, accumulationLookup, 50, 5, "ref", "cmp");

            Assert.NotEmpty(result);
            Assert.Equal("seeded", result[0].ConfidenceIndicator);
        }

        [Fact]
        public void BuildComparison_LowObservations_ReturnsLowConfidence()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 50, Volume = 500 },
            };

            var accumulationLookup = new Dictionary<int, CalibrationIntervalAccumulation>
            {
                [0] = new() { ObservationCount = 2, MeanVolumePerMm = 10m },
            };

            // minObservationsPerInterval=5, obs=2: 2 < 5 but 2 > 0 → "low"
            var result = CalibrationLearningChartMath.BuildComparison(
                records, records, accumulationLookup, 50, 5, "ref", "cmp");

            Assert.NotEmpty(result);
            Assert.Equal("low", result[0].ConfidenceIndicator);
        }

        [Fact]
        public void BuildComparison_MediumObservations_ReturnsMediumConfidence()
        {
            var records = new List<TankCalibrationRecordDto>
            {
                new() { Height = 0, Volume = 0 },
                new() { Height = 50, Volume = 500 },
            };

            var accumulationLookup = new Dictionary<int, CalibrationIntervalAccumulation>
            {
                [0] = new() { ObservationCount = 7, MeanVolumePerMm = 10m },
            };

            // minObservationsPerInterval=5, obs=7: 7 >= 5 but 7 < 10 → "medium"
            var result = CalibrationLearningChartMath.BuildComparison(
                records, records, accumulationLookup, 50, 5, "ref", "cmp");

            Assert.NotEmpty(result);
            Assert.Equal("medium", result[0].ConfidenceIndicator);
        }

        #endregion
    }
}
